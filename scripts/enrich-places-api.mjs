/**
 * Enrich Midwest investor records using Google Places API (New)
 * Prioritizes: Chicago → IL → Midwest states
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx GOOGLE_API_KEY=xxx node scripts/enrich-places-api.mjs
 *
 *   Optional flags:
 *     --limit=1000        Max records to enrich (default: 6000)
 *     --dry-run           Don't update DB, just log what would happen
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY; // API key removed — enrichment complete, do not re-run without budget review

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const args = process.argv.slice(2);
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '6000');
const DRY_RUN = args.includes('--dry-run');

// Places API (New) endpoints
const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places/';

const MIDWEST_STATES = ['IL', 'IN', 'MI', 'OH', 'WI', 'MN', 'MO', 'IA'];
const MIDWEST_KEYWORDS = [
  'Chicago', 'Illinois', ', IL',
  'Indianapolis', 'Indiana', ', IN',
  'Detroit', 'Ann Arbor', 'Michigan', ', MI',
  'Columbus', 'Cleveland', 'Cincinnati', 'Ohio', ', OH',
  'Milwaukee', 'Madison', 'Wisconsin', ', WI',
  'Minneapolis', 'Minnesota', ', MN',
  'St. Louis', 'Kansas City', 'Missouri', ', MO',
  'Des Moines', 'Iowa', ', IA',
];

let apiCalls = 0;
let enriched = 0;
let skipped = 0;
let errors = 0;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Search for a firm using Places API (New) Text Search
 */
async function searchPlace(firmName, location) {
  apiCalls++;
  const query = location
    ? `${firmName} ${location}`
    : `${firmName} venture capital`;

  try {
    const res = await fetch(PLACES_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.businessStatus,places.types,places.addressComponents,places.location',
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 1,
        languageCode: 'en',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 403) {
        console.error('\n[FATAL] Places API returned 403. Make sure the API is enabled:');
        console.error('  Google Cloud Console → APIs & Services → Library → "Places API (New)" → Enable');
        console.error('  Error:', errText);
        process.exit(1);
      }
      if (res.status === 429) {
        console.log('  Rate limited, waiting 5s...');
        await sleep(5000);
        apiCalls--;
        return searchPlace(firmName, location);
      }
      console.error(`  API error ${res.status}:`, errText.substring(0, 200));
      return null;
    }

    const data = await res.json();
    if (!data.places || data.places.length === 0) return null;
    return data.places[0];
  } catch (err) {
    console.error(`  Fetch error for "${firmName}":`, err.message);
    return null;
  }
}

/**
 * Extract structured data from a Places result
 */
function extractPlaceData(place) {
  const result = {};

  if (place.websiteUri) {
    result.website = place.websiteUri;
  }

  if (place.formattedAddress) {
    result.location = place.formattedAddress;
  }

  if (place.nationalPhoneNumber) {
    result.phone = place.nationalPhoneNumber;
  }

  if (place.businessStatus) {
    result.business_status = place.businessStatus;
  }

  // Extract state from address components
  if (place.addressComponents) {
    const stateComp = place.addressComponents.find(c =>
      c.types?.includes('administrative_area_level_1')
    );
    if (stateComp) {
      result.state = stateComp.shortText || stateComp.longText;
    }
    const cityComp = place.addressComponents.find(c =>
      c.types?.includes('locality')
    );
    if (cityComp) {
      result.city = cityComp.longText;
    }
  }

  if (place.location) {
    result.lat = place.location.latitude;
    result.lng = place.location.longitude;
  }

  return result;
}

/**
 * Determine if a Places result is a reasonable match for the firm
 */
function isReasonableMatch(firmName, place) {
  if (!place.displayName?.text) return false;

  const firmLower = firmName.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const placeLower = place.displayName.text.toLowerCase().replace(/[^a-z0-9\s]/g, '');

  // Check token overlap
  const firmTokens = new Set(firmLower.split(/\s+/));
  const placeTokens = new Set(placeLower.split(/\s+/));
  const overlap = [...firmTokens].filter(t => placeTokens.has(t) && t.length > 2).length;
  const minTokens = Math.min(firmTokens.size, placeTokens.size);

  return overlap >= Math.max(1, minTokens * 0.3);
}

/**
 * Extract location hint from description [Location: City, ST]
 */
function extractLocationFromDesc(desc) {
  if (!desc) return null;
  const match = desc.match(/\[Location:\s*([^\]]+)\]/);
  return match ? match[1].trim() : null;
}

/**
 * Fetch Midwest records to enrich, prioritized
 */
async function fetchMidwestRecords(limit) {
  const records = [];

  // Priority 1: Chicago-focused, no website
  const {data: p1} = await sb.from('funding_opportunities')
    .select('id, name, description, website, opportunity_type, chicago_focused')
    .eq('chicago_focused', true)
    .is('website', null)
    .limit(Math.min(limit, 2500));
  if (p1) records.push(...p1);
  console.log(`  Priority 1 (Chicago, no website): ${p1?.length || 0}`);

  // Priority 2: Chicago-focused, has website (verify/enrich location)
  if (records.length < limit) {
    const {data: p2} = await sb.from('funding_opportunities')
      .select('id, name, description, website, opportunity_type, chicago_focused')
      .eq('chicago_focused', true)
      .not('website', 'is', null)
      .limit(Math.min(limit - records.length, 500));
    if (p2) records.push(...p2);
    console.log(`  Priority 2 (Chicago, has website): ${p2?.length || 0}`);
  }

  // Priority 3: Other Midwest states, no website
  if (records.length < limit) {
    const mwTerms = ['Indiana', 'Michigan', 'Ohio', 'Wisconsin', 'Minnesota', 'Missouri', 'Iowa',
      'Indianapolis', 'Detroit', 'Columbus', 'Cleveland', 'Cincinnati', 'Milwaukee', 'Minneapolis'];
    const orFilter = mwTerms.map(t => `description.ilike.%${t}%`).join(',');

    const {data: p3} = await sb.from('funding_opportunities')
      .select('id, name, description, website, opportunity_type, chicago_focused')
      .eq('chicago_focused', false)
      .is('website', null)
      .or(orFilter)
      .limit(Math.min(limit - records.length, 3000));
    if (p3) records.push(...p3);
    console.log(`  Priority 3 (Other Midwest, no website): ${p3?.length || 0}`);
  }

  return records;
}

async function main() {
  console.log('=== Places API Enrichment — Midwest Firms ===');
  console.log(`Limit: ${LIMIT} | Dry run: ${DRY_RUN}\n`);

  // Fetch records to enrich
  console.log('Fetching Midwest records...');
  const records = await fetchMidwestRecords(LIMIT);
  console.log(`\nTotal records to enrich: ${records.length}\n`);

  if (records.length === 0) {
    console.log('No records to enrich.');
    return;
  }

  // Process each record
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const locationHint = extractLocationFromDesc(rec.description);

    // Search Places API
    const place = await searchPlace(rec.name, locationHint);

    if (!place) {
      skipped++;
      if ((i + 1) % 100 === 0) {
        console.log(`  [${i + 1}/${records.length}] ${enriched} enriched, ${skipped} not found, ${errors} errors (${apiCalls} API calls)`);
      }
      await sleep(100); // Small delay between requests
      continue;
    }

    // Validate match
    if (!isReasonableMatch(rec.name, place)) {
      skipped++;
      await sleep(100);
      continue;
    }

    // Extract data
    const placeData = extractPlaceData(place);

    // Build update
    const update = {};

    if (placeData.website && !rec.website) {
      update.website = placeData.website;
    }

    // Build enriched description
    const parts = [];
    if (rec.description) {
      // Remove old [Location: ...] tag
      parts.push(rec.description.replace(/\s*\[Location:[^\]]*\]/, '').trim());
    }
    if (placeData.location) {
      parts.push(`[Location: ${placeData.location}]`);
    }
    if (placeData.phone) {
      parts.push(`[Phone: ${placeData.phone}]`);
    }
    if (parts.length > 0) {
      update.description = parts.join(' ').substring(0, 2000);
    }

    // Update chicago_focused if we confirmed it's in IL
    if (placeData.state === 'IL' && !rec.chicago_focused) {
      update.chicago_focused = true;
    }

    if (Object.keys(update).length === 0) {
      skipped++;
      await sleep(100);
      continue;
    }

    // Apply update
    if (!DRY_RUN) {
      const { error } = await sb.from('funding_opportunities').update(update).eq('id', rec.id);
      if (error) {
        errors++;
        console.error(`  Error updating ${rec.name}:`, error.message);
      } else {
        enriched++;
      }
    } else {
      enriched++;
      if (enriched <= 5) {
        console.log(`  [DRY RUN] Would update "${rec.name}":`, JSON.stringify(update).substring(0, 200));
      }
    }

    // Progress
    if ((i + 1) % 100 === 0) {
      console.log(`  [${i + 1}/${records.length}] ${enriched} enriched, ${skipped} not found, ${errors} errors (${apiCalls} API calls)`);
    }

    // Rate limit: ~5 requests/sec
    await sleep(200);
  }

  // Final stats
  console.log('\n=== ENRICHMENT COMPLETE ===');
  console.log(`  Records processed: ${records.length}`);
  console.log(`  Enriched: ${enriched}`);
  console.log(`  Not found/skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  API calls used: ${apiCalls}`);
  console.log(`  Estimated cost: $${(apiCalls * 0.032).toFixed(2)} (covered by $200 free credit)`);

  // Verify
  if (!DRY_RUN) {
    const {count: webCount} = await sb.from('funding_opportunities')
      .select('*', {count: 'exact', head: true})
      .eq('chicago_focused', true)
      .not('website', 'is', null);
    console.log(`\n  Chicago-focused with website: ${webCount} (was ~127 before)`);
  }
}

main().catch(console.error);
