#!/usr/bin/env node
/**
 * SEC Form ADV Bulk Enrichment
 *
 * Parses the SEC's IA Firm Roster CSV (already downloaded) and enriches
 * existing investor records with:
 *   - Website URL
 *   - AUM (Total Gross Assets of Private Funds)
 *   - VC fund indicator (Any VC Funds = Y)
 *   - Active/inactive status
 *   - Location data
 *   - Fund type classification
 *
 * Data source: https://www.sec.gov/data-research/sec-markets-data/information-about-registered-investment-advisers-exempt-reporting-advisers
 *
 * Usage:
 *   node scripts/harvest-form-adv.mjs --dry-run
 *   node scripts/harvest-form-adv.mjs
 */

import { config } from 'dotenv';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';

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
const DATA_DIR = resolve(__dirname, '..', 'data', 'form-adv');
const CSV_PATH = join(DATA_DIR, 'ia030226', 'IA_SEC_-_FIRM_ROSTER_FOIA_DOWNLOAD_-_34553767.CSV');

function normalize(name) {
  return (name || '').toLowerCase()
    .replace(/[,.'"\-()]/g, '')
    .replace(/\b(llc|lp|inc|corp|ltd|co|group)\b/g, '')
    .replace(/\s+/g, ' ').trim();
}

// Parse CSV with quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content) {
  const lines = content.split('\n');
  const cols = parseCSVLine(lines[0].replace(/\r$/, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '');
    if (!line.trim()) continue;
    const values = parseCSVLine(line);
    const row = {};
    for (let j = 0; j < cols.length; j++) row[cols[j]] = values[j] || '';
    rows.push(row);
  }
  return { cols, rows };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  SEC Form ADV Enrichment Pipeline                          ║');
  console.log(`║  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}                                                    ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Step 1: Parse CSV
  console.log('Step 1: Parsing Form ADV CSV...\n');
  const content = readFileSync(CSV_PATH, 'utf-8');
  const { cols, rows } = parseCSV(content);

  console.log(`  Columns: ${cols.length}`);
  console.log(`  Records: ${rows.length.toLocaleString()}\n`);

  // Step 2: Build index
  console.log('Step 2: Indexing advisers...\n');

  const advMap = new Map(); // normName → adv record
  const altMap = new Map(); // normLegalName → adv record

  let vcFirms = 0, peFirms = 0, hedgeFirms = 0, reFirms = 0;
  let withWebsite = 0, withAUM = 0, activeFirms = 0;

  for (const row of rows) {
    const name = row['Primary Business Name'] || '';
    const legalName = row['Legal Name'] || '';
    if (!name && !legalName) continue;

    const website = row['Website Address'] || '';
    const city = row['Main Office City'] || '';
    const state = row['Main Office State'] || '';
    const country = row['Main Office Country'] || '';
    const status = row['SEC Current Status'] || '';
    const statusDate = row['SEC Status Effective Date'] || '';
    const lastFiling = row['Latest ADV Filing Date'] || '';

    const hasVCFunds = row['Any VC Funds'] === 'Y';
    const hasPEFunds = row['Any PE Funds'] === 'Y';
    const hasHedgeFunds = row['Any Hedge Funds'] === 'Y';
    const hasREFunds = row['Any Real Estate Funds'] === 'Y';
    const vcFundCount = parseInt(row['Total number of VC funds'] || '0') || 0;
    const peFundCount = parseInt(row['Total number of PE funds'] || '0') || 0;

    const grossAssetsRaw = row['Total Gross Assets of Private Funds'] || '';
    const grossAssets = parseFloat(grossAssetsRaw.replace(/[,$\s]/g, '')) || 0;
    const totalEmployees = parseInt(row['5A'] || '0') || 0;

    const crd = row['Organization CRD#'] || '';
    const cik = row['CIK#'] || '';

    if (hasVCFunds) vcFirms++;
    if (hasPEFunds) peFirms++;
    if (hasHedgeFunds) hedgeFirms++;
    if (hasREFunds) reFirms++;
    if (website) withWebsite++;
    if (grossAssets > 0) withAUM++;
    if (status === 'Approved') activeFirms++;

    const record = {
      name, legalName, website, city, state, country,
      status, statusDate, lastFiling,
      hasVCFunds, hasPEFunds, hasHedgeFunds, hasREFunds,
      vcFundCount, peFundCount, grossAssets,
      crd, cik,
    };

    if (name) advMap.set(normalize(name), record);
    if (legalName && legalName !== name) altMap.set(normalize(legalName), record);
  }

  console.log(`  Indexed: ${advMap.size.toLocaleString()} by primary name + ${altMap.size.toLocaleString()} by legal name`);
  console.log(`  Active (SEC Approved): ${activeFirms.toLocaleString()}`);
  console.log(`  With VC funds: ${vcFirms.toLocaleString()}`);
  console.log(`  With PE funds: ${peFirms.toLocaleString()}`);
  console.log(`  With hedge funds: ${hedgeFirms.toLocaleString()}`);
  console.log(`  With RE funds: ${reFirms.toLocaleString()}`);
  console.log(`  With AUM data: ${withAUM.toLocaleString()}`);
  console.log(`  With website: ${withWebsite.toLocaleString()}\n`);

  // Step 3: Load our investors and match
  console.log('Step 3: Matching against investor database...\n');

  let dbOffset = 0;
  const updates = [];
  let matched = 0;
  let totalInvestors = 0;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?select=id,canonical_name,website,hq_city,hq_state,hq_country,description,investor_type&limit=1000&offset=${dbOffset}`,
      { headers }
    );
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    totalInvestors += batch.length;

    for (const inv of batch) {
      const normName = normalize(inv.canonical_name);
      const adv = advMap.get(normName) || altMap.get(normName);
      if (!adv) continue;

      matched++;

      const patch = {};

      // Website
      if (!inv.website && adv.website) {
        const url = adv.website.toLowerCase().startsWith('http') ? adv.website : `https://${adv.website}`;
        patch.website = url;
      }

      // Location
      if (!inv.hq_city && adv.city) patch.hq_city = adv.city;
      if (!inv.hq_state && adv.state) patch.hq_state = adv.state;
      if (!inv.hq_country && adv.country) patch.hq_country = adv.country;

      // Investor type refinement from ADV data
      if (adv.hasVCFunds && inv.investor_type !== 'vc' && inv.investor_type !== 'angel') {
        patch.investor_type = 'vc';
      }

      // Build enrichment text for description
      const enrichParts = [];
      if (adv.grossAssets > 0) {
        const aumStr = adv.grossAssets >= 1e9
          ? `$${(adv.grossAssets / 1e9).toFixed(1)}B`
          : `$${(adv.grossAssets / 1e6).toFixed(0)}M`;
        enrichParts.push(`AUM: ${aumStr}`);
      }
      if (adv.vcFundCount > 0) enrichParts.push(`${adv.vcFundCount} VC fund(s)`);
      if (adv.peFundCount > 0) enrichParts.push(`${adv.peFundCount} PE fund(s)`);
      if (adv.status) enrichParts.push(`SEC status: ${adv.status}`);
      if (adv.lastFiling) enrichParts.push(`Last filing: ${adv.lastFiling}`);
      if (adv.crd) enrichParts.push(`CRD#: ${adv.crd}`);

      // Append to description if we have new info
      if (enrichParts.length > 0) {
        const enrichText = `[Form ADV] ${enrichParts.join('. ')}.`;
        const currentDesc = inv.description || '';
        if (!currentDesc.includes('[Form ADV]')) {
          patch.description = currentDesc ? `${currentDesc} ${enrichText}` : enrichText;
        }
      }

      // Boost completeness
      if (Object.keys(patch).length > 0) {
        updates.push({ id: inv.id, patch });
      }
    }

    dbOffset += 1000;
    if (dbOffset % 20000 === 0) {
      console.log(`  Scanned: ${totalInvestors.toLocaleString()} | Matched: ${matched.toLocaleString()}`);
    }
  }

  console.log(`  Total investors scanned: ${totalInvestors.toLocaleString()}`);
  console.log(`  Name matches: ${matched.toLocaleString()}`);
  console.log(`  Records to update: ${updates.length.toLocaleString()}\n`);

  if (DRY_RUN) {
    console.log('[DRY RUN] No changes applied.');
    const samplePath = join(DATA_DIR, 'adv-enrichment-sample.json');
    writeFileSync(samplePath, JSON.stringify(updates.slice(0, 30), null, 2));
    console.log(`  Sample saved to ${samplePath}`);
    return;
  }

  // Step 4: Apply updates
  console.log('Step 4: Applying enrichments...');
  let applied = 0;
  let errors = 0;

  for (let i = 0; i < updates.length; i++) {
    const { id, patch } = updates[i];

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?id=eq.${id}`,
      { method: 'PATCH', headers, body: JSON.stringify(patch) }
    );

    if (res.ok) applied++;
    else errors++;

    if ((i + 1) % 1000 === 0) console.log(`  Progress: ${i + 1}/${updates.length}`);
  }

  console.log(`\n  Applied: ${applied.toLocaleString()}`);
  console.log(`  Errors: ${errors.toLocaleString()}`);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  FORM ADV ENRICHMENT SUMMARY                               ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  ADV records parsed:   ${String(rows.length).padStart(8)}                             ║`);
  console.log(`║  Name matches:         ${String(matched).padStart(8)}                             ║`);
  console.log(`║  Records enriched:     ${String(applied).padStart(8)}                             ║`);
  console.log(`║  VC firms identified:  ${String(vcFirms).padStart(8)}                             ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
