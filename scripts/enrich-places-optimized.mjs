/**
 * Optimized Places API enrichment using Autocomplete + Place Details
 * ~6x cheaper than Text Search: $5.83/1K vs $32/1K
 * $200 free credit = ~34,300 records
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/enrich-places-optimized.mjs
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/enrich-places-optimized.mjs --limit=5000
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/enrich-places-optimized.mjs --scope=all
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/enrich-places-optimized.mjs --scope=midwest
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/enrich-places-optimized.mjs --dry-run --limit=10
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY; // API key removed — enrichment complete, do not re-run without budget review

if (!SERVICE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY required'); process.exit(1); }

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const args = process.argv.slice(2);
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '30000');
const DRY_RUN = args.includes('--dry-run');
const SCOPE = args.find(a => a.startsWith('--scope='))?.split('=')[1] || 'all';

// API endpoints
const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const DETAILS_URL = 'https://places.googleapis.com/v1/places/';

let stats = { processed: 0, enriched: 0, skipped: 0, errors: 0, apiCalls: 0, costCents: 0 };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Step 1: Autocomplete to find place_id (~$2.83/1K)
 */
async function findPlaceId(firmName, locationHint) {
  stats.apiCalls++;
  stats.costCents += 0.283; // $2.83/1K

  const input = locationHint
    ? `${firmName} ${locationHint}`
    : `${firmName} venture capital`;

  try {
    const res = await fetch(AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_KEY,
      },
      body: JSON.stringify({
        input,
        includedPrimaryTypes: ['establishment'],
        languageCode: 'en',
        regionCode: 'US',
      }),
    });

    if (!res.ok) {
      if (res.status === 403) {
        const err = await res.text();
        console.error('\n[FATAL] Places API 403. Enable "Places API (New)" in Google Cloud Console.');
        console.error(err.substring(0, 300));
        process.exit(1);
      }
      if (res.status === 429) {
        await sleep(5000);
        stats.apiCalls--;
        stats.costCents -= 0.283;
        return findPlaceId(firmName, locationHint);
      }
      return null;
    }

    const data = await res.json();
    if (!data.suggestions || data.suggestions.length === 0) return null;

    const suggestion = data.suggestions[0];
    if (!suggestion.placePrediction?.placeId) return null;

    // Basic relevance check on the suggestion text
    const sugText = (suggestion.placePrediction.text?.text || '').toLowerCase();
    const firmLower = firmName.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const firmTokens = firmLower.split(/\s+/).filter(t => t.length > 2);
    const matchCount = firmTokens.filter(t => sugText.includes(t)).length;

    if (matchCount < Math.max(1, firmTokens.length * 0.25)) return null;

    return suggestion.placePrediction.placeId;
  } catch (err) {
    return null;
  }
}

/**
 * Step 2a: Place Details BASIC (FREE) to validate business type
 */
async function validatePlace(placeId) {
  stats.apiCalls++;
  // Basic fields are FREE — no cost added

  try {
    const res = await fetch(`${DETAILS_URL}${placeId}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': 'displayName,formattedAddress,addressComponents,location,types,businessStatus',
      },
    });

    if (!res.ok) {
      if (res.status === 429) { await sleep(5000); stats.apiCalls--; return validatePlace(placeId); }
      return null;
    }

    const place = await res.json();

    // Validate: reject clearly wrong business types
    const types = place.types || [];
    const BAD_TYPES = [
      'restaurant', 'food', 'bar', 'cafe', 'bakery', 'meal_delivery',
      'lodging', 'hotel', 'motel',
      'park', 'amusement_park', 'campground', 'rv_park',
      'gym', 'spa', 'beauty_salon', 'hair_care', 'laundry',
      'car_dealer', 'car_repair', 'car_wash', 'gas_station',
      'hospital', 'doctor', 'dentist', 'pharmacy', 'veterinary_care',
      'church', 'mosque', 'synagogue', 'hindu_temple',
      'school', 'primary_school', 'secondary_school',
      'store', 'clothing_store', 'hardware_store', 'grocery_or_supermarket',
      'plumber', 'electrician', 'roofing_contractor', 'painter',
      'moving_company', 'storage', 'funeral_home',
      'museum', 'library', 'city_hall', 'fire_station', 'police',
      'transit_station', 'bus_station', 'train_station', 'airport',
      'marina', 'boat_rental', 'tourist_attraction', 'zoo', 'aquarium',
      'bowling_alley', 'movie_theater', 'night_club', 'casino',
    ];

    if (types.some(t => BAD_TYPES.includes(t))) {
      return null; // Not a financial/professional firm
    }

    return place;
  } catch (err) {
    return null;
  }
}

/**
 * Step 2b: Place Details CONTACT ($3/1K) — only for validated places
 */
async function getContactDetails(placeId) {
  stats.apiCalls++;
  stats.costCents += 0.3; // $3/1K for contact fields

  try {
    const res = await fetch(`${DETAILS_URL}${placeId}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': 'websiteUri,nationalPhoneNumber',
      },
    });

    if (!res.ok) {
      if (res.status === 429) { await sleep(5000); stats.apiCalls--; stats.costCents -= 0.3; return getContactDetails(placeId); }
      return null;
    }

    return await res.json();
  } catch (err) {
    return null;
  }
}

/**
 * Extract structured data from Place Details
 */
function extractData(place) {
  const result = {};

  if (place.websiteUri) result.website = place.websiteUri;
  if (place.formattedAddress) result.address = place.formattedAddress;
  if (place.nationalPhoneNumber) result.phone = place.nationalPhoneNumber;
  if (place.businessStatus) result.status = place.businessStatus;
  if (place.location) {
    result.lat = place.location.latitude;
    result.lng = place.location.longitude;
  }

  if (place.addressComponents) {
    const state = place.addressComponents.find(c => c.types?.includes('administrative_area_level_1'));
    const city = place.addressComponents.find(c => c.types?.includes('locality'));
    if (state) result.state = state.shortText;
    if (city) result.city = city.longText;
  }

  return result;
}

/**
 * Extract location hint from description
 */
function extractLocation(desc) {
  if (!desc) return null;
  const m = desc.match(/\[Location:\s*([^\]]+)\]/);
  return m ? m[1].trim() : null;
}

/**
 * Fetch records to enrich, prioritized
 */
async function fetchRecords(limit, scope) {
  const records = [];
  const batchSize = 1000;

  if (scope === 'midwest' || scope === 'all') {
    // Priority 1: Chicago-focused, no website, not yet enriched
    let { data: p1 } = await sb.from('funding_opportunities')
      .select('id, name, description, website, opportunity_type, chicago_focused')
      .eq('chicago_focused', true)
      .is('website', null)
      .not('description', 'ilike', '%Phone:%')
      .limit(Math.min(limit, 3000));
    if (p1?.length) { records.push(...p1); console.log(`  P1 Chicago no-web: ${p1.length}`); }

    // Priority 2: Midwest states, no website
    if (records.length < limit) {
      const mwTerms = ['Indiana', 'Michigan', 'Ohio', 'Wisconsin', 'Minnesota', 'Missouri', 'Iowa',
        'Indianapolis', 'Detroit', 'Columbus', 'Cleveland', 'Cincinnati', 'Milwaukee', 'Minneapolis'];
      const orF = mwTerms.map(t => `description.ilike.%${t}%`).join(',');
      const { data: p2 } = await sb.from('funding_opportunities')
        .select('id, name, description, website, opportunity_type, chicago_focused')
        .is('website', null)
        .not('description', 'ilike', '%Phone:%')
        .or(orF)
        .limit(Math.min(limit - records.length, 3000));
      if (p2?.length) { records.push(...p2); console.log(`  P2 Midwest no-web: ${p2.length}`); }
    }
  }

  if (scope === 'all' && records.length < limit) {
    // Priority 3: Any record with description but no website, not yet enriched
    let offset = 0;
    while (records.length < limit) {
      const { data: p3 } = await sb.from('funding_opportunities')
        .select('id, name, description, website, opportunity_type, chicago_focused')
        .is('website', null)
        .not('description', 'is', null)
        .not('description', 'ilike', '%Phone:%')
        .range(offset, offset + batchSize - 1);
      if (!p3?.length) break;
      records.push(...p3);
      offset += batchSize;
      if (records.length >= limit) break;
    }
    console.log(`  P3 National no-web (with desc): ${records.length}`);
  }

  if (scope === 'all' && records.length < limit) {
    // Priority 4: Records with no description and no website (name-only shells)
    let offset = 0;
    while (records.length < limit) {
      const { data: p4 } = await sb.from('funding_opportunities')
        .select('id, name, description, website, opportunity_type, chicago_focused')
        .is('website', null)
        .is('description', null)
        .range(offset, offset + batchSize - 1);
      if (!p4?.length) break;
      records.push(...p4);
      offset += batchSize;
      if (records.length >= limit) break;
    }
    console.log(`  P4 Shells (name only): ${records.length}`);
  }

  // Deduplicate by id
  const seen = new Set();
  return records.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; }).slice(0, limit);
}

async function main() {
  console.log('=== Optimized Places API Enrichment (Autocomplete + Details) ===');
  console.log(`Scope: ${SCOPE} | Limit: ${LIMIT} | Dry run: ${DRY_RUN}`);
  console.log(`Cost model: ~$5.83/1K records (vs $32/1K with Text Search)\n`);

  console.log('Fetching records...');
  const records = await fetchRecords(LIMIT, SCOPE);
  console.log(`\nTotal to process: ${records.length}`);
  console.log(`Estimated cost: $${(records.length * 0.00583).toFixed(2)}`);
  console.log(`Budget remaining: ~$${(200 - 68 - 10).toFixed(0)} (est)\n`);

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    stats.processed++;

    const locationHint = extractLocation(rec.description);

    // Step 1: Find place_id via Autocomplete ($2.83/1K)
    const placeId = await findPlaceId(rec.name, locationHint);

    if (!placeId) {
      stats.skipped++;
      if (stats.processed % 500 === 0) printProgress(records.length);
      await sleep(50);
      continue;
    }

    // Step 2a: Validate business type (FREE)
    const validatedPlace = await validatePlace(placeId);

    if (!validatedPlace) {
      stats.skipped++;
      await sleep(50);
      continue;
    }

    // Step 2b: Get contact details ($3/1K) — only for validated places
    const contact = await getContactDetails(placeId);

    // Merge basic + contact data
    const place = { ...validatedPlace, ...(contact || {}) };
    const data = extractData(place);

    // Build update
    const update = {};

    if (data.website && !rec.website) update.website = data.website;

    // Build enriched description
    const parts = [];
    if (rec.description) {
      parts.push(rec.description.replace(/\s*\[Location:[^\]]*\]\s*/g, '').replace(/\s*\[Phone:[^\]]*\]\s*/g, '').trim());
    }
    if (data.address) parts.push(`[Location: ${data.address}]`);
    if (data.phone) parts.push(`[Phone: ${data.phone}]`);

    if (parts.length > 0) update.description = parts.join(' ').substring(0, 2000);

    if (data.state === 'IL' && !rec.chicago_focused) update.chicago_focused = true;

    if (Object.keys(update).length === 0) {
      stats.skipped++;
      await sleep(50);
      continue;
    }

    if (!DRY_RUN) {
      const { error } = await sb.from('funding_opportunities').update(update).eq('id', rec.id);
      if (error) {
        stats.errors++;
      } else {
        stats.enriched++;
      }
    } else {
      stats.enriched++;
      if (stats.enriched <= 5) {
        console.log(`  [DRY] "${rec.name}" → website: ${data.website || 'N/A'}, addr: ${data.address || 'N/A'}`);
      }
    }

    if (stats.processed % 500 === 0) printProgress(records.length);

    // Rate limit: ~10 req/sec (we make 2 calls per record)
    await sleep(100);

    // Budget guard: stop at $180 to leave buffer
    if (stats.costCents > 18000) {
      console.log('\n[BUDGET GUARD] Approaching $180 spend limit. Stopping.');
      break;
    }
  }

  printProgress(records.length);

  console.log('\n=== ENRICHMENT COMPLETE ===');
  console.log(`  Processed: ${stats.processed}`);
  console.log(`  Enriched: ${stats.enriched}`);
  console.log(`  Not found: ${stats.skipped}`);
  console.log(`  Errors: ${stats.errors}`);
  console.log(`  API calls: ${stats.apiCalls}`);
  console.log(`  Estimated cost: $${(stats.costCents / 100).toFixed(2)}`);

  if (!DRY_RUN) {
    const { count } = await sb.from('funding_opportunities').select('*', { count: 'exact', head: true }).not('website', 'is', null);
    const { count: phone } = await sb.from('funding_opportunities').select('*', { count: 'exact', head: true }).ilike('description', '%Phone:%');
    console.log(`\n  Records with website: ${count}`);
    console.log(`  Records with phone: ${phone}`);
  }
}

function printProgress(total) {
  const pct = Math.round(stats.processed / total * 100);
  console.log(`  [${stats.processed}/${total}] (${pct}%) ${stats.enriched} enriched, ${stats.skipped} skipped, ${stats.errors} err | $${(stats.costCents / 100).toFixed(2)} spent | ${stats.apiCalls} API calls`);
}

main().catch(console.error);
