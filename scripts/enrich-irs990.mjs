#!/usr/bin/env node
/**
 * IRS 990 Enrichment — $0 cost
 *
 * Uses the IRS 990 e-file index (free bulk CSV) to find foundation/nonprofit
 * grant makers and enrich records with addresses, assets, and EINs.
 *
 * Data source: https://www.irs.gov/charities-non-profits/form-990-series-downloads
 * We use the e-file index CSV which is lightweight.
 * Also uses ProPublica Nonprofit Explorer API (free, no key).
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream, existsSync, readFileSync, createReadStream } from 'fs';
import { createInterface } from 'readline';
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

const DATA_DIR = resolve(__dirname, '..', 'data');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function normalize(name) {
  return (name || '').toLowerCase()
    .replace(/[,.'"\-()]/g, '')
    .replace(/\b(llc|lp|inc|corp|ltd|co|group|partners|capital|management|advisors|advisory|fund|holdings|foundation|trust|the)\b/g, '')
    .replace(/\s+/g, ' ').trim();
}

// --- ProPublica Nonprofit Explorer API (free, no key) ---
async function searchNonprofit(name) {
  const encoded = encodeURIComponent(name);
  const url = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encoded}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'ChiStartupHub/1.0 (billyjoseph243@gmail.com)' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.organizations || [];
}

async function getNonprofitDetails(ein) {
  const url = `https://projects.propublica.org/nonprofits/api/v2/organizations/${ein}.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ChiStartupHub/1.0 (billyjoseph243@gmail.com)' },
  });
  if (!res.ok) return null;
  return res.json();
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
  console.log('║  IRS 990 / ProPublica Enrichment — $0 cost          ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Strategy: Search our DB for records that look like foundations/nonprofits
  // then look them up on ProPublica Nonprofit Explorer

  const foundationKeywords = ['foundation', 'endowment', 'charitable', 'philanthrop', 'grant', 'community fund'];

  let totalMatched = 0, enrichedWebsite = 0, enrichedLocation = 0, enrichedDesc = 0;
  let lookups = 0;
  const MAX_LOOKUPS = 2000;
  const errors = [];

  for (const keyword of foundationKeywords) {
    console.log(`\nSearching for "${keyword}" records...`);
    let offset = 0;

    while (lookups < MAX_LOOKUPS) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/funding_opportunities?select=id,name,organization,description,website,location,completeness_score&or=(name.ilike.*${keyword}*,organization.ilike.*${keyword}*)&completeness_score=lt.55&limit=500&offset=${offset}`,
        { headers }
      );
      const records = await res.json();
      if (records.length === 0) break;

      for (const rec of records) {
        if (lookups >= MAX_LOOKUPS) break;

        const searchName = rec.organization || rec.name;
        if (!searchName || searchName.length < 5) continue;

        lookups++;
        try {
          const orgs = await searchNonprofit(searchName);
          if (!orgs || orgs.length === 0) continue;

          // Find best match by normalized name
          const normSearch = normalize(searchName);
          const bestMatch = orgs.find(o => normalize(o.name) === normSearch) || orgs[0];

          // Check name similarity before accepting
          const matchNorm = normalize(bestMatch.name);
          if (!matchNorm.includes(normSearch) && !normSearch.includes(matchNorm)) continue;

          const patch = {};

          // Location from ProPublica
          if (!rec.location && (bestMatch.city || bestMatch.state)) {
            const parts = [];
            if (bestMatch.city) parts.push(bestMatch.city);
            if (bestMatch.state) parts.push(bestMatch.state);
            patch.location = parts.join(', ');
            enrichedLocation++;
          }

          // Try to get details for website
          if (!rec.website && bestMatch.ein) {
            try {
              const details = await getNonprofitDetails(bestMatch.ein);
              if (details?.organization?.website) {
                let website = details.organization.website;
                if (!website.startsWith('http')) website = 'https://' + website;
                patch.website = website;
                enrichedWebsite++;
              }
            } catch { /* skip */ }
          }

          // Better description
          if ((!rec.description || rec.description.length < 30) && bestMatch.ntee_code) {
            const desc = `${bestMatch.name} — Nonprofit organization (EIN: ${bestMatch.ein}). ` +
              `NTEE code: ${bestMatch.ntee_code}. ` +
              (bestMatch.total_revenue ? `Total revenue: $${(bestMatch.total_revenue / 1e6).toFixed(1)}M. ` : '') +
              (bestMatch.city && bestMatch.state ? `Based in ${bestMatch.city}, ${bestMatch.state}.` : '');
            patch.description = desc;
            enrichedDesc++;
          }

          if (Object.keys(patch).length > 0) {
            const merged = { ...rec, ...patch };
            patch.completeness_score = calcScore(merged);
            await fetch(`${SUPABASE_URL}/rest/v1/funding_opportunities?id=eq.${rec.id}`, {
              method: 'PATCH', headers, body: JSON.stringify(patch),
            });
            totalMatched++;
          }

          // Rate limit: 3/sec for ProPublica
          if (lookups % 3 === 0) await sleep(1000);
          if (lookups % 100 === 0) {
            console.log(`  Progress: ${lookups} lookups | ${totalMatched} matched | +${enrichedLocation} loc | +${enrichedWebsite} web | +${enrichedDesc} desc`);
          }
        } catch (err) {
          errors.push(err.message);
          if (errors.length > 30) { console.error('Too many errors, stopping.'); break; }
        }
      }

      offset += 500;
      if (records.length < 500) break;
    }
  }

  console.log(`\n✓ IRS 990 / ProPublica enrichment complete:`);
  console.log(`  Lookups: ${lookups}`);
  console.log(`  Matched: ${totalMatched}`);
  console.log(`  Websites added: ${enrichedWebsite}`);
  console.log(`  Locations added: ${enrichedLocation}`);
  console.log(`  Descriptions added: ${enrichedDesc}`);
  console.log(`  Errors: ${errors.length}`);
  console.log(`  Cost: $0.00`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
