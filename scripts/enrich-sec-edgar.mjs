#!/usr/bin/env node
/**
 * SEC CIK → Address Enrichment Script
 *
 * Two-pass enrichment using completely free data:
 * 1. Parse "Located in City, ST" from existing descriptions → populate location field
 * 2. Extract CIK from descriptions → call SEC EDGAR API → backfill website + address
 *
 * SEC EDGAR API: https://data.sec.gov/submissions/CIK{number}.json
 * Rate limit: 10 requests/second (we'll do 5/s to be safe)
 * Cost: $0 — no auth, no API key needed
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

// --- Supabase REST helpers ---

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePatch(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH ${table}/${id}: ${res.status} ${await res.text()}`);
}

// --- SEC EDGAR API helper ---

function secFetch(cik) {
  const paddedCik = cik.padStart(10, '0');
  const url = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;

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
        } else if (res.statusCode === 404) {
          resolve(null);
        } else {
          reject(new Error(`SEC API ${res.statusCode} for CIK ${cik}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('SEC timeout')); });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// --- Pass 1: Parse "Located in ..." from descriptions ---

async function pass1ParseLocations() {
  console.log('\n=== PASS 1: Parse locations from descriptions ===\n');

  // Fetch bronze records with location-like descriptions but no location field
  const locationPattern = 'Located in';
  let updated = 0;
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const records = await supabaseGet(
      `funding_opportunities?select=id,description&location=is.null&description=like.*Located in*&limit=${batchSize}&offset=${offset}`
    );

    if (records.length === 0) break;
    console.log(`  Fetched batch of ${records.length} records (offset ${offset})`);

    for (const rec of records) {
      // Pattern: "Located in City, ST" or "Located in City, State"
      const match = rec.description.match(/Located in ([A-Za-z\s.'-]+,\s*[A-Z]{2}(?:\s+\d{5})?)/);
      if (match) {
        const location = match[1].trim();
        await supabasePatch('funding_opportunities', rec.id, { location });
        updated++;
      }
    }

    offset += batchSize;
    if (records.length < batchSize) break;
  }

  console.log(`  ✓ Pass 1 complete: ${updated} records got location from description parsing\n`);
  return updated;
}

// --- Pass 2: SEC EDGAR CIK lookups ---

async function pass2SecEdgar() {
  console.log('=== PASS 2: SEC EDGAR CIK → address + website enrichment ===\n');

  let offset = 0;
  const batchSize = 1000;
  let totalProcessed = 0;
  let enrichedLocation = 0;
  let enrichedWebsite = 0;
  let errors = 0;
  const MAX_LOOKUPS = 5000; // Safety cap per run

  while (totalProcessed < MAX_LOOKUPS) {
    // Fetch records that have SEC CIK in description and are missing location or website
    const records = await supabaseGet(
      `funding_opportunities?select=id,description,location,website&or=(location.is.null,website.is.null)&description=like.*SEC CIK*&limit=${batchSize}&offset=${offset}`
    );

    if (records.length === 0) break;
    console.log(`  Fetched batch of ${records.length} records (offset ${offset})`);

    for (const rec of records) {
      if (totalProcessed >= MAX_LOOKUPS) break;

      // Extract CIK number from description
      const cikMatch = rec.description.match(/SEC CIK:\s*(\d+)/);
      if (!cikMatch) continue;

      const cik = cikMatch[1];
      totalProcessed++;

      try {
        const secData = await secFetch(cik);
        if (!secData) continue;

        const patch = {};

        // Extract address if location is missing
        if (!rec.location && secData.addresses) {
          const addr = secData.addresses.business || secData.addresses.mailing;
          if (addr && addr.city) {
            const parts = [addr.city];
            if (addr.stateOrCountry) parts.push(addr.stateOrCountry);
            if (addr.zipCode) parts.push(addr.zipCode);
            patch.location = parts.join(', ');
            enrichedLocation++;
          }
        }

        // Extract website if missing
        if (!rec.website && secData.website) {
          let website = secData.website;
          if (!website.startsWith('http')) website = 'https://' + website;
          patch.website = website;
          enrichedWebsite++;
        }

        if (Object.keys(patch).length > 0) {
          await supabasePatch('funding_opportunities', rec.id, patch);
        }

        // Rate limiting: 5 requests/sec to stay well under SEC's 10/sec limit
        if (totalProcessed % 5 === 0) await sleep(1000);

        // Progress log every 100
        if (totalProcessed % 100 === 0) {
          console.log(`    Progress: ${totalProcessed} lookups | +${enrichedLocation} locations | +${enrichedWebsite} websites | ${errors} errors`);
        }
      } catch (err) {
        errors++;
        if (errors > 50) {
          console.error('  !! Too many errors, stopping early');
          break;
        }
        // Rate limit errors — back off
        if (err.message.includes('429') || err.message.includes('403')) {
          console.warn('  Rate limited, backing off 30s...');
          await sleep(30000);
        }
      }
    }

    offset += batchSize;
    if (records.length < batchSize) break;
  }

  console.log(`\n  ✓ Pass 2 complete:`);
  console.log(`    Total CIK lookups: ${totalProcessed}`);
  console.log(`    Locations enriched: ${enrichedLocation}`);
  console.log(`    Websites enriched: ${enrichedWebsite}`);
  console.log(`    Errors: ${errors}\n`);

  return { totalProcessed, enrichedLocation, enrichedWebsite, errors };
}

// --- Pass 3: Recalculate completeness scores for updated records ---

async function pass3RecalcScores() {
  console.log('=== PASS 3: Recalculate completeness scores ===\n');

  // Use RPC or direct SQL via Supabase — we'll just re-run the scoring update
  // through a batch approach since we can't run raw SQL via REST easily

  let offset = 0;
  const batchSize = 1000;
  let updated = 0;

  while (true) {
    // Fetch records that might have stale scores (have location or website but low score)
    const records = await supabaseGet(
      `funding_opportunities?select=id,name,organization,description,website,check_size_min,check_size_max,location,sectors,stage,embedding,completeness_score&or=(location.not.is.null,website.not.is.null)&completeness_score=lt.40&limit=${batchSize}&offset=${offset}`
    );

    if (records.length === 0) break;
    console.log(`  Recalculating batch of ${records.length} records (offset ${offset})`);

    for (const rec of records) {
      const score = calcScore(rec);
      if (score !== rec.completeness_score) {
        await supabasePatch('funding_opportunities', rec.id, { completeness_score: score });
        updated++;
      }
    }

    offset += batchSize;
    if (records.length < batchSize) break;
  }

  console.log(`  ✓ Pass 3 complete: ${updated} scores recalculated\n`);
  return updated;
}

function calcScore(rec) {
  let score = 0;
  if (rec.name && rec.name.length > 2) score += 15;
  if (rec.organization && rec.organization.length > 0) score += 10;
  if (rec.description && rec.description.length >= 50) score += 20;
  else if (rec.description && rec.description.length >= 20) score += 10;
  if (rec.website && rec.website.startsWith('http')) score += 15;
  if (rec.check_size_min || rec.check_size_max) score += 15;
  if (rec.location && rec.location.length > 2) score += 10;
  if (rec.sectors && rec.sectors.length > 0) score += 5;
  if (rec.stage && rec.stage.length > 0) score += 5;
  if (rec.embedding) score += 5;
  return score;
}

// --- Main ---

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  SEC EDGAR Enrichment Pipeline — $0 cost            ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  const t0 = Date.now();

  const pass1Count = await pass1ParseLocations();
  const pass2Results = await pass2SecEdgar();
  const pass3Count = await pass3RecalcScores();

  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  SUMMARY                                           ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Pass 1 — Parsed locations:     ${String(pass1Count).padStart(6)}             ║`);
  console.log(`║  Pass 2 — SEC locations:         ${String(pass2Results.enrichedLocation).padStart(5)}             ║`);
  console.log(`║  Pass 2 — SEC websites:          ${String(pass2Results.enrichedWebsite).padStart(5)}             ║`);
  console.log(`║  Pass 2 — CIK lookups:           ${String(pass2Results.totalProcessed).padStart(5)}             ║`);
  console.log(`║  Pass 3 — Scores recalculated:  ${String(pass3Count).padStart(6)}             ║`);
  console.log(`║  Elapsed: ${elapsed}s                                  ║`);
  console.log(`║  Cost: $0.00                                       ║`);
  console.log('╚══════════════════════════════════════════════════════╝');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
