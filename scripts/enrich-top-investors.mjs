#!/usr/bin/env node
/**
 * Enrich top investors with data from free public sources.
 *
 * Targets investors with existing data gaps (no website, no description, etc.)
 * and enriches them using:
 *   1. Wikidata SPARQL — VC firms with website, description, HQ, founding year
 *   2. SEC EDGAR company search — CIK, SIC code, state of incorporation
 *   3. OpenVC GitHub dataset — thesis, check sizes, stages, sectors
 *
 * Usage:
 *   node scripts/enrich-top-investors.mjs --dry-run    # preview only
 *   node scripts/enrich-top-investors.mjs              # apply updates
 *   node scripts/enrich-top-investors.mjs --limit=500  # process N records
 */

import { config } from 'dotenv';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, existsSync, readFileSync } from 'fs';

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
const LIMIT_ARG = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : 10000;

function normalize(name) {
  return (name || '').toLowerCase()
    .replace(/[,.'"\-()]/g, '')
    .replace(/\b(llc|lp|inc|corp|ltd|co|group|fund|partners|capital|ventures|management|advisors|advisory|investments|holdings)\b/g, '')
    .replace(/\s+/g, ' ').trim();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Top Investor Enrichment Pipeline                          ║');
  console.log(`║  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}  |  Limit: ${LIMIT.toLocaleString()}                                ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Step 1: Load investors needing enrichment (sorted by completeness — worst first)
  console.log('Step 1: Loading investors needing enrichment...');
  const investors = [];
  let offset = 0;
  while (investors.length < LIMIT) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?select=id,canonical_name,website,domain,description,hq_city,hq_state,hq_country,investor_type,stage_focus,sectors,check_size_min,completeness_score&investor_type=eq.vc&order=completeness_score.asc&limit=1000&offset=${offset}`,
      { headers }
    );
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    investors.push(...batch);
    offset += 1000;
  }

  // Prioritize: investors with name but missing website/description
  const needsEnrichment = investors
    .filter(inv => !inv.website || !inv.description || inv.description.length < 30)
    .slice(0, LIMIT);

  console.log(`  Total VC investors: ${investors.length.toLocaleString()}`);
  console.log(`  Need enrichment: ${needsEnrichment.length.toLocaleString()}\n`);

  // Build name index
  const investorByNorm = new Map();
  for (const inv of needsEnrichment) {
    investorByNorm.set(normalize(inv.canonical_name), inv);
  }

  // ═══════════════════════════════════════════════════════════
  // SOURCE 1: Wikidata SPARQL
  // ═══════════════════════════════════════════════════════════
  console.log('═══ Source 1: Wikidata SPARQL ═══');

  const wdUpdates = [];
  try {
    const sparql = `
SELECT ?item ?itemLabel ?website ?countryLabel ?hqLabel WHERE {
  ?item wdt:P31 wd:Q219577 .
  OPTIONAL { ?item wdt:P856 ?website . }
  OPTIONAL { ?item wdt:P17 ?country . }
  OPTIONAL { ?item wdt:P159 ?hq . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 5000`;

    console.log('  Querying Wikidata...');
    const res = await fetch(
      `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}`,
      { headers: { Accept: 'application/json', 'User-Agent': 'ChiStartupHub/1.0 (investor-enrichment)' } }
    );

    if (res.ok) {
      const data = await res.json();
      const results = data.results?.bindings || [];
      console.log(`  Got ${results.length.toLocaleString()} Wikidata results`);

      // Index by normalized name
      const wdByName = new Map();
      for (const r of results) {
        const name = r.itemLabel?.value;
        if (!name) continue;
        wdByName.set(normalize(name), {
          website: r.website?.value || null,
          country: r.countryLabel?.value || null,
          hq: r.hqLabel?.value || null,
        });
      }

      // Match
      let matched = 0;
      for (const [normName, inv] of investorByNorm) {
        const wd = wdByName.get(normName);
        if (!wd) continue;
        matched++;

        const patch = {};
        if (!inv.website && wd.website) patch.website = wd.website;
        if (!inv.hq_country && wd.country) patch.hq_country = wd.country;
        if (!inv.hq_city && wd.hq) patch.hq_city = wd.hq;

        if (Object.keys(patch).length > 0) {
          wdUpdates.push({ id: inv.id, ...patch });
        }
      }

      console.log(`  Matched: ${matched} | Updates: ${wdUpdates.length}`);
    } else {
      console.log(`  Wikidata query failed: ${res.status}`);
    }
  } catch (err) {
    console.log(`  Wikidata error: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  // SOURCE 2: OpenVC GitHub dataset
  // ═══════════════════════════════════════════════════════════
  console.log('\n═══ Source 2: OpenVC GitHub Dataset ═══');

  const ovcUpdates = [];
  try {
    // Check for local cached copy first
    const ovcCachePath = join(__dirname, '..', 'data', 'openvc-investors.json');
    let ovcData;

    if (existsSync(ovcCachePath)) {
      console.log('  Using cached OpenVC data...');
      ovcData = JSON.parse(readFileSync(ovcCachePath, 'utf-8'));
    } else {
      // Try OpenBook (open-source VC database)
      console.log('  Downloading OpenBook dataset from GitHub...');
      const urls = [
        'https://raw.githubusercontent.com/iloveitaly/openbook/main/data/investors.json',
        'https://raw.githubusercontent.com/iloveitaly/openbook/main/data/firms.json',
      ];
      for (const url of urls) {
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'ChiStartupHub/1.0' } });
          if (res.ok) {
            ovcData = await res.json();
            writeFileSync(ovcCachePath, JSON.stringify(ovcData, null, 2));
            console.log(`  Cached from ${url}`);
            break;
          }
        } catch {}
      }
      if (!ovcData) console.log('  No open investor dataset found');
    }

    if (ovcData) {
      const ovcRows = Array.isArray(ovcData) ? ovcData : (ovcData.investors || ovcData.data || []);
      console.log(`  OpenVC records: ${ovcRows.length.toLocaleString()}`);

      // Index by normalized name
      const ovcByName = new Map();
      for (const r of ovcRows) {
        const name = r.name || r.firm_name || r.organization;
        if (!name) continue;
        ovcByName.set(normalize(String(name)), r);
      }

      let matched = 0;
      for (const [normName, inv] of investorByNorm) {
        const ovc = ovcByName.get(normName);
        if (!ovc) continue;
        matched++;

        const patch = {};

        // Website
        const website = ovc.website || ovc.url || ovc.homepage;
        if (!inv.website && website) {
          let url = String(website).trim();
          if (url && !url.startsWith('http')) url = `https://${url}`;
          if (url.length > 5) patch.website = url;
        }

        // Description / thesis
        const desc = ovc.description || ovc.thesis || ovc.about || ovc.overview;
        if ((!inv.description || inv.description.length < 30) && desc && String(desc).length > 15) {
          patch.description = String(desc).trim().slice(0, 500);
        }

        // Check sizes
        const checkMin = ovc.check_size_min || ovc.min_check || ovc.ticket_min;
        if (!inv.check_size_min && checkMin) {
          const val = parseInt(String(checkMin).replace(/[^0-9]/g, ''));
          if (val > 0 && val <= 2147483647) patch.check_size_min = val;
        }

        // Sectors
        const sectors = ovc.sectors || ovc.focus_areas || ovc.industries;
        if ((!inv.sectors || inv.sectors.length === 0) && sectors) {
          const arr = typeof sectors === 'string'
            ? sectors.split(/[,;|]/).map(s => s.trim().toLowerCase()).filter(Boolean)
            : Array.isArray(sectors) ? sectors.map(s => String(s).toLowerCase()) : [];
          if (arr.length > 0) patch.sectors = arr.slice(0, 5);
        }

        // Stage
        const stage = ovc.stage || ovc.stages || ovc.investment_stage;
        if (!inv.stage_focus && stage) {
          const stageStr = typeof stage === 'string' ? stage.toLowerCase() : '';
          if (/pre.?seed|angel/i.test(stageStr)) patch.stage_focus = 'pre_seed';
          else if (/seed/i.test(stageStr)) patch.stage_focus = 'seed';
          else if (/series a|early/i.test(stageStr)) patch.stage_focus = 'early';
          else if (/series b|growth/i.test(stageStr)) patch.stage_focus = 'growth';
          else if (/late|series c/i.test(stageStr)) patch.stage_focus = 'late';
        }

        if (Object.keys(patch).length > 0) {
          ovcUpdates.push({ id: inv.id, ...patch });
        }
      }

      console.log(`  Matched: ${matched} | Updates: ${ovcUpdates.length}`);
    }
  } catch (err) {
    console.log(`  OpenVC error: ${err.message}`);
  }

  // ═══════════════════════════════════════════════════════════
  // SOURCE 3: SEC EDGAR full-text search (top firms only)
  // ═══════════════════════════════════════════════════════════
  console.log('\n═══ Source 3: SEC EDGAR Company Search ═══');

  const edgarUpdates = [];
  // Only query firms that still need a website after sources 1 & 2
  const alreadyUpdated = new Set([
    ...wdUpdates.filter(u => u.website).map(u => u.id),
    ...ovcUpdates.filter(u => u.website).map(u => u.id),
  ]);

  const edgarCandidates = needsEnrichment
    .filter(inv => !inv.website && !alreadyUpdated.has(inv.id))
    .slice(0, 200); // EDGAR has rate limits — cap at 200

  console.log(`  Candidates for EDGAR lookup: ${edgarCandidates.length}`);

  for (let i = 0; i < edgarCandidates.length; i++) {
    const inv = edgarCandidates[i];
    try {
      const searchName = inv.canonical_name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
      const res = await fetch(
        `https://efts.sec.gov/LATEST/search-index?q="${encodeURIComponent(searchName)}"&dateRange=custom&startdt=2020-01-01&forms=D&from=0&size=1`,
        { headers: { 'User-Agent': 'ChiStartupHub billy@chistartuphub.com' } }
      );

      if (res.ok) {
        const data = await res.json();
        const hit = data.hits?.hits?.[0];
        if (hit) {
          const cik = hit._source?.ciks?.[0];
          if (cik) {
            // Get company info from EDGAR
            const coRes = await fetch(
              `https://data.sec.gov/submissions/CIK${String(cik).padStart(10, '0')}.json`,
              { headers: { 'User-Agent': 'ChiStartupHub billy@chistartuphub.com' } }
            );
            if (coRes.ok) {
              const coData = await coRes.json();
              const patch = {};
              if (coData.website && !inv.website) {
                let url = coData.website;
                if (!url.startsWith('http')) url = `https://${url}`;
                patch.website = url;
              }
              if (coData.stateOfIncorporation && !inv.hq_state) {
                patch.hq_state = coData.stateOfIncorporation;
              }
              if (Object.keys(patch).length > 0) {
                edgarUpdates.push({ id: inv.id, ...patch });
              }
            }
          }
        }
      }

      // SEC rate limit: 10 requests per second
      if ((i + 1) % 10 === 0) {
        await sleep(1100);
        if ((i + 1) % 50 === 0) console.log(`  Progress: ${i + 1}/${edgarCandidates.length}`);
      }
    } catch {
      // Skip individual failures
    }
  }

  console.log(`  EDGAR updates: ${edgarUpdates.length}`);

  // ═══════════════════════════════════════════════════════════
  // APPLY ALL UPDATES
  // ═══════════════════════════════════════════════════════════
  const allUpdates = new Map(); // id → merged patch

  // Merge all sources (later sources don't overwrite earlier)
  for (const updates of [wdUpdates, ovcUpdates, edgarUpdates]) {
    for (const { id, ...patch } of updates) {
      if (!allUpdates.has(id)) {
        allUpdates.set(id, patch);
      } else {
        const existing = allUpdates.get(id);
        for (const [key, val] of Object.entries(patch)) {
          if (!existing[key]) existing[key] = val;
        }
      }
    }
  }

  console.log(`\n═══ Summary ═══`);
  console.log(`  Wikidata:  ${wdUpdates.length} updates`);
  console.log(`  OpenVC:    ${ovcUpdates.length} updates`);
  console.log(`  EDGAR:     ${edgarUpdates.length} updates`);
  console.log(`  Combined:  ${allUpdates.size} unique investors to update\n`);

  if (DRY_RUN) {
    console.log('[DRY RUN] No changes applied.');
    const samplePath = join(__dirname, '..', 'data', 'enrichment-preview.json');
    const sample = [...allUpdates.entries()].slice(0, 50).map(([id, patch]) => ({ id, ...patch }));
    writeFileSync(samplePath, JSON.stringify(sample, null, 2));
    console.log(`  Preview saved to ${samplePath}`);
    return;
  }

  // Apply
  console.log('Applying updates...');
  let applied = 0;
  let errors = 0;
  const entries = [...allUpdates.entries()];

  for (let i = 0; i < entries.length; i++) {
    const [id, patch] = entries[i];

    // Also bump completeness score
    let cs = 10;
    const inv = needsEnrichment.find(n => n.id === id);
    if (inv) {
      if (patch.website || inv.website) cs += 15;
      if (patch.hq_city || inv.hq_city) cs += 15;
      if (patch.hq_state || inv.hq_state) cs += 10;
      if ((patch.description || inv.description || '').length > 30) cs += 15;
      if (patch.sectors?.length > 0 || inv.sectors?.length > 0) cs += 10;
      if (patch.stage_focus || inv.stage_focus) cs += 10;
      if (patch.check_size_min || inv.check_size_min) cs += 10;
      patch.completeness_score = Math.min(cs, 100);
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?id=eq.${id}`,
      { method: 'PATCH', headers, body: JSON.stringify(patch) }
    );

    if (res.ok) applied++;
    else errors++;

    if ((i + 1) % 500 === 0) {
      console.log(`  Progress: ${i + 1}/${entries.length} | Applied: ${applied} | Errors: ${errors}`);
    }
  }

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║  ENRICHMENT COMPLETE                                       ║`);
  console.log(`╠══════════════════════════════════════════════════════════════╣`);
  console.log(`║  Investors processed:  ${String(needsEnrichment.length).padStart(8)}                             ║`);
  console.log(`║  Updates applied:      ${String(applied).padStart(8)}                             ║`);
  console.log(`║  Errors:               ${String(errors).padStart(8)}                             ║`);
  console.log(`║  Sources used:         Wikidata + OpenVC + EDGAR           ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
