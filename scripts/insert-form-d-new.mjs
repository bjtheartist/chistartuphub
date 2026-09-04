#!/usr/bin/env node
/**
 * Re-run Form D inserts with fixed investor_type and check_size_min.
 * Uses cached parsed data — no re-download needed.
 */

import { config } from 'dotenv';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import { execFileSync } from 'child_process';

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

const DATA_DIR = resolve(__dirname, '..', 'data', 'form-d');

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
const MIDWEST_STATES = new Set(['Illinois','Indiana','Iowa','Kansas','Michigan','Minnesota','Missouri','Nebraska','North Dakota','Ohio','South Dakota','Wisconsin']);

function normalize(name) {
  return (name || '').toLowerCase().replace(/[,.'"\-()]/g, '').replace(/\b(llc|lp|inc|corp|ltd|co|group|fund|i{1,4}|iv|v)\b/g, '').replace(/\s+/g, ' ').trim();
}

function parseTSV(content) {
  const lines = content.split('\n');
  if (lines.length < 2) return [];
  const cols = lines[0].replace(/\r$/, '').split('\t');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '');
    if (!line.trim()) continue;
    const values = line.split('\t');
    const row = {};
    for (let j = 0; j < cols.length; j++) row[cols[j]] = (values[j] || '').trim();
    rows.push(row);
  }
  return rows;
}

function mapStage(totalOffering) {
  const amt = parseFloat(totalOffering) || 0;
  if (amt <= 0) return null;
  if (amt < 1_000_000) return 'pre_seed';
  if (amt < 5_000_000) return 'seed';
  if (amt < 25_000_000) return 'early';
  if (amt < 100_000_000) return 'growth';
  return 'late';
}

async function main() {
  console.log('Re-running Form D inserts with fixed types...\n');

  // Re-parse all quarters
  const { readdirSync, statSync } = await import('fs');
  const quarters = readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.zip'))
    .sort();

  const allFirms = new Map();

  for (const zipFile of quarters) {
    const extractDir = join(DATA_DIR, zipFile.replace('.zip', ''));
    if (!existsSync(extractDir)) continue;

    // Find nested data dir
    let dataDir = extractDir;
    const entries = readdirSync(extractDir);
    for (const entry of entries) {
      if (statSync(join(extractDir, entry)).isDirectory()) {
        dataDir = join(extractDir, entry);
        break;
      }
    }

    const issuersPath = join(dataDir, 'ISSUERS.tsv');
    const offeringPath = join(dataDir, 'OFFERING.tsv');
    const submissionPath = join(dataDir, 'FORMDSUBMISSION.tsv');
    const personsPath = join(dataDir, 'RELATEDPERSONS.tsv');

    if (!existsSync(issuersPath)) continue;

    const issuers = parseTSV(readFileSync(issuersPath, 'utf-8'));
    const offerings = parseTSV(existsSync(offeringPath) ? readFileSync(offeringPath, 'utf-8') : '');
    const submissions = parseTSV(existsSync(submissionPath) ? readFileSync(submissionPath, 'utf-8') : '');
    const persons = parseTSV(existsSync(personsPath) ? readFileSync(personsPath, 'utf-8') : '');

    const offeringMap = new Map(offerings.map(o => [o.ACCESSIONNUMBER, o]));
    const submissionMap = new Map(submissions.map(s => [s.ACCESSIONNUMBER, s]));
    const personsMap = new Map();
    for (const p of persons) {
      if (!personsMap.has(p.ACCESSIONNUMBER)) personsMap.set(p.ACCESSIONNUMBER, []);
      personsMap.get(p.ACCESSIONNUMBER).push(p);
    }

    for (const issuer of issuers) {
      const name = (issuer.ENTITYNAME || '').trim();
      if (!name || name.length < 2) continue;

      const offering = offeringMap.get(issuer.ACCESSIONNUMBER) || {};
      const isPooledFund = offering.ISPOOLEDINVESTMENTFUNDTYPE === 'true' || offering.ISPOOLEDINVESTMENTFUNDTYPE === 'Y';
      const fundType = offering.INVESTMENTFUNDTYPE || '';
      const nameLC = name.toLowerCase();
      const isFundLike = isPooledFund ||
        /venture|capital|fund|partner|invest|equity|angel|seed|growth/.test(nameLC) ||
        /Venture Capital Fund|Private Equity Fund|Other Investment Fund/.test(fundType);
      if (!isFundLike) continue;
      if (/\b(etf|index|mutual|insurance|bank trust|401k|pension|annuity|money market)\b/i.test(name)) continue;

      const normName = normalize(name);
      if (allFirms.has(normName)) continue; // keep first seen

      const stateCode = (issuer.STATEORCOUNTRY || '').toUpperCase();
      const stateName = STATE_MAP[stateCode] || issuer.STATEORCOUNTRYDESCRIPTION || null;
      const city = issuer.CITY || null;
      const isMidwest = !!(stateName && MIDWEST_STATES.has(stateName)) || (city && city.toLowerCase() === 'chicago');

      const totalOffering = offering.TOTALOFFERINGAMOUNT || '0';
      const totalSold = parseFloat(offering.TOTALAMOUNTSOLD) || 0;
      const minInv = parseFloat(offering.MINIMUMINVESTMENTACCEPTED) || 0;

      const descParts = [];
      if (fundType) descParts.push(`Fund type: ${fundType}`);
      if (totalSold > 0) descParts.push(`Total raised: $${totalSold.toLocaleString()}`);

      const pList = (personsMap.get(issuer.ACCESSIONNUMBER) || [])
        .slice(0, 5).map(p => `${p.FIRSTNAME || ''} ${p.LASTNAME || ''}`.trim()).filter(Boolean);
      if (pList.length > 0) descParts.push(`Key people: ${pList.join(', ')}`);

      let score = 10;
      if (city) score += 15;
      if (stateName) score += 10;
      if (descParts.length > 0) score += 15;
      if (totalSold > 0) score += 10;
      if (pList.length > 0) score += 10;

      allFirms.set(normName, {
        canonical_name: name,
        hq_city: city,
        hq_state: stateName,
        hq_country: stateCode && STATE_MAP[stateCode] ? 'United States' : (issuer.STATEORCOUNTRYDESCRIPTION || null),
        hq_location: [city, stateName || stateCode].filter(Boolean).join(', ') || null,
        is_midwest: isMidwest,
        investor_type: 'vc', // safe default — cleanup script will reclassify
        stage_focus: mapStage(totalOffering !== 'Indefinite' ? totalOffering : String(totalSold)),
        sectors: null,
        check_size_min: minInv > 0 && minInv <= 2147483647 ? Math.floor(minInv) : null,
        description: descParts.length > 0 ? descParts.join('. ') + '.' : null,
        source: 'sec_form_d',
        completeness_score: Math.min(score, 100),
        mvip_score: 0,
        domain: null,
      });
    }

    process.stdout.write('.');
  }
  console.log(`\n\nParsed ${allFirms.size.toLocaleString()} unique firms`);

  // Load existing for dedup
  console.log('Loading existing investors...');
  const existingNames = new Set();
  let offset = 0;
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/investors?select=canonical_name&limit=1000&offset=${offset}`, { headers });
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    batch.forEach(r => existingNames.add(normalize(r.canonical_name)));
    offset += 1000;
  }
  console.log(`  Existing: ${existingNames.size.toLocaleString()}`);

  // Filter to new only
  const toInsert = [];
  for (const [normName, record] of allFirms) {
    if (!existingNames.has(normName)) toInsert.push(record);
  }
  console.log(`  New to insert: ${toInsert.length.toLocaleString()}\n`);

  // Insert in batches
  let inserted = 0, errors = 0;
  for (let i = 0; i < toInsert.length; i += 500) {
    const batch = toInsert.slice(i, i + 500);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/investors`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal,resolution=ignore-duplicates' },
      body: JSON.stringify(batch),
    });
    if (res.ok) {
      inserted += batch.length;
    } else {
      const err = await res.text();
      console.error(`  Error at ${i}: ${err.slice(0, 150)}`);
      errors++;
    }
    if ((i + 500) % 10000 === 0) console.log(`  Progress: ${Math.min(i+500, toInsert.length)}/${toInsert.length} | ${inserted} inserted`);
  }

  console.log(`\nInserted: ${inserted.toLocaleString()}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total DB: ~${(existingNames.size + inserted).toLocaleString()}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
