#!/usr/bin/env node
/**
 * enrich-locations.js
 *
 * Enriches investor records that have null hq_state by matching against
 * local data files (JSON + CSV) and optionally Google Custom Search API.
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=... node scripts/enrich-locations.js
 *   SUPABASE_SERVICE_KEY=... GOOGLE_API_KEY=... GOOGLE_CX=... node scripts/enrich-locations.js
 *
 * Environment variables:
 *   SUPABASE_SERVICE_KEY  – required for PATCH updates
 *   GOOGLE_API_KEY        – optional, enables Google CSE fallback
 *   GOOGLE_CX             – optional, Custom Search Engine ID
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Simple CSV parser (no external deps). Handles quoted fields with commas.
 */
function csvParse(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];

  function parseLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          fields.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]);
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = vals[j] || '';
    }
    records.push(obj);
  }
  return records;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTIyNjIsImV4cCI6MjA4MTkyODI2Mn0.k6yRcQ60OONig97VQZ-UJdmC49ijEm7kskP_2qtaW1E';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_QUERY_LIMIT = 500; // Places API has generous free tier ($200/mo credit)

if (!SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_KEY env var is required for updates.');
  process.exit(1);
}

// ─── US State Mappings ───────────────────────────────────────────────────────

const STATE_ABBR_TO_FULL = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
  ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
};

const STATE_FULL_TO_ABBR = Object.fromEntries(
  Object.entries(STATE_ABBR_TO_FULL).map(([k, v]) => [v.toLowerCase(), k])
);

const MIDWEST_STATES = new Set([
  'IL', 'IN', 'WI', 'MI', 'OH', 'MN', 'IA', 'MO', 'KS', 'NE', 'ND', 'SD',
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalize(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')  // strip non-alphanumeric
    .trim();
}

function extractDomain(urlOrDomain) {
  if (!urlOrDomain) return '';
  let d = urlOrDomain.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0];
  return d || '';
}

/**
 * Parse a location string like "San Francisco, CA" or "New York, NY, USA"
 * into structured fields.
 */
function parseLocation(locStr) {
  if (!locStr || typeof locStr !== 'string') return null;
  const raw = locStr.trim();
  if (!raw) return null;

  // Normalize separators
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean);

  let city = null;
  let stateAbbr = null;
  let stateFull = null;
  let country = null;

  // Handle "Washington, D.C." specially
  if (/washington.*d\.?\s*c\.?/i.test(raw)) {
    city = 'Washington';
    stateAbbr = 'DC';
    stateFull = 'District of Columbia';
    country = 'United States';
    return { hq_city: city, hq_state: stateFull, hq_country: country, hq_location: raw, is_midwest: false };
  }

  if (parts.length >= 2) {
    city = parts[0];

    // Second part might be "CA", "California", "NY 10001", etc.
    let stateCandidate = parts[1].replace(/\d{5}(-\d{4})?/, '').trim(); // strip zip
    const upperCandidate = stateCandidate.toUpperCase();

    if (STATE_ABBR_TO_FULL[upperCandidate]) {
      stateAbbr = upperCandidate;
      stateFull = STATE_ABBR_TO_FULL[upperCandidate];
    } else if (STATE_FULL_TO_ABBR[stateCandidate.toLowerCase()]) {
      stateAbbr = STATE_FULL_TO_ABBR[stateCandidate.toLowerCase()];
      stateFull = STATE_ABBR_TO_FULL[stateAbbr];
    }

    // Check for country in remaining parts
    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1].trim();
      if (/^(us|usa|united states|u\.s\.a?\.?)$/i.test(lastPart)) {
        country = 'United States';
      } else if (stateAbbr) {
        // It's a US state, last part might be zip or country
        country = 'United States';
      } else {
        country = lastPart;
      }
    }
  } else if (parts.length === 1) {
    // Might be just a city or a state — try to detect
    const upper = parts[0].toUpperCase();
    if (STATE_ABBR_TO_FULL[upper]) {
      stateAbbr = upper;
      stateFull = STATE_ABBR_TO_FULL[upper];
    } else if (STATE_FULL_TO_ABBR[parts[0].toLowerCase()]) {
      stateAbbr = STATE_FULL_TO_ABBR[parts[0].toLowerCase()];
      stateFull = STATE_ABBR_TO_FULL[stateAbbr];
    } else {
      city = parts[0];
    }
  }

  // Default country for US states
  if (stateAbbr && !country) {
    country = 'United States';
  }

  // If we couldn't find a state, check if it's an international location
  if (!stateAbbr && !stateFull) {
    // Common international patterns
    const intlCountries = [
      'United Kingdom', 'UK', 'Canada', 'Germany', 'France', 'Israel',
      'India', 'Singapore', 'China', 'Japan', 'Australia', 'Brazil',
      'Netherlands', 'Sweden', 'Switzerland', 'South Korea', 'Hong Kong',
    ];
    for (const c of intlCountries) {
      if (raw.toLowerCase().includes(c.toLowerCase())) {
        country = c === 'UK' ? 'United Kingdom' : c;
        break;
      }
    }
    // If still no country and we have parts, set the last part as country
    if (!country && parts.length >= 2) {
      country = parts[parts.length - 1];
    }
    return {
      hq_city: city,
      hq_state: stateFull || null,
      hq_country: country || null,
      hq_location: raw,
      is_midwest: false,
    };
  }

  return {
    hq_city: city,
    hq_state: stateFull,
    hq_country: country,
    hq_location: raw,
    is_midwest: MIDWEST_STATES.has(stateAbbr),
  };
}

// ─── Build Lookup Map from Local Data ────────────────────────────────────────

function buildLookup() {
  const byName = new Map();   // normalized name → location string
  const byDomain = new Map(); // domain → location string

  function add(name, domain, location) {
    if (!location || typeof location !== 'string' || !location.trim()) return;
    const loc = location.trim();
    if (name) {
      const n = normalize(name);
      if (n && !byName.has(n)) byName.set(n, loc);
    }
    if (domain) {
      const d = extractDomain(domain);
      if (d && !byDomain.has(d)) byDomain.set(d, loc);
    }
  }

  // 1. merged-vc-database.json
  const mergedPath = join(ROOT, 'tools/investor-enrichment/data/merged-vc-database.json');
  if (existsSync(mergedPath)) {
    try {
      const data = JSON.parse(readFileSync(mergedPath, 'utf-8'));
      for (const r of data) {
        add(r.name, r.domain || r.website, r.location);
      }
      console.log(`  merged-vc-database.json: ${data.length} records`);
    } catch (e) { console.warn(`  WARN: Could not parse ${mergedPath}: ${e.message}`); }
  }

  // 2. new-firms-to-import.json
  const newFirmsPath = join(ROOT, 'tools/investor-enrichment/data/new-firms-to-import.json');
  if (existsSync(newFirmsPath)) {
    try {
      const data = JSON.parse(readFileSync(newFirmsPath, 'utf-8'));
      for (const r of data) {
        add(r.name, r.domain || r.website, r.location);
      }
      console.log(`  new-firms-to-import.json: ${data.length} records`);
    } catch (e) { console.warn(`  WARN: Could not parse ${newFirmsPath}: ${e.message}`); }
  }

  // 3. investor_enrichment.json (wrapped in { enriched_investors: [...] })
  const enrichPath = join(ROOT, 'data/investor_enrichment.json');
  if (existsSync(enrichPath)) {
    try {
      const raw = JSON.parse(readFileSync(enrichPath, 'utf-8'));
      const arr = raw.enriched_investors || raw;
      const records = Array.isArray(arr) ? arr : [];
      for (const r of records) {
        add(r.name, r.website, r.location);
      }
      console.log(`  investor_enrichment.json: ${records.length} records`);
    } catch (e) { console.warn(`  WARN: Could not parse ${enrichPath}: ${e.message}`); }
  }

  // 4. sec-adv-harvest.json (array)
  const secPath = join(ROOT, 'data/sec-adv-harvest.json');
  if (existsSync(secPath)) {
    try {
      const data = JSON.parse(readFileSync(secPath, 'utf-8'));
      const arr = Array.isArray(data) ? data : [];
      for (const r of arr) {
        add(r.name || r.organization, r.website, r.location);
      }
      console.log(`  sec-adv-harvest.json: ${arr.length} records`);
    } catch (e) { console.warn(`  WARN: Could not parse ${secPath}: ${e.message}`); }
  }

  // 5. micro-vc-raw.csv
  const microPath = join(ROOT, 'tools/investor-enrichment/data/micro-vc-raw.csv');
  if (existsSync(microPath)) {
    try {
      const csvText = readFileSync(microPath, 'utf-8');
      const records = csvParse(csvText);
      for (const r of records) {
        const name = r['Firm Name'];
        const loc = r['Location (City)'];
        const url = r['URL'];
        add(name, url, loc);
      }
      console.log(`  micro-vc-raw.csv: ${records.length} records`);
    } catch (e) { console.warn(`  WARN: Could not parse ${microPath}: ${e.message}`); }
  }

  // 6. connor-vc.csv (has Company Name, City, State, Website)
  const connorPath = join(ROOT, 'tools/investor-enrichment/data/connor-vc.csv');
  if (existsSync(connorPath)) {
    try {
      const csvText = readFileSync(connorPath, 'utf-8');
      const records = csvParse(csvText);
      for (const r of records) {
        const name = r['Company Name'];
        const city = r['City'] || '';
        const state = r['State'] || '';
        const website = r['Website'];
        const loc = [city, state].filter(Boolean).join(', ');
        add(name, website, loc);
      }
      console.log(`  connor-vc.csv: ${records.length} records`);
    } catch (e) { console.warn(`  WARN: Could not parse ${connorPath}: ${e.message}`); }
  }

  console.log(`\n  Lookup built: ${byName.size} by name, ${byDomain.size} by domain\n`);
  return { byName, byDomain };
}

// ─── Supabase REST helpers ───────────────────────────────────────────────────

async function fetchInvestorsMissingState() {
  // Fetch all investors where hq_state is null via public_investors view
  // Paginate in chunks of 1000 (Supabase default limit)
  const allRecords = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/public_investors?hq_state=is.null&select=id,canonical_name,domain,website&offset=${offset}&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'count=exact',
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Fetch failed (${res.status}): ${body}`);
    }
    const data = await res.json();
    allRecords.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }

  return allRecords;
}

async function patchInvestor(id, fields) {
  const url = `${SUPABASE_URL}/rest/v1/investors?id=eq.${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH failed for id=${id} (${res.status}): ${body}`);
  }
}

// ─── Google Places API (New) fallback ────────────────────────────────────────

/**
 * Uses Google Places API (New) Text Search to find investor HQ location.
 * Returns structured location data directly from Google.
 */
async function googlePlacesSearch(investorName) {
  if (!GOOGLE_API_KEY) return null;

  const url = 'https://places.googleapis.com/v1/places:searchText';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.addressComponents,places.location',
    },
    body: JSON.stringify({
      textQuery: `${investorName} venture capital`,
      maxResultCount: 1,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn(`  Places API error (${res.status}) for "${investorName}": ${errText.slice(0, 120)}`);
    return null;
  }

  const data = await res.json();
  const places = data.places || [];
  if (places.length === 0) return null;

  const place = places[0];
  const components = place.addressComponents || [];

  let city = null;
  let stateShort = null;
  let stateLong = null;
  let country = null;
  let countryShort = null;

  for (const comp of components) {
    const types = comp.types || [];
    if (types.includes('locality')) {
      city = comp.longText;
    } else if (types.includes('administrative_area_level_1')) {
      stateLong = comp.longText;
      stateShort = comp.shortText;
    } else if (types.includes('country')) {
      country = comp.longText;
      countryShort = comp.shortText;
    }
  }

  // Determine if it's a US state
  const isUS = countryShort === 'US' || country === 'United States';
  let hq_state = null;

  if (isUS && stateShort && STATE_ABBR_TO_FULL[stateShort]) {
    hq_state = STATE_ABBR_TO_FULL[stateShort];
  } else if (isUS && stateLong) {
    hq_state = stateLong;
  } else if (!isUS && stateLong) {
    // International — use state/region name
    hq_state = stateLong;
  }

  const isMidwest = isUS && stateShort ? MIDWEST_STATES.has(stateShort) : false;

  return {
    hq_city: city,
    hq_state: hq_state,
    hq_country: country || null,
    hq_location: place.formattedAddress || [city, stateLong, country].filter(Boolean).join(', '),
    is_midwest: isMidwest,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Investor Location Enrichment ===\n');
  console.log('Building lookup from local data files...');
  const { byName, byDomain } = buildLookup();

  console.log('Fetching investors with null hq_state...');
  const investors = await fetchInvestorsMissingState();
  console.log(`Found ${investors.length} investors missing hq_state.\n`);

  if (investors.length === 0) {
    console.log('Nothing to do!');
    return;
  }

  let localMatches = 0;
  let googleMatches = 0;
  let noMatch = 0;
  let errors = 0;
  const needGoogle = [];

  // Phase 1: Local lookup
  console.log('--- Phase 1: Local Data Lookup ---');
  for (const inv of investors) {
    const invDomain = extractDomain(inv.domain || inv.website || '');
    const invName = normalize(inv.canonical_name);

    let locStr = null;

    // Try domain first (more specific)
    if (invDomain && byDomain.has(invDomain)) {
      locStr = byDomain.get(invDomain);
    }

    // Then try name
    if (!locStr && invName && byName.has(invName)) {
      locStr = byName.get(invName);
    }

    if (locStr) {
      const parsed = parseLocation(locStr);
      if (parsed && parsed.hq_state) {
        try {
          await patchInvestor(inv.id, {
            hq_city: parsed.hq_city,
            hq_state: parsed.hq_state,
            hq_country: parsed.hq_country,
            hq_location: parsed.hq_location,
            is_midwest: parsed.is_midwest,
          });
          localMatches++;
          console.log(`  [LOCAL] ${inv.canonical_name} → ${parsed.hq_city}, ${parsed.hq_state}`);
        } catch (e) {
          errors++;
          console.error(`  ERROR updating ${inv.canonical_name}: ${e.message}`);
        }
      } else if (parsed && parsed.hq_city) {
        // Have city but no state (international or ambiguous)
        try {
          await patchInvestor(inv.id, {
            hq_city: parsed.hq_city,
            hq_state: parsed.hq_state,        // may be null
            hq_country: parsed.hq_country,
            hq_location: parsed.hq_location,
            is_midwest: false,
          });
          localMatches++;
          console.log(`  [LOCAL] ${inv.canonical_name} → ${parsed.hq_location} (no state)`);
        } catch (e) {
          errors++;
          console.error(`  ERROR updating ${inv.canonical_name}: ${e.message}`);
        }
      } else {
        needGoogle.push(inv);
      }
    } else {
      needGoogle.push(inv);
    }
  }

  console.log(`\nPhase 1 complete: ${localMatches} enriched from local data.`);
  console.log(`${needGoogle.length} still need location.\n`);

  // Phase 2: Google Places API (New) fallback
  if (needGoogle.length > 0 && GOOGLE_API_KEY) {
    console.log('--- Phase 2: Google Places API (New) ---');
    const queryCount = Math.min(needGoogle.length, GOOGLE_QUERY_LIMIT);
    console.log(`Will query up to ${queryCount} investors.\n`);

    for (let i = 0; i < queryCount; i++) {
      const inv = needGoogle[i];
      try {
        const result = await googlePlacesSearch(inv.canonical_name);
        if (result && (result.hq_state || result.hq_city)) {
          await patchInvestor(inv.id, {
            hq_city: result.hq_city,
            hq_state: result.hq_state,
            hq_country: result.hq_country,
            hq_location: result.hq_location,
            is_midwest: result.is_midwest || false,
          });
          googleMatches++;
          console.log(`  [PLACES] ${inv.canonical_name} → ${result.hq_city}, ${result.hq_state || result.hq_country}`);
        } else {
          noMatch++;
        }
      } catch (e) {
        errors++;
        console.error(`  ERROR (Places) ${inv.canonical_name}: ${e.message}`);
      }

      // Rate limit: ~100ms between Places API calls
      if (i < queryCount - 1) {
        await new Promise(r => setTimeout(r, 100));
      }

      // Progress log every 50
      if ((i + 1) % 50 === 0) {
        console.log(`  ... progress: ${i + 1}/${queryCount} (${googleMatches} found)`);
      }
    }

    // Count remaining un-queried investors
    const unqueried = needGoogle.length - queryCount;
    if (unqueried > 0) {
      noMatch += unqueried;
      console.log(`\n  Skipped ${unqueried} investors (query limit reached).`);
    }
  } else if (needGoogle.length > 0) {
    noMatch = needGoogle.length;
    if (!GOOGLE_API_KEY) {
      console.log('Skipping Places API (GOOGLE_API_KEY not set).');
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('           ENRICHMENT SUMMARY           ');
  console.log('========================================');
  console.log(`  Total investors missing state:  ${investors.length}`);
  console.log(`  Enriched from local data:       ${localMatches}`);
  console.log(`  Enriched from Google search:    ${googleMatches}`);
  console.log(`  Still missing:                  ${noMatch}`);
  console.log(`  Errors:                         ${errors}`);
  console.log('========================================\n');

  if (noMatch > 0) {
    console.log('Investors still missing location:');
    const stillMissing = needGoogle.slice(0, noMatch).filter(inv => {
      // Check if this one was already updated by Google
      return true; // log all remaining
    });
    for (const inv of stillMissing.slice(0, 50)) {
      console.log(`  - ${inv.canonical_name} (domain: ${inv.domain || 'none'})`);
    }
    if (stillMissing.length > 50) {
      console.log(`  ... and ${stillMissing.length - 50} more.`);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
