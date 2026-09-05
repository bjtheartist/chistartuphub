#!/usr/bin/env node
/**
 * USAspending.gov Enrichment — $0 cost
 *
 * Uses the USAspending.gov API to find federal grants, SBIR/STTR awards,
 * and other funding opportunities with award amounts and recipient data.
 *
 * API: https://api.usaspending.gov/api/v2/search/spending_by_award/
 * No auth required. Generous rate limits.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing env vars'); process.exit(1); }

const supaHeaders = {
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

// --- USAspending API: search recipients ---
async function searchRecipient(name) {
  const url = 'https://api.usaspending.gov/api/v2/autocomplete/recipient/';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search_text: name, limit: 5 }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results || [];
}

// --- USAspending API: search awards by keyword ---
async function searchAwards(keyword) {
  const url = 'https://api.usaspending.gov/api/v2/search/spending_by_award/';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        keywords: [keyword],
        award_type_codes: ['02', '03', '04', '05'], // grants
        time_period: [{ start_date: '2020-01-01', end_date: '2026-12-31' }],
      },
      fields: ['Award ID', 'Recipient Name', 'Description', 'Award Amount', 'recipient_id',
               'Place of Performance City Code', 'Place of Performance State Code'],
      limit: 10,
      page: 1,
      sort: 'Award Amount',
      order: 'desc',
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results || [];
}

// --- USAspending: get recipient profile ---
async function getRecipientProfile(recipientId) {
  const url = `https://api.usaspending.gov/api/v2/recipient/${recipientId}/`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
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
  console.log('║  USAspending.gov Enrichment — $0 cost               ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Strategy: Look for records that are government-related (SBIR, STTR, federal, grant)
  // and try to match them to USAspending data for check sizes and locations

  const govKeywords = ['sbir', 'sttr', 'federal', 'nsf', 'nih', 'doe', 'darpa', 'arpa', 'government grant'];

  let lookups = 0, matched = 0;
  let enrichedCheckSize = 0, enrichedLocation = 0, enrichedDesc = 0;
  let errors = 0;
  const MAX_LOOKUPS = 1500;

  for (const keyword of govKeywords) {
    console.log(`\nSearching for "${keyword}" records...`);
    let offset = 0;

    while (lookups < MAX_LOOKUPS) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/funding_opportunities?select=id,name,organization,description,website,location,check_size_min,check_size_max,completeness_score&or=(name.ilike.*${keyword}*,organization.ilike.*${keyword}*,description.ilike.*${keyword}*)&completeness_score=lt.55&limit=200&offset=${offset}`,
        { headers: supaHeaders }
      );
      const records = await res.json();
      if (records.length === 0) break;

      for (const rec of records) {
        if (lookups >= MAX_LOOKUPS) break;

        const searchName = rec.organization || rec.name;
        if (!searchName || searchName.length < 4) continue;

        lookups++;
        try {
          // Search for this entity as a recipient
          const recipients = await searchRecipient(searchName);
          if (!recipients || recipients.length === 0) {
            if (lookups % 3 === 0) await sleep(1000);
            continue;
          }

          // Find best match
          const normSearch = normalize(searchName);
          const best = recipients.find(r => {
            const rNorm = normalize(r.recipient_name || '');
            return rNorm.includes(normSearch) || normSearch.includes(rNorm);
          });

          if (!best) {
            if (lookups % 3 === 0) await sleep(1000);
            continue;
          }

          const patch = {};

          // Location from recipient
          if (!rec.location && best.recipient_level) {
            // Try to get profile for location
            if (best.recipient_id) {
              try {
                const profile = await getRecipientProfile(best.recipient_id);
                if (profile?.location) {
                  const parts = [];
                  if (profile.location.city_name) parts.push(profile.location.city_name);
                  if (profile.location.state_code) parts.push(profile.location.state_code);
                  if (parts.length > 0) {
                    patch.location = parts.join(', ');
                    enrichedLocation++;
                  }
                }
              } catch { /* skip */ }
            }
          }

          // Check size from award amounts
          if (!rec.check_size_min && !rec.check_size_max && best.recipient_id) {
            try {
              const awards = await searchAwards(searchName);
              if (awards && awards.length > 0) {
                const amounts = awards
                  .map(a => parseFloat(a['Award Amount']))
                  .filter(a => a > 0);
                if (amounts.length > 0) {
                  patch.check_size_min = Math.min(...amounts);
                  patch.check_size_max = Math.max(...amounts);
                  enrichedCheckSize++;
                }
              }
            } catch { /* skip */ }
          }

          if (Object.keys(patch).length > 0) {
            const merged = { ...rec, ...patch };
            patch.completeness_score = calcScore(merged);
            await fetch(`${SUPABASE_URL}/rest/v1/funding_opportunities?id=eq.${rec.id}`, {
              method: 'PATCH', headers: supaHeaders, body: JSON.stringify(patch),
            });
            matched++;
          }

          // Rate limit
          if (lookups % 3 === 0) await sleep(1000);
          if (lookups % 100 === 0) {
            console.log(`  Progress: ${lookups} lookups | ${matched} matched | +${enrichedCheckSize} check sizes | +${enrichedLocation} locations`);
          }
        } catch (err) {
          errors++;
          if (err.message.includes('429')) {
            console.warn('  Rate limited, backing off 60s...');
            await sleep(60000);
          }
          if (errors > 30) { console.error('Too many errors, stopping.'); break; }
        }
      }

      offset += 200;
      if (records.length < 200) break;
    }
  }

  console.log(`\n✓ USAspending enrichment complete:`);
  console.log(`  Lookups: ${lookups}`);
  console.log(`  Matched: ${matched}`);
  console.log(`  Check sizes added: ${enrichedCheckSize}`);
  console.log(`  Locations added: ${enrichedLocation}`);
  console.log(`  Descriptions added: ${enrichedDesc}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Cost: $0.00`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
