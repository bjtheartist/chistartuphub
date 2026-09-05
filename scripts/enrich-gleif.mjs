#!/usr/bin/env node
/**
 * GLEIF (Global Legal Entity Identifier) Enrichment — $0 cost
 *
 * Uses the GLEIF API to look up legal entity data including:
 * - Structured headquarters address
 * - Legal name / entity category
 * - Registration country
 *
 * API: https://api.gleif.org/api/v1/fuzzycompletions?field=fulltext&q=NAME
 * and: https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=NAME
 * No auth required. Rate limit: reasonable (undocumented, ~5/sec safe).
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function normalize(name) {
  return (name || '').toLowerCase()
    .replace(/[,.'"\-()]/g, '')
    .replace(/\b(llc|lp|inc|corp|ltd|co|group|partners|capital|management|advisors|advisory|fund|holdings)\b/g, '')
    .replace(/\s+/g, ' ').trim();
}

async function gleifSearch(name) {
  const encoded = encodeURIComponent(name);
  const url = `https://api.gleif.org/api/v1/lei-records?filter%5Bentity.legalName%5D=${encoded}&page%5Bsize%5D=3`;

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.api+json',
      'User-Agent': 'ChiStartupHub/1.0',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data || [];
}

async function gleifFuzzy(name) {
  const encoded = encodeURIComponent(name);
  const url = `https://api.gleif.org/api/v1/fuzzycompletions?field=fulltext&q=${encoded}`;

  const res = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.api+json',
      'User-Agent': 'ChiStartupHub/1.0',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data || [];
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
  console.log('║  GLEIF Legal Entity Enrichment — $0 cost            ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const MAX_LOOKUPS = 3000;
  let offset = 0;
  let lookups = 0, matched = 0, enrichedLocation = 0, enrichedCountry = 0;
  let errors = 0;

  while (lookups < MAX_LOOKUPS) {
    // Fetch records missing location
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/funding_opportunities?select=id,name,organization,location,country,website,description,completeness_score&location=is.null&limit=500&offset=${offset}`,
      { headers }
    );
    const records = await res.json();
    if (records.length === 0) break;
    console.log(`Batch: ${records.length} records (offset ${offset})`);

    for (const rec of records) {
      if (lookups >= MAX_LOOKUPS) break;

      const searchName = rec.organization || rec.name;
      if (!searchName || searchName.length < 5) continue;

      lookups++;
      try {
        // Try exact match first
        let leiRecords = await gleifSearch(searchName);

        if (!leiRecords || leiRecords.length === 0) {
          // Skip fuzzy for now — too slow and imprecise at scale
          if (lookups % 5 === 0) await sleep(1000);
          continue;
        }

        // Verify name match
        const normSearch = normalize(searchName);
        const best = leiRecords.find(r => {
          const leiName = normalize(r.attributes?.entity?.legalName?.name || '');
          return leiName.includes(normSearch) || normSearch.includes(leiName);
        });

        if (!best) {
          if (lookups % 5 === 0) await sleep(1000);
          continue;
        }

        const entity = best.attributes?.entity;
        if (!entity) continue;

        const patch = {};

        // Extract headquarters address
        const hq = entity.headquartersAddress;
        if (hq) {
          const parts = [];
          if (hq.city) parts.push(hq.city);
          if (hq.region) parts.push(hq.region);
          if (hq.country) parts.push(hq.country);
          if (parts.length > 0) {
            patch.location = parts.join(', ');
            enrichedLocation++;
          }
        }

        // Extract country
        const legalAddr = entity.legalAddress;
        if (!rec.country && (legalAddr?.country || hq?.country)) {
          patch.country = legalAddr?.country || hq?.country;
          enrichedCountry++;
        }

        if (Object.keys(patch).length > 0) {
          const merged = { ...rec, ...patch };
          patch.completeness_score = calcScore(merged);
          await fetch(`${SUPABASE_URL}/rest/v1/funding_opportunities?id=eq.${rec.id}`, {
            method: 'PATCH', headers, body: JSON.stringify(patch),
          });
          matched++;
        }

        // Rate limit
        if (lookups % 5 === 0) await sleep(1000);
        if (lookups % 200 === 0) {
          console.log(`  Progress: ${lookups} lookups | ${matched} matched | +${enrichedLocation} locations | +${enrichedCountry} countries | ${errors} errors`);
        }
      } catch (err) {
        errors++;
        if (err.message.includes('429') || err.message.includes('403')) {
          console.warn('  Rate limited, backing off 30s...');
          await sleep(30000);
        }
        if (errors > 50) { console.error('Too many errors, stopping.'); break; }
      }
    }

    offset += 500;
    if (records.length < 500) break;
  }

  console.log(`\n✓ GLEIF enrichment complete:`);
  console.log(`  Lookups: ${lookups}`);
  console.log(`  Matched: ${matched}`);
  console.log(`  Locations added: ${enrichedLocation}`);
  console.log(`  Countries added: ${enrichedCountry}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Cost: $0.00`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
