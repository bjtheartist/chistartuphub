#!/usr/bin/env node
/**
 * Migrate investor entities from funding_opportunities → investors table
 *
 * funding_opportunities has 65K+ records typed as "vc" or "angel" that are
 * actually investor profiles (SEC entities, VCs, angels). These belong in
 * the investors table, not mixed with grants/accelerators/competitions.
 *
 * Steps:
 * 1. Fetch all vc/angel records from funding_opportunities
 * 2. Parse location → hq_city, hq_state, hq_country
 * 3. Derive is_midwest, domain
 * 4. Deduplicate against existing investors by normalized name
 * 5. Insert new records into investors table
 * 6. Optionally delete migrated records from funding_opportunities
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing env vars'); process.exit(1); }

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

const DRY_RUN = process.argv.includes('--dry-run');
const DELETE_AFTER = process.argv.includes('--delete-migrated');

// --- US state abbreviations → full name ---
const STATE_MAP = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',DC:'District of Columbia',
};

const MIDWEST_STATES = new Set([
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Michigan', 'Minnesota',
  'Missouri', 'Nebraska', 'North Dakota', 'Ohio', 'South Dakota', 'Wisconsin',
  'IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI',
]);

function normalize(name) {
  return (name || '').toLowerCase()
    .replace(/[,.'"\-()]/g, '')
    .replace(/\b(llc|lp|inc|corp|ltd|co|group)\b/g, '')
    .replace(/\s+/g, ' ').trim();
}

const EXCLUDED_DOMAINS = new Set([
  'en.wikipedia.org', 'wikipedia.org', 'linkedin.com', 'www.linkedin.com',
  'twitter.com', 'x.com', 'facebook.com', 'www.facebook.com',
  'crunchbase.com', 'www.crunchbase.com', 'pitchbook.com',
  'sec.gov', 'www.sec.gov', 'google.com', 'github.com',
]);

function extractDomain(website) {
  if (!website) return null;
  try {
    const url = new URL(website.startsWith('http') ? website : 'https://' + website);
    const domain = url.hostname.replace(/^www\./, '');
    if (EXCLUDED_DOMAINS.has(domain) || EXCLUDED_DOMAINS.has(url.hostname)) return null;
    return domain;
  } catch { return null; }
}

/**
 * Parse location string into city, state, country components.
 * Handles formats:
 * - "Chicago, IL"
 * - "Chicago, IL 60601"
 * - "New York, NY, US"
 * - "London, GBR"
 * - "LISLE, IL, 60532"
 */
function parseLocation(loc) {
  if (!loc) return { city: null, state: null, country: null };

  const parts = loc.split(',').map(p => p.trim()).filter(Boolean);

  if (parts.length === 1) {
    // Single value — could be city or state
    const abbr = parts[0].toUpperCase();
    if (STATE_MAP[abbr]) return { city: null, state: STATE_MAP[abbr], country: 'United States' };
    return { city: parts[0], state: null, country: null };
  }

  const city = parts[0];

  // Second part: state abbreviation or country
  let stateRaw = parts[1].replace(/\d{5}(-\d{4})?$/, '').trim(); // strip zip
  const stateUpper = stateRaw.toUpperCase();

  if (STATE_MAP[stateUpper]) {
    // US state
    const state = STATE_MAP[stateUpper];
    return { city, state, country: 'United States' };
  }

  // Might be a country code (3-letter) or full country name
  if (stateRaw.length === 2 || stateRaw.length === 3) {
    // Likely a country code
    return { city, state: null, country: stateRaw };
  }

  // Full state or region name
  return { city, state: stateRaw, country: parts[2]?.trim() || null };
}

function mapInvestorType(oppType) {
  const t = (oppType || '').toLowerCase();
  if (t === 'vc') return 'vc';
  if (t === 'angel') return 'angel';
  if (t === 'cvc') return 'cvc';
  return 'vc'; // default
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Migrate Investors: funding_opportunities → investors║');
  console.log(`║  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}${DELETE_AFTER ? ' + DELETE MIGRATED' : ''}                              ║`);
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Step 1: Build set of existing investor names for dedup
  console.log('Step 1: Loading existing investors for dedup...');
  const existingNames = new Set();
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?select=canonical_name&limit=1000&offset=${offset}`,
      { headers }
    );
    const batch = await res.json();
    if (batch.length === 0) break;
    batch.forEach(r => existingNames.add(normalize(r.canonical_name)));
    offset += 1000;
  }
  console.log(`  Existing investors: ${existingNames.size}\n`);

  // Step 2: Fetch and migrate vc/angel records from funding_opportunities
  console.log('Step 2: Fetching investor records from funding_opportunities...');

  let totalFetched = 0, inserted = 0, skippedDupe = 0, skippedNoName = 0, errors = 0;
  const migratedIds = [];
  offset = 0;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/funding_opportunities?select=*&or=(opportunity_type.eq.vc,opportunity_type.eq.angel)&order=id&limit=1000&offset=${offset}`,
      { headers }
    );
    const records = await res.json();
    if (!Array.isArray(records) || records.length === 0) break;
    totalFetched += records.length;

    const batch = [];

    for (const rec of records) {
      const name = (rec.organization || rec.name || '').trim();
      if (!name || name.length < 2) { skippedNoName++; continue; }

      const normName = normalize(name);
      if (existingNames.has(normName)) { skippedDupe++; continue; }

      // Mark as seen to prevent dupes within this batch
      existingNames.add(normName);

      const { city, state, country } = parseLocation(rec.location);
      const domain = extractDomain(rec.website);
      const isMidwest = !!(
        (state && MIDWEST_STATES.has(state)) ||
        (city && city.toLowerCase() === 'chicago') ||
        rec.chicago_focused
      );

      // Map stage array to valid stage_focus enum value
      const VALID_STAGES = ['pre_seed', 'seed', 'early', 'growth', 'late'];
      let stageFocus = null;
      if (rec.stage && rec.stage.length > 0) {
        // Try to map first stage to a valid value
        const first = rec.stage[0].toLowerCase().replace(/[\s-]/g, '_');
        if (VALID_STAGES.includes(first)) {
          stageFocus = first;
        } else if (first.includes('seed')) {
          stageFocus = 'seed';
        } else if (first.includes('early') || first.includes('series_a')) {
          stageFocus = 'early';
        } else if (first.includes('growth') || first.includes('series_b') || first.includes('series_c')) {
          stageFocus = 'growth';
        } else if (first.includes('late') || first.includes('series_d')) {
          stageFocus = 'late';
        }
        // else leave null — don't violate check constraint
      }

      const investor = {
        canonical_name: name,
        website: rec.website || null,
        domain: null, // Skip domain to avoid unique constraint issues; backfill later
        hq_location: rec.location || null,
        hq_city: city,
        hq_state: state,
        hq_country: country || rec.country || null,
        is_midwest: isMidwest,
        investor_type: mapInvestorType(rec.opportunity_type),
        stage_focus: stageFocus,
        sectors: rec.sectors && rec.sectors.length > 0 ? rec.sectors : null,
        check_size_min: rec.check_size_min || null,
        check_size_max: rec.check_size_max || null,
        description: rec.description || null,
        source: 'funding_opportunities_migration',
        completeness_score: Math.round(rec.completeness_score || 0),
        mvip_score: 0,
      };

      batch.push(investor);
      migratedIds.push(rec.id);
    }

    if (batch.length > 0 && !DRY_RUN) {
      // Insert in sub-batches of 500
      for (let i = 0; i < batch.length; i += 500) {
        const sub = batch.slice(i, i + 500);
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/investors`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'return=minimal,resolution=ignore-duplicates' },
          body: JSON.stringify(sub),
        });
        if (!insertRes.ok) {
          const errText = await insertRes.text();
          console.error(`  Batch error at offset ${offset}+${i}: ${insertRes.status} ${errText.slice(0, 200)}`);
          errors++;
        } else {
          inserted += sub.length;
        }
      }
    } else if (DRY_RUN) {
      inserted += batch.length;
    }

    offset += 1000;
    if (offset % 10000 === 0) {
      console.log(`  Progress: ${totalFetched} fetched | ${inserted} inserted | ${skippedDupe} dupes | ${errors} errors`);
    }
  }

  console.log(`\n  Fetched: ${totalFetched}`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (duplicate): ${skippedDupe}`);
  console.log(`  Skipped (no name): ${skippedNoName}`);
  console.log(`  Errors: ${errors}`);

  // Step 3: Optionally delete migrated records from funding_opportunities
  if (DELETE_AFTER && !DRY_RUN && migratedIds.length > 0) {
    console.log(`\nStep 3: Deleting ${migratedIds.length} migrated records from funding_opportunities...`);

    for (let i = 0; i < migratedIds.length; i += 100) {
      const ids = migratedIds.slice(i, i + 100);
      const idFilter = ids.map(id => `id.eq.${id}`).join(',');
      const delRes = await fetch(
        `${SUPABASE_URL}/rest/v1/funding_opportunities?or=(${idFilter})`,
        { method: 'DELETE', headers }
      );
      if (!delRes.ok) {
        console.error(`  DELETE error: ${delRes.status}`);
        errors++;
      }
      if (i % 5000 === 0 && i > 0) console.log(`    Deleted ${i}...`);
    }
    console.log(`  Deleted ${migratedIds.length} records from funding_opportunities`);
  } else if (DELETE_AFTER && DRY_RUN) {
    console.log(`\n  [DRY RUN] Would delete ${migratedIds.length} records from funding_opportunities`);
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  MIGRATION SUMMARY                                  ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Records migrated:     ${String(inserted).padStart(6)}                        ║`);
  console.log(`║  Duplicates skipped:   ${String(skippedDupe).padStart(6)}                        ║`);
  console.log(`║  Errors:               ${String(errors).padStart(6)}                        ║`);
  console.log(`║  New investor total:   ~${String(existingNames.size).padStart(5)}                        ║`);
  console.log('╚══════════════════════════════════════════════════════╝');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
