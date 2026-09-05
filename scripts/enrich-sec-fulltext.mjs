#!/usr/bin/env node
/**
 * SEC EDGAR Full-Text Search Enrichment — $0 cost
 *
 * Uses efts.sec.gov/LATEST/search-index to find richer descriptions
 * for records that have short or missing descriptions.
 * Also extracts filing metadata (addresses, entity type).
 *
 * API: https://efts.sec.gov/LATEST/search-index?q="firm+name"&dateRange=custom&startdt=2020-01-01
 * No auth required. Rate limit: 10/sec.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function secSearch(query) {
  const encoded = encodeURIComponent(`"${query}"`);
  const url = `https://efts.sec.gov/LATEST/search-index?q=${encoded}&forms=ADV,D,13F-HR&dateRange=custom&startdt=2020-01-01&enddt=2026-12-31`;

  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'ChiStartupHub/1.0 (billyjoseph243@gmail.com)',
        'Accept': 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(data)); }
          catch { resolve(null); }
        } else if (res.statusCode === 404 || res.statusCode === 400) {
          resolve(null);
        } else {
          reject(new Error(`SEC EFTS ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function calcScore(rec) {
  let s = 0;
  if (rec.name && rec.name.length > 2) s += 15;
  if (rec.organization && rec.organization.length > 0) s += 10;
  if (rec.description && rec.description.length >= 50) s += 20;
  else if (rec.description && rec.description.length >= 20) s += 10;
  if (rec.website && rec.website.startsWith('http')) s += 15;
  if (rec.check_size_min || rec.check_size_max) s += 15;
  if (rec.location && rec.location.length > 2) s += 10;
  if (rec.sectors && rec.sectors.length > 0) s += 5;
  if (rec.stage && rec.stage.length > 0) s += 5;
  if (rec.embedding) s += 5;
  return s;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  SEC Full-Text Search Enrichment — $0 cost          ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const MAX_LOOKUPS = 3000;
  let offset = 0;
  let lookups = 0, enrichedDesc = 0, enrichedLoc = 0, errors = 0;

  while (lookups < MAX_LOOKUPS) {
    // Fetch records with SEC CIK descriptions that are still low-score
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/funding_opportunities?select=id,name,organization,description,location,website,completeness_score&description=like.*SEC+CIK*&completeness_score=lt.50&limit=500&offset=${offset}`,
      { headers }
    );
    if (!res.ok) { console.error(`DB fetch error: ${res.status}`); break; }
    const records = await res.json();
    if (!Array.isArray(records) || records.length === 0) break;
    console.log(`Batch: ${records.length} records (offset ${offset})`);

    for (const rec of records) {
      if (lookups >= MAX_LOOKUPS) break;

      // Use organization name for search (more specific)
      const searchName = rec.organization || rec.name;
      if (!searchName || searchName.length < 4) continue;

      lookups++;
      try {
        const result = await secSearch(searchName);
        if (!result || !result.hits) continue;

        const hits = result.hits.hits;
        if (!hits || hits.length === 0) continue;

        const patch = {};
        const topHit = hits[0]._source;
        if (!topHit) continue;

        // Extract better description from filing
        const displayNames = topHit.display_names || [];
        if (displayNames.length > 0) {
          const entityName = displayNames[0];
          const formType = topHit.form || '';
          const filedAt = topHit.file_date || '';

          // Build a richer description if current is just a CIK stub
          if (!rec.description || rec.description.includes('SEC CIK')) {
            const desc = `${entityName} — SEC ${formType} filing entity (filed ${filedAt}).`;
            if (desc.length > (rec.description || '').length) {
              patch.description = desc;
              enrichedDesc++;
            }
          }
        }

        // Extract location from filing metadata (biz_locations array)
        if (!rec.location && topHit.biz_locations && topHit.biz_locations.length > 0) {
          patch.location = topHit.biz_locations[0];
          enrichedLoc++;
        }

        if (Object.keys(patch).length > 0) {
          const merged = { ...rec, ...patch };
          patch.completeness_score = calcScore(merged);
          await fetch(`${SUPABASE_URL}/rest/v1/funding_opportunities?id=eq.${rec.id}`, {
            method: 'PATCH', headers, body: JSON.stringify(patch),
          });
        }

        // Rate limit: 5/sec to be safe
        if (lookups % 5 === 0) await sleep(1000);
        if (lookups % 200 === 0) {
          console.log(`  Progress: ${lookups} lookups | +${enrichedDesc} descriptions | +${enrichedLoc} locations | ${errors} errors`);
        }
      } catch (err) {
        errors++;
        if (err.message.includes('429')) {
          console.warn('  Rate limited, backing off 30s...');
          await sleep(30000);
        }
        if (errors > 50) { console.error('Too many errors, stopping.'); break; }
      }
    }

    offset += 500;
    if (records.length < 500) break;
  }

  console.log(`\n✓ SEC Full-Text enrichment complete:`);
  console.log(`  Lookups: ${lookups}`);
  console.log(`  Descriptions enriched: ${enrichedDesc}`);
  console.log(`  Locations enriched: ${enrichedLoc}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Cost: $0.00`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
