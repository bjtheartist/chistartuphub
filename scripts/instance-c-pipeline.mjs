#!/usr/bin/env node
/**
 * Instance C — International + Enrichment Pipeline
 *
 * Pipeline (migrations already applied via supabase db push):
 * 1. Add country/region columns via Supabase CLI
 * 2. Harvest international VCs (EU, Asia, LatAm, Africa) via Google CSE
 * 3. Enrich via Google Places API (New) — structured location, website, country, region
 * 4. Enrich via web scraping — check_size, description, sectors, stage
 * 5. Produce completeness scoring report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ─── Config ───────────────────────────────────────────────────────────────────
const SB_URL = process.env.SUPABASE_URL || 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Key removed — pass via env var
const GOOGLE_KEY = process.env.GOOGLE_CSE_API_KEY; // Key removed — pass via env var
const GOOGLE_CX = process.env.GOOGLE_CSE_CX || '11f92775a1a4a42d5';

const REGIONS = {
  europe: {
    label: 'Europe',
    queries: [
      'venture capital firms London UK',
      'VC firms Berlin Germany startups',
      'venture capital Paris France',
      'VC firms Amsterdam Netherlands',
      'venture capital Stockholm Sweden',
      'VC firms Zurich Switzerland',
      'venture capital Dublin Ireland tech',
      'VC firms Barcelona Spain startups',
      'venture capital Helsinki Finland',
      'venture capital Milan Italy',
      'VC fund Lisbon Portugal',
      'venture capital Warsaw Poland',
      'VC firms Oslo Norway',
      'venture capital Brussels Belgium',
      'VC firms Vienna Austria',
      'European venture capital seed stage',
      'European VC firms series A',
      'top venture capital firms Europe 2025 2026',
      'European deep tech venture capital',
      'European climate tech VC fund',
    ],
  },
  asia: {
    label: 'Asia',
    queries: [
      'venture capital firms Singapore',
      'VC firms India Bangalore Mumbai',
      'venture capital Japan Tokyo',
      'VC firms South Korea Seoul',
      'venture capital Hong Kong',
      'VC firms China Beijing Shanghai',
      'venture capital Indonesia Jakarta',
      'VC firms Thailand Bangkok',
      'venture capital Vietnam Ho Chi Minh',
      'VC firms Philippines Manila',
      'venture capital Taiwan Taipei',
      'venture capital Malaysia Kuala Lumpur',
      'top Asian venture capital firms 2025 2026',
      'Southeast Asia VC seed stage',
      'India venture capital early stage',
      'Japan startup VC fund',
      'Singapore deep tech VC',
      'Asia fintech venture capital',
      'Asia climate tech VC',
      'venture capital Pakistan Karachi',
    ],
  },
  latam: {
    label: 'Latin America',
    queries: [
      'venture capital firms Brazil Sao Paulo',
      'VC firms Mexico City Mexico',
      'venture capital Colombia Bogota',
      'VC firms Argentina Buenos Aires',
      'venture capital Chile Santiago',
      'VC firms Peru Lima',
      'Latin America venture capital fund',
      'LAVCA venture capital Latin America',
      'Brazil startup VC seed',
      'Mexico fintech venture capital',
      'Latin America early stage VC',
      'Colombia venture capital startups',
      'VC fund Central America',
      'venture capital Uruguay',
      'Latin America climate tech VC',
      'top VC firms Latin America 2025 2026',
      'venture capital Costa Rica',
      'Caribbean venture capital fund',
      'Latin America deep tech VC',
      'Argentinian venture capital fund',
    ],
  },
  africa: {
    label: 'Africa',
    queries: [
      'venture capital firms Nigeria Lagos',
      'VC firms Kenya Nairobi',
      'venture capital South Africa Cape Town Johannesburg',
      'VC firms Egypt Cairo',
      'venture capital Ghana Accra',
      'venture capital Rwanda Kigali',
      'VC firms Tanzania',
      'Africa venture capital fund',
      'African startup VC seed',
      'Africa fintech venture capital',
      'East Africa venture capital',
      'West Africa VC fund startups',
      'North Africa venture capital',
      'Africa climate tech VC',
      'top VC firms Africa 2025 2026',
      'venture capital Ethiopia Addis Ababa',
      'VC firms Morocco Casablanca',
      'venture capital Senegal Dakar',
      'African deep tech VC',
      'Pan-African venture capital fund',
    ],
  },
};

const COMPLETENESS_WEIGHTS = {
  name: 15, organization: 10, description: 20, website: 15,
  check_size: 15, location: 10, sectors: 5, stage: 5, embedding: 5,
};

// ─── FREE TIER BUDGET GUARDS ─────────────────────────────────────────────────
// Google CSE: 100 queries/day free (10 results each)
// Google Places (New): ~6,250 requests/month on $200 free credit ($0.032/req)
// We cap well below these to leave headroom
const BUDGET = {
  cseQueriesMax: 80,          // 80 of 100 free daily CSE queries
  placesRequestsMax: 2000,    // 2000 of ~6250 free Places requests
  cseQueriesUsed: 0,
  placesRequestsUsed: 0,
  webFetchesMax: 300,         // Web scrapes are free but we cap for politeness
  webFetchesUsed: 0,
};

function budgetCheck(type) {
  if (type === 'cse' && BUDGET.cseQueriesUsed >= BUDGET.cseQueriesMax) {
    log('BUDGET', `CSE limit reached (${BUDGET.cseQueriesUsed}/${BUDGET.cseQueriesMax})`);
    return false;
  }
  if (type === 'places' && BUDGET.placesRequestsUsed >= BUDGET.placesRequestsMax) {
    log('BUDGET', `Places limit reached (${BUDGET.placesRequestsUsed}/${BUDGET.placesRequestsMax})`);
    return false;
  }
  if (type === 'web' && BUDGET.webFetchesUsed >= BUDGET.webFetchesMax) {
    log('BUDGET', `Web fetch limit reached (${BUDGET.webFetchesUsed}/${BUDGET.webFetchesMax})`);
    return false;
  }
  return true;
}

function budgetReport() {
  log('BUDGET', `CSE queries: ${BUDGET.cseQueriesUsed}/${BUDGET.cseQueriesMax} | Places: ${BUDGET.placesRequestsUsed}/${BUDGET.placesRequestsMax} | Web: ${BUDGET.webFetchesUsed}/${BUDGET.webFetchesMax}`);
  const placesEstCost = (BUDGET.placesRequestsUsed * 0.032).toFixed(2);
  log('BUDGET', `Estimated Places cost: ~$${placesEstCost} (covered by $200/mo free credit)`);
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function log(phase, msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] [${phase}] ${msg}`);
}

// ─── Supabase REST helpers ────────────────────────────────────────────────────
async function sbSelect(table, query = '', { count = false, limit = 1000 } = {}) {
  const sep = query ? '&' : '';
  const url = `${SB_URL}/rest/v1/${table}?${query}${sep}limit=${limit}`;
  const headers = {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    Accept: 'application/json',
  };
  if (count) headers.Prefer = 'count=exact';

  const resp = await fetch(url, { headers });
  const data = await resp.json();
  const total = resp.headers.get('content-range')?.split('/')?.[1];
  return { data, total: total ? parseInt(total) : null };
}

async function sbInsert(table, rows) {
  const resp = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal,resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Insert ${table} failed: ${resp.status} ${err.slice(0, 300)}`);
  }
  return resp.status;
}

async function sbUpdate(table, id, updates) {
  const resp = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(updates),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Update ${table} ${id} failed: ${resp.status} ${err.slice(0, 200)}`);
  }
}

// Paginated select — fetches all rows matching query
async function sbSelectAll(table, query = '', selectCols = '*') {
  const allRows = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const sep = query ? '&' : '';
    const url = `${SB_URL}/rest/v1/${table}?select=${selectCols}&${query}${sep}limit=${pageSize}&offset=${offset}`;
    const resp = await fetch(url, {
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        Accept: 'application/json',
        Prefer: 'count=exact',
      },
    });
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) break;
    allRows.push(...data);
    offset += pageSize;
    if (data.length < pageSize) break;
  }

  return allRows;
}

// ─── Phase 1: Schema Updates (via Supabase CLI) ──────────────────────────────
async function ensureSchema() {
  log('SCHEMA', 'Ensuring country + region columns exist...');

  const migrationPath = path.join(PROJECT_ROOT, 'supabase/migrations/20260309200000_add_country_region.sql');
  if (!fs.existsSync(migrationPath)) {
    const migrationSQL = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_opportunities' AND column_name = 'country') THEN
    ALTER TABLE funding_opportunities ADD COLUMN country TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_opportunities' AND column_name = 'region') THEN
    ALTER TABLE funding_opportunities ADD COLUMN region TEXT;
  END IF;
END $$;
`;
    fs.writeFileSync(migrationPath, migrationSQL);
    log('SCHEMA', 'Created migration file');

    try {
      const token = process.env.SUPABASE_ACCESS_TOKEN;
      if (token) {
        execFileSync('supabase', ['db', 'push', '--yes'], {
          cwd: PROJECT_ROOT,
          env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
          timeout: 30000,
          stdio: 'pipe',
        });
        log('SCHEMA', '✓ country + region columns added');
      } else {
        log('SCHEMA', '⚠ No SUPABASE_ACCESS_TOKEN — run "supabase db push" manually');
      }
    } catch (err) {
      log('SCHEMA', `Migration note: ${err.stderr?.toString().slice(0, 200) || err.message}`);
    }
  } else {
    log('SCHEMA', 'Migration already exists');
  }

  // Verify
  const { data } = await sbSelect('funding_opportunities', 'select=id,country,region&limit=1');
  if (Array.isArray(data) && data.length > 0 && 'country' in data[0]) {
    log('SCHEMA', '✓ Verified: country + region columns present');
    return true;
  }
  log('SCHEMA', '⚠ country/region not found — will skip those fields');
  return false;
}

// ─── Phase 2: Harvest International VCs via Google CSE ────────────────────────
async function searchCSE(query) {
  if (!budgetCheck('cse')) return [];

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', GOOGLE_KEY);
  url.searchParams.set('cx', GOOGLE_CX);
  url.searchParams.set('q', query);
  url.searchParams.set('num', '10');

  const resp = await fetch(url);
  BUDGET.cseQueriesUsed++;

  if (!resp.ok) {
    const err = await resp.text();
    log('CSE', `Error for "${query}": ${resp.status} ${err.slice(0, 200)}`);
    return [];
  }
  return (await resp.json()).items || [];
}

function parseVCFromSearchResult(item, regionLabel) {
  const title = item.title || '';
  const snippet = item.snippet || '';
  const link = item.link || '';
  const displayLink = item.displayLink || '';

  let name = title
    .replace(/\s*[-|–—]\s*(Crunchbase|Dealroom|Tracxn|PitchBook|AngelList|LinkedIn|F6S|Wikipedia|CB Insights).*$/i, '')
    .replace(/\s*[-|–—]\s*(Company|Organization|Fund|Firm|Profile|Overview).*$/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .trim();

  if (!name || name.length < 3 || name.length > 100) return null;

  const skipPatterns = [/top \d+ vc/i, /list of/i, /best venture/i, /^how to/i, /^what is/i, /^guide/i, /news/i, /article/i];
  if (skipPatterns.some((p) => p.test(name))) return null;

  let website = null;
  if (!/(crunchbase|dealroom|tracxn|pitchbook|angellist|linkedin|f6s|wikipedia|cbinsights)/i.test(displayLink)) {
    website = link;
  }

  return {
    name,
    organization: name,
    description: snippet.slice(0, 500),
    website,
    opportunity_type: 'vc',
    location: regionLabel,
    chicago_focused: false,
    confidence_score: 60,
    enrichment_source: 'google-cse-intl',
    needs_review: true,
    status: 'pending',
  };
}

async function harvestAllRegions() {
  log('HARVEST', 'Starting international harvest via Google CSE...');
  const allResults = {};
  let totalQueries = 0;

  for (const [key, region] of Object.entries(REGIONS)) {
    const results = [];
    const seen = new Set();

    for (const query of region.queries) {
      try {
        const items = await searchCSE(query);
        for (const item of items) {
          const vc = parseVCFromSearchResult(item, region.label);
          if (vc && !seen.has(vc.name.toLowerCase())) {
            seen.add(vc.name.toLowerCase());
            results.push(vc);
          }
        }
        totalQueries++;
        log('HARVEST', `  [${region.label}] "${query}" → ${items.length} results (${results.length} unique)`);
        await sleep(250);
      } catch (err) {
        log('HARVEST', `  Error: ${err.message}`);
      }
    }

    allResults[key] = results;
    log('HARVEST', `✓ ${region.label}: ${results.length} unique VCs`);
    await sleep(500);
  }

  const total = Object.values(allResults).reduce((s, a) => s + a.length, 0);
  log('HARVEST', `✓ Total harvested: ${total} across ${totalQueries} queries`);
  return allResults;
}

// ─── Phase 3: Dedup + Stage ───────────────────────────────────────────────────
async function deduplicateAndStage(harvested) {
  log('DEDUP', 'Deduplicating against existing DB...');

  const existingRows = await sbSelectAll('funding_opportunities', '', 'name');
  const existingNames = new Set(existingRows.map((r) => r.name?.toLowerCase()).filter(Boolean));
  log('DEDUP', `Existing records: ${existingNames.size}`);

  let staged = 0, skipped = 0;

  for (const [key, records] of Object.entries(harvested)) {
    const toInsert = records.filter((r) => {
      const k = r.name.toLowerCase();
      if (existingNames.has(k)) { skipped++; return false; }
      existingNames.add(k);
      return true;
    });

    if (toInsert.length === 0) { log('DEDUP', `  ${REGIONS[key].label}: all dupes`); continue; }

    for (let i = 0; i < toInsert.length; i += 50) {
      const batch = toInsert.slice(i, i + 50);
      try {
        await sbInsert('investor_enrichment_staging', batch);
        staged += batch.length;
      } catch (err) {
        log('DEDUP', `  Batch error: ${err.message.slice(0, 200)}`);
      }
    }
    log('DEDUP', `  ${REGIONS[key].label}: ${toInsert.length} staged, ${records.length - toInsert.length} dupes`);
  }

  log('DEDUP', `✓ Staged: ${staged}, Skipped: ${skipped}`);
  return staged;
}

// ─── Phase 4: Google Places API Enrichment ────────────────────────────────────
const REGION_MAP = {
  europe: ['GB','DE','FR','NL','SE','CH','IE','ES','FI','IT','PT','PL','NO','BE','AT','DK','CZ','EE','RO','LT','LV','HU','BG','HR','SK','SI','LU','MT','CY','GR','IS','UA','RS','TR'],
  asia: ['SG','IN','JP','KR','HK','CN','ID','TH','VN','PH','TW','MY','PK','BD','LK','IL','AE','SA','QA','BH','KW','OM','JO','LB'],
  latam: ['BR','MX','CO','AR','CL','PE','UY','CR','EC','PA','DO','GT','PY','BO','HN','SV','NI','VE','JM','TT','BB'],
  africa: ['NG','KE','ZA','EG','GH','RW','TZ','ET','MA','SN','TN','UG','CM','CI','MZ','AO','CD','DZ','ZW','BW','MU'],
  'north-america': ['US','CA'],
  oceania: ['AU','NZ'],
};

const US_REGIONS = {
  Midwest: ['IL','IN','OH','MI','WI','MN','IA','MO','ND','SD','NE','KS'],
  'West Coast': ['CA','WA','OR','HI'],
  'East Coast': ['NY','MA','CT','NJ','PA','DC','MD','DE','RI','NH','VT','ME'],
  South: ['TX','FL','GA','NC','SC','TN','VA','AL','MS','LA','AR','KY','WV','OK'],
  'Mountain West': ['CO','UT','AZ','NM','NV','ID','MT','WY','AK'],
};

function countryCodeToRegion(code) {
  for (const [region, codes] of Object.entries(REGION_MAP)) {
    if (codes.includes(code)) return region;
  }
  return null;
}

function usStateToRegion(stateCode) {
  for (const [region, states] of Object.entries(US_REGIONS)) {
    if (states.includes(stateCode)) return region;
  }
  return 'United States';
}

async function placesSearch(query) {
  if (!budgetCheck('places')) return null;

  const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.editorialSummary,places.addressComponents,places.location,places.businessStatus',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });

  BUDGET.placesRequestsUsed++;

  if (!resp.ok) {
    if (resp.status === 429) { await sleep(5000); return null; }
    return null;
  }
  return (await resp.json()).places?.[0] || null;
}

function parsePlaceResult(place) {
  if (!place) return null;

  const components = place.addressComponents || [];
  const get = (type) => components.find((c) => c.types.includes(type));

  const country = get('country');
  const city = get('locality') || get('postal_town') || get('administrative_area_level_2');
  const state = get('administrative_area_level_1');
  const countryCode = country?.shortText || '';

  const parts = [];
  if (city) parts.push(city.longText);
  if (state && state.longText !== city?.longText) parts.push(state.shortText || state.longText);
  if (country) parts.push(country.longText);

  let region = countryCodeToRegion(countryCode);
  if (countryCode === 'US' && state) region = usStateToRegion(state.shortText);

  return {
    location: parts.join(', ') || null,
    country: country?.longText || null,
    country_code: countryCode,
    region,
    website: place.websiteUri || null,
    description: place.editorialSummary?.text || null,
    display_name: place.displayName?.text || null,
  };
}

async function enrichViaPlaces(targetTable, whereClause, label, maxRecords = 2000) {
  log('PLACES', `${label}: fetching records...`);

  const cols = 'id,name,organization,location,country,website,description';
  const rows = await sbSelectAll(targetTable, whereClause, cols);
  const toProcess = rows.slice(0, maxRecords);

  log('PLACES', `${label}: ${toProcess.length} records to enrich`);

  let enriched = 0, failed = 0, skipped = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const r = toProcess[i];
    const searchParts = [r.name || r.organization];
    if (!/venture|capital|vc|invest|fund/i.test(searchParts[0])) searchParts.push('venture capital');
    if (r.location && r.location.length > 3) searchParts.push(r.location);

    try {
      const place = await placesSearch(searchParts.join(' '));
      const parsed = parsePlaceResult(place);

      if (!parsed) { failed++; await sleep(150); continue; }

      // Name sanity check
      const placeName = (parsed.display_name || '').toLowerCase();
      const words = r.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (words.length > 0 && !words.some((w) => placeName.includes(w))) {
        skipped++;
        await sleep(150);
        continue;
      }

      const updates = {};
      if (parsed.location && (!r.location || r.location.length < 5)) updates.location = parsed.location;
      if (parsed.country && !r.country) updates.country = parsed.country;
      if (parsed.region) updates.region = parsed.region;
      if (parsed.website && !r.website) updates.website = parsed.website;
      if (parsed.description && (!r.description || r.description.length < 50)) updates.description = parsed.description;

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await sbUpdate(targetTable, r.id, updates);
        enriched++;
      }

      if ((i + 1) % 100 === 0) {
        log('PLACES', `  ${label}: ${i + 1}/${toProcess.length} — enriched: ${enriched}, failed: ${failed}, skipped: ${skipped}`);
      }
      await sleep(150);
    } catch (err) {
      failed++;
      if (err.message?.includes('429')) {
        log('PLACES', `  Rate limited, waiting 10s...`);
        await sleep(10000);
        i--;
      }
    }
  }

  log('PLACES', `✓ ${label}: ${enriched} enriched, ${failed} failed, ${skipped} name-mismatch`);
  return enriched;
}

// ─── Phase 5: Web Scrape Enrichment ───────────────────────────────────────────
async function fetchPageMeta(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChiStartupBot/1.0)', Accept: 'text/html' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!resp.ok) return null;

    const html = await resp.text();
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is)
      || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']description["']/is);
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/is);

    return {
      description: (descMatch?.[1] || ogDesc?.[1])?.trim()?.slice(0, 500) || null,
      html: html.slice(0, 8000),
    };
  } catch { return null; }
}

function extractCheckSize(text) {
  if (!text) return null;
  const patterns = [
    /\$(\d+(?:\.\d+)?)\s*([KkMmBb])\s*[-–—to]+\s*\$(\d+(?:\.\d+)?)\s*([KkMmBb])/,
    /(?:check|ticket|invest).*?\$(\d+(?:\.\d+)?)\s*([KkMmBb])\s*[-–—to]+\s*\$(\d+(?:\.\d+)?)\s*([KkMmBb])/i,
    /(?:up to|max)\s*\$(\d+(?:\.\d+)?)\s*([KkMmBb])/i,
  ];
  const mult = (u) => ({ K: 1e3, M: 1e6, B: 1e9 }[u.toUpperCase()] || 1);

  for (const p of patterns) {
    const m = text.match(p);
    if (m && m.length >= 5) return { min: Math.round(parseFloat(m[1]) * mult(m[2])), max: Math.round(parseFloat(m[3]) * mult(m[4])) };
    if (m && m.length >= 3) {
      const val = Math.round(parseFloat(m[1]) * mult(m[2]));
      return /up to|max/i.test(m[0]) ? { min: null, max: val } : { min: val, max: null };
    }
  }
  return null;
}

function extractSectors(text) {
  if (!text) return [];
  const map = {
    fintech: /\bfintech\b|financial\s+tech/i,
    healthtech: /\bhealth\s*tech\b|biotech|medtech|digital\s+health/i,
    'ai-ml': /\bartificial\s+intelligence\b|\bmachine\s+learning\b/i,
    saas: /\bsaas\b/i,
    enterprise: /\benterprise\b|\bb2b\b/i,
    consumer: /\bconsumer\b|\bb2c\b/i,
    climate: /\bclimate\b|\bcleantech\b|\bsustainab/i,
    edtech: /\bedtech\b/i,
    deeptech: /\bdeep\s*tech\b|\brobotics\b|\bsemiconductor/i,
    crypto: /\bcrypto\b|\bblockchain\b|\bweb3\b/i,
    agtech: /\bagri?tech\b|\bagriculture/i,
    cybersecurity: /\bcyber\s*security\b/i,
    mobility: /\bmobility\b|\bautonomous/i,
  };
  return Object.entries(map).filter(([, re]) => re.test(text)).map(([k]) => k).slice(0, 5);
}

function extractStages(text) {
  if (!text) return [];
  const stages = [];
  if (/\bpre[- ]?seed\b/i.test(text)) stages.push('pre-seed');
  if (/\bseed\b/i.test(text)) stages.push('seed');
  if (/\bseries[- ]?a\b/i.test(text)) stages.push('series-a');
  if (/\bseries[- ]?b\b/i.test(text)) stages.push('series-b');
  if (/\bseries[- ]?c\b/i.test(text)) stages.push('series-c');
  if (/\bgrowth\b/i.test(text)) stages.push('growth');
  if (/\bearly[- ]?stage\b/i.test(text) && !stages.includes('seed')) stages.push('seed');
  return [...new Set(stages)];
}

async function webEnrichRecords(targetTable, whereClause, label, maxRecords = 500) {
  log('WEB', `${label}: fetching records with websites...`);

  const cols = 'id,name,description,website,check_size_min,check_size_max,sectors,stage';
  const rows = await sbSelectAll(targetTable, whereClause, cols);
  const toProcess = rows.slice(0, maxRecords);

  log('WEB', `${label}: ${toProcess.length} records to web-enrich`);

  let enriched = 0, failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const r = toProcess[i];
    if (!r.website) continue;
    if (!budgetCheck('web')) break;

    try {
      BUDGET.webFetchesUsed++;
      const meta = await fetchPageMeta(r.website);
      if (!meta) { failed++; continue; }

      const updates = {};
      const combined = (meta.description || '') + ' ' + (meta.html || '');

      if ((!r.description || r.description.length < 50) && meta.description) {
        updates.description = meta.description;
      }
      if (r.check_size_min == null && r.check_size_max == null) {
        const cs = extractCheckSize(combined);
        if (cs) {
          if (cs.min) updates.check_size_min = cs.min;
          if (cs.max) updates.check_size_max = cs.max;
        }
      }
      if (!r.sectors || r.sectors.length === 0) {
        const sectors = extractSectors(combined);
        if (sectors.length > 0) updates.sectors = sectors;
      }
      if (!r.stage || r.stage.length === 0) {
        const stages = extractStages(combined);
        if (stages.length > 0) updates.stage = stages;
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await sbUpdate(targetTable, r.id, updates);
        enriched++;
      }

      if ((i + 1) % 50 === 0) log('WEB', `  ${label}: ${i + 1}/${toProcess.length} — enriched: ${enriched}`);
      await sleep(300);
    } catch { failed++; }
  }

  log('WEB', `✓ ${label}: ${enriched} enriched, ${failed} failed`);
  return enriched;
}

// ─── Phase 6: Promote Staged → Production ─────────────────────────────────────
async function promoteStaged() {
  log('PROMOTE', 'Promoting staged records to funding_opportunities...');

  const staged = await sbSelectAll('investor_enrichment_staging', 'confidence_score=gte.50', '*');
  log('PROMOTE', `Found ${staged.length} staged records eligible`);

  const existingRows = await sbSelectAll('funding_opportunities', '', 'name');
  const existingNames = new Set(existingRows.map((r) => r.name?.toLowerCase()).filter(Boolean));

  const toPromote = staged.filter((r) => !existingNames.has(r.name?.toLowerCase()));
  log('PROMOTE', `${toPromote.length} net-new after dedup`);

  let promoted = 0;
  for (let i = 0; i < toPromote.length; i += 50) {
    const batch = toPromote.slice(i, i + 50).map((r) => ({
      name: r.name,
      organization: r.organization,
      description: r.description,
      website: r.website,
      opportunity_type: r.opportunity_type || 'vc',
      check_size_min: r.check_size_min,
      check_size_max: r.check_size_max,
      stage: r.stage || [],
      sectors: r.sectors || [],
      is_active: true,
      chicago_focused: false,
      featured: false,
      location: r.location,
    }));

    try {
      await sbInsert('funding_opportunities', batch);
      promoted += batch.length;
    } catch (err) {
      log('PROMOTE', `  Batch error: ${err.message.slice(0, 200)}`);
    }
  }

  log('PROMOTE', `✓ Promoted ${promoted} records`);
  return promoted;
}

// ─── Phase 7: Completeness Report ─────────────────────────────────────────────
function scoreCompleteness(r) {
  const w = COMPLETENESS_WEIGHTS;
  let score = 0;
  if (r.name && r.name.length > 2) score += w.name;
  if (r.organization) score += w.organization;
  if (r.description && r.description.length >= 50) score += w.description;
  else if (r.description && r.description.length >= 20) score += w.description * 0.5;
  if (r.website?.startsWith('http')) score += w.website;
  if (r.check_size_min != null || r.check_size_max != null) score += w.check_size;
  if (r.location && r.location.length > 2) score += w.location;
  if (r.sectors && r.sectors.length > 0) score += w.sectors;
  if (r.stage && r.stage.length > 0) score += w.stage;
  if (r.embedding != null) score += w.embedding;
  return score;
}

async function generateReport() {
  log('REPORT', 'Generating completeness report...');

  const rows = await sbSelectAll('funding_opportunities', '',
    'id,name,organization,description,website,check_size_min,check_size_max,sectors,stage,location,country,region,embedding,chicago_focused');

  let gold = 0, silver = 0, bronze = 0, totalScore = 0;
  const regionStats = {};
  const countryStats = {};
  const fields = { name: 0, organization: 0, description: 0, website: 0, check_size: 0, location: 0, sectors: 0, stage: 0, embedding: 0 };

  for (const r of rows) {
    const score = scoreCompleteness(r);
    totalScore += score;
    if (score >= 85) gold++;
    else if (score >= 60) silver++;
    else bronze++;

    if (r.name) fields.name++;
    if (r.organization) fields.organization++;
    if (r.description?.length >= 50) fields.description++;
    if (r.website) fields.website++;
    if (r.check_size_min != null || r.check_size_max != null) fields.check_size++;
    if (r.location) fields.location++;
    if (r.sectors?.length > 0) fields.sectors++;
    if (r.stage?.length > 0) fields.stage++;
    if (r.embedding) fields.embedding++;

    const reg = r.region || (r.chicago_focused ? 'Chicago' : 'Unknown');
    regionStats[reg] = (regionStats[reg] || 0) + 1;

    const ctry = r.country || 'Unknown';
    countryStats[ctry] = (countryStats[ctry] || 0) + 1;
  }

  const total = rows.length;
  const avg = Math.round(totalScore / (total || 1));

  const report = {
    generated_at: new Date().toISOString(),
    total_records: total,
    average_score: avg,
    tiers: { gold, gold_pct: Math.round(gold / total * 100), silver, silver_pct: Math.round(silver / total * 100), bronze, bronze_pct: Math.round(bronze / total * 100) },
    field_coverage: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, { count: v, pct: Math.round(v / total * 100) }])),
    regions: Object.fromEntries(Object.entries(regionStats).sort((a, b) => b[1] - a[1])),
    top_countries: Object.fromEntries(Object.entries(countryStats).sort((a, b) => b[1] - a[1]).slice(0, 30)),
  };

  const reportPath = path.join(PROJECT_ROOT, 'data', 'completeness-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(65));
  console.log('  COMPLETENESS REPORT');
  console.log('='.repeat(65));
  console.log(`  Total Records:       ${total}`);
  console.log(`  Average Score:       ${avg}/100`);
  console.log(`  Gold (>=85):         ${gold} (${report.tiers.gold_pct}%)`);
  console.log(`  Silver (60-84):      ${silver} (${report.tiers.silver_pct}%)`);
  console.log(`  Bronze (<60):        ${bronze} (${report.tiers.bronze_pct}%)`);
  console.log('-'.repeat(65));
  console.log('  FIELD COVERAGE:');
  for (const [f, { pct, count }] of Object.entries(report.field_coverage)) {
    const bar = '#'.repeat(Math.round(pct / 3)) + '.'.repeat(33 - Math.round(pct / 3));
    console.log(`    ${f.padEnd(14)} ${bar} ${String(pct).padStart(3)}% (${count})`);
  }
  console.log('-'.repeat(65));
  console.log('  REGIONS:');
  for (const [reg, count] of Object.entries(report.regions).slice(0, 15)) {
    console.log(`    ${reg.padEnd(25)} ${String(count).padStart(6)} records`);
  }
  console.log('-'.repeat(65));
  console.log('  TOP COUNTRIES:');
  for (const [ctry, count] of Object.entries(report.top_countries).slice(0, 15)) {
    console.log(`    ${ctry.padEnd(25)} ${String(count).padStart(6)} records`);
  }
  console.log('='.repeat(65));
  console.log(`  Saved: ${reportPath}\n`);

  return report;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '='.repeat(65));
  console.log('  INSTANCE C - International + Enrichment Pipeline');
  console.log('  Started: ' + new Date().toISOString());
  console.log('='.repeat(65) + '\n');

  const { total: startCount } = await sbSelect('funding_opportunities', 'select=id&limit=1', { count: true });
  log('MAIN', `Starting record count: ${startCount}`);

  // Phase 1: Schema
  const hasGeoColumns = await ensureSchema();

  // Phase 2: Harvest
  const harvested = await harvestAllRegions();

  // Phase 3: Dedup + stage
  await deduplicateAndStage(harvested);

  // Phase 4: Places API enrichment
  log('MAIN', '=== Phase 4: Google Places API Enrichment ===');
  if (hasGeoColumns) {
    await enrichViaPlaces(
      'funding_opportunities',
      'country=is.null&website=not.is.null&website=neq.',
      'Production (has website)',
      1500
    );
    await enrichViaPlaces(
      'funding_opportunities',
      'country=is.null&or=(website.is.null,website.eq.)',
      'Production (no website)',
      500
    );
  } else {
    log('MAIN', 'Skipping Places enrichment — country/region columns not available');
  }
  await enrichViaPlaces(
    'investor_enrichment_staging',
    'status=in.(pending,enriched)',
    'Staged',
    500
  );

  // Phase 5: Web scrape enrichment
  log('MAIN', '=== Phase 5: Web Scrape Enrichment ===');
  await webEnrichRecords(
    'funding_opportunities',
    'website=not.is.null&website=neq.&check_size_min=is.null',
    'Production (missing check_size)',
    500
  );

  // Phase 6: Promote staged
  await promoteStaged();

  // Phase 7: Report
  const report = await generateReport();

  const { total: endCount } = await sbSelect('funding_opportunities', 'select=id&limit=1', { count: true });

  budgetReport();

  console.log('='.repeat(65));
  console.log('  PIPELINE COMPLETE');
  console.log(`  Records: ${startCount} -> ${endCount}`);
  console.log(`  Avg completeness: ${report.average_score}/100`);
  console.log(`  API costs: $0 (all within free tiers)`);
  console.log('='.repeat(65) + '\n');
}

main().catch((err) => { console.error('FATAL:', err); process.exit(1); });
