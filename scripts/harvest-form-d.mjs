#!/usr/bin/env node
/**
 * SEC Form D Bulk Harvester
 *
 * Downloads quarterly Form D datasets from SEC EDGAR (last 3 years),
 * extracts firm-level investor data, enriches existing records in the
 * investors table, and inserts new firms.
 *
 * Data source: https://www.sec.gov/data-research/sec-markets-data/form-d-data-sets
 * Format: ZIP files containing 6 tab-delimited TXT files per quarter
 *
 * Usage:
 *   node scripts/harvest-form-d.mjs              # full run
 *   node scripts/harvest-form-d.mjs --dry-run    # download + parse only, no DB writes
 *   node scripts/harvest-form-d.mjs --skip-download  # use cached ZIPs
 */

import { config } from 'dotenv';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
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

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_DOWNLOAD = process.argv.includes('--skip-download');
const DATA_DIR = resolve(__dirname, '..', 'data', 'form-d');
const UA = 'ChiStartupHub/1.0 research@chistartuphub.com';

// --- Quarters to download (last 3 years) ---
function getQuarters() {
  const quarters = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQ = Math.ceil((now.getMonth() + 1) / 3);

  for (let year = currentYear - 3; year <= currentYear; year++) {
    for (let q = 1; q <= 4; q++) {
      if (year === currentYear && q > currentQ) break;
      quarters.push({ year, quarter: q });
    }
  }
  return quarters;
}

// --- US State map ---
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

const MIDWEST_STATES = new Set([
  'Illinois','Indiana','Iowa','Kansas','Michigan','Minnesota',
  'Missouri','Nebraska','North Dakota','Ohio','South Dakota','Wisconsin',
]);

// --- Helpers ---
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function normalize(name) {
  return (name || '').toLowerCase()
    .replace(/[,.'"\-()]/g, '')
    .replace(/\b(llc|lp|inc|corp|ltd|co|group|fund|i{1,4}|iv|v)\b/g, '')
    .replace(/\s+/g, ' ').trim();
}

function parseTSV(content) {
  const lines = content.split('\n');
  if (lines.length < 2) return [];
  const headerLine = lines[0].replace(/\r$/, '');
  const cols = headerLine.split('\t');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '');
    if (!line.trim()) continue;
    const values = line.split('\t');
    const row = {};
    for (let j = 0; j < cols.length; j++) {
      row[cols[j]] = (values[j] || '').trim();
    }
    rows.push(row);
  }
  return rows;
}

function determineInvestorType(entityName, industryGroup, investmentFundType, exemptions) {
  const lower = (entityName || '').toLowerCase();
  const fundType = (investmentFundType || '').toLowerCase();

  // DB check constraint only allows: vc, angel, cvc, family_office, pe
  // Map hedge_fund and others to valid types
  if (/angel/.test(lower)) return 'angel';
  if (/family office/.test(lower) || /family office/.test(fundType)) return 'family_office';
  if (/venture|vc\b|seed/.test(lower) || /venture capital/.test(fundType)) return 'vc';
  if (/private equity|buyout|acquisition|mezzanine/.test(lower) || /private equity/.test(fundType)) return 'pe';
  if (/growth/.test(lower)) return 'vc';
  if (/hedge/.test(fundType)) return 'vc'; // map hedge → vc (will be reclassified by cleanup)
  if (/corporate venture|cvc/.test(lower)) return 'cvc';
  if ((exemptions || '').includes('06')) return 'vc';
  return 'vc';
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

// --- Download a single quarter ZIP ---
async function downloadQuarter(year, quarter) {
  const filename = `${year}q${quarter}_d.zip`;
  const filepath = join(DATA_DIR, filename);

  if (existsSync(filepath) && SKIP_DOWNLOAD) {
    console.log(`  [cached] ${filename}`);
    return filepath;
  }

  const url = `https://www.sec.gov/files/structureddata/data/form-d-data-sets/${filename}`;
  console.log(`  Downloading ${filename}...`);

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': '*/*' },
    });

    if (!resp.ok) {
      if (resp.status === 404) {
        console.log(`  [not found] ${filename} — quarter not yet available`);
        return null;
      }
      console.error(`  HTTP ${resp.status} for ${filename}`);
      return null;
    }

    const buffer = Buffer.from(await resp.arrayBuffer());
    writeFileSync(filepath, buffer);
    console.log(`  [saved] ${filename} (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);

    await sleep(200);
    return filepath;
  } catch (err) {
    console.error(`  Error downloading ${filename}: ${err.message}`);
    return null;
  }
}

// --- Extract ZIP and parse TSV files ---
async function extractAndParse(zipPath) {
  const extractDir = zipPath.replace('.zip', '');

  if (!existsSync(extractDir)) {
    mkdirSync(extractDir, { recursive: true });
  }

  try {
    execFileSync('unzip', ['-o', zipPath, '-d', extractDir], { stdio: 'pipe' });
  } catch (err) {
    console.error(`  Error extracting ${zipPath}: ${err.message}`);
    return null;
  }

  // ZIPs extract into a nested subdirectory (e.g. 2025Q4_d/ inside the extract dir)
  // Find the actual directory containing the TSV files
  let dataDir = extractDir;
  const { readdirSync, statSync } = await import('fs');
  const entries = readdirSync(extractDir);
  for (const entry of entries) {
    const entryPath = join(extractDir, entry);
    if (statSync(entryPath).isDirectory()) {
      dataDir = entryPath;
      break;
    }
  }

  const files = {};
  const fileNames = ['FORMDSUBMISSION', 'ISSUERS', 'OFFERING', 'RELATEDPERSONS', 'RECIPIENTS', 'SIGNATURES'];

  for (const name of fileNames) {
    const filePath = join(dataDir, `${name}.tsv`);
    const altPath = join(dataDir, `${name}.txt`);
    const actualPath = existsSync(filePath) ? filePath : existsSync(altPath) ? altPath : null;

    if (actualPath) {
      const content = readFileSync(actualPath, 'utf-8');
      files[name] = parseTSV(content);
    } else {
      files[name] = [];
    }
  }

  return files;
}

// --- Build firm-level records from parsed data ---
function buildFirmRecords(files) {
  const { ISSUERS = [], OFFERING = [], FORMDSUBMISSION = [], RELATEDPERSONS = [] } = files;

  const offeringMap = new Map();
  for (const o of OFFERING) offeringMap.set(o.ACCESSIONNUMBER, o);

  const submissionMap = new Map();
  for (const s of FORMDSUBMISSION) submissionMap.set(s.ACCESSIONNUMBER, s);

  const personsMap = new Map();
  for (const p of RELATEDPERSONS) {
    if (!personsMap.has(p.ACCESSIONNUMBER)) personsMap.set(p.ACCESSIONNUMBER, []);
    personsMap.get(p.ACCESSIONNUMBER).push(p);
  }

  const firms = new Map();

  for (const issuer of ISSUERS) {
    const name = (issuer.ENTITYNAME || '').trim();
    if (!name || name.length < 2) continue;

    const accession = issuer.ACCESSIONNUMBER;
    const offering = offeringMap.get(accession) || {};
    const submission = submissionMap.get(accession) || {};
    const persons = personsMap.get(accession) || [];

    const isPooledFund = offering.ISPOOLEDINVESTMENTFUNDTYPE === 'true' || offering.ISPOOLEDINVESTMENTFUNDTYPE === 'Y';
    const industryGroup = offering.INDUSTRYGROUPTYPE || '';
    const isInvestmentFund = industryGroup.toLowerCase().includes('pooled') ||
                             industryGroup.toLowerCase().includes('investment') ||
                             industryGroup.toLowerCase().includes('fund');
    const exemptions = offering.FEDERALEXEMPTIONS_ITEMS_LIST || '';
    const fundType = offering.INVESTMENTFUNDTYPE || '';

    const nameLC = name.toLowerCase();
    const isFundLike = isPooledFund || isInvestmentFund ||
      /venture|capital|fund|partner|invest|equity|angel|seed|growth/.test(nameLC) ||
      /Venture Capital Fund|Private Equity Fund|Other Investment Fund/.test(fundType);

    if (!isFundLike) continue;
    if (/\b(etf|index|mutual|insurance|bank trust|401k|pension|annuity|money market)\b/i.test(name)) continue;

    const normName = normalize(name);
    const existing = firms.get(normName);

    let filingDate = null;
    const fd = submission.FILING_DATE;
    if (fd) { try { filingDate = new Date(fd); } catch {} }

    if (existing && existing._filingDate && filingDate && filingDate < existing._filingDate) continue;

    const stateCode = (issuer.STATEORCOUNTRY || '').toUpperCase();
    const stateName = STATE_MAP[stateCode] || issuer.STATEORCOUNTRYDESCRIPTION || null;
    const city = issuer.CITY || null;
    const isMidwest = !!(stateName && MIDWEST_STATES.has(stateName)) ||
                      (city && city.toLowerCase() === 'chicago');

    const totalOffering = offering.TOTALOFFERINGAMOUNT || '0';
    const totalSold = parseFloat(offering.TOTALAMOUNTSOLD) || 0;

    const descParts = [];
    if (fundType) descParts.push(`Fund type: ${fundType}`);
    if (industryGroup && industryGroup !== 'Pooled Investment Fund') descParts.push(`Industry: ${industryGroup}`);
    if (totalSold > 0) descParts.push(`Total raised: $${totalSold.toLocaleString()}`);
    if (exemptions) descParts.push(`SEC exemptions: ${exemptions}`);

    const keyPeople = persons
      .filter(p => p.RELATIONSHIP_1 || p.RELATIONSHIP_2)
      .slice(0, 5)
      .map(p => `${p.FIRSTNAME || ''} ${p.LASTNAME || ''}`.trim())
      .filter(Boolean);

    if (keyPeople.length > 0) descParts.push(`Key people: ${keyPeople.join(', ')}`);

    const record = {
      canonical_name: name,
      hq_city: city,
      hq_state: stateName,
      hq_country: stateCode && STATE_MAP[stateCode] ? 'United States' : (issuer.STATEORCOUNTRYDESCRIPTION || null),
      hq_location: [city, stateName || stateCode].filter(Boolean).join(', ') || null,
      is_midwest: isMidwest,
      investor_type: determineInvestorType(name, industryGroup, fundType, exemptions),
      stage_focus: mapStage(totalOffering !== 'Indefinite' ? totalOffering : String(totalSold)),
      sectors: null,
      check_size_min: offering.MINIMUMINVESTMENTACCEPTED ? Math.min(parseFloat(offering.MINIMUMINVESTMENTACCEPTED) || 0, 2147483647) || null : null,
      description: descParts.length > 0 ? descParts.join('. ') + '.' : null,
      source: 'sec_form_d',
      completeness_score: 0,
      _normName: normName,
      _filingDate: filingDate,
      _totalSold: totalSold,
    };

    let score = 10;
    if (record.hq_city) score += 15;
    if (record.hq_state) score += 10;
    if (record.description) score += 15;
    if (record.stage_focus) score += 10;
    if (record.check_size_min) score += 10;
    if (totalSold > 0) score += 10;
    if (keyPeople.length > 0) score += 10;
    record.completeness_score = Math.min(score, 100);

    firms.set(normName, record);
  }

  return firms;
}

// --- Main ---
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  SEC Form D Bulk Harvester                                 ║');
  console.log(`║  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}${SKIP_DOWNLOAD ? ' (cached)' : ''}                                            ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  mkdirSync(DATA_DIR, { recursive: true });

  // Step 1: Download quarterly ZIPs
  const quarters = getQuarters();
  console.log(`Step 1: Downloading ${quarters.length} quarterly datasets...\n`);

  const downloadedFiles = [];
  for (const { year, quarter } of quarters) {
    const path = await downloadQuarter(year, quarter);
    if (path) downloadedFiles.push({ path, year, quarter });
  }
  console.log(`\n  Downloaded: ${downloadedFiles.length} files\n`);

  // Step 2: Extract and parse all quarters
  console.log('Step 2: Extracting and parsing...\n');

  const allFirms = new Map();
  let totalIssuers = 0;
  let totalFilings = 0;

  for (const { path, year, quarter } of downloadedFiles) {
    process.stdout.write(`  ${year}Q${quarter}: `);
    const files = await extractAndParse(path);
    if (!files) { console.log('failed'); continue; }

    totalFilings += (files.FORMDSUBMISSION || []).length;
    totalIssuers += (files.ISSUERS || []).length;

    const firms = buildFirmRecords(files);
    console.log(`${(files.ISSUERS || []).length} issuers → ${firms.size} fund-like firms`);

    for (const [normName, record] of firms) {
      const existing = allFirms.get(normName);
      if (!existing || record.completeness_score > existing.completeness_score ||
          (record._filingDate && existing._filingDate && record._filingDate > existing._filingDate)) {
        allFirms.set(normName, record);
      }
    }
  }

  console.log(`\n  Total filings parsed: ${totalFilings.toLocaleString()}`);
  console.log(`  Total issuers: ${totalIssuers.toLocaleString()}`);
  console.log(`  Unique fund-like firms: ${allFirms.size.toLocaleString()}\n`);

  // Step 3: Load existing investors for dedup
  console.log('Step 3: Loading existing investors for dedup...');

  const existingNames = new Map();
  let dbOffset = 0;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?select=id,canonical_name&limit=1000&offset=${dbOffset}`,
      { headers }
    );
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    batch.forEach(r => existingNames.set(normalize(r.canonical_name), r.id));
    dbOffset += 1000;
  }
  console.log(`  Existing investors: ${existingNames.size.toLocaleString()}\n`);

  // Step 4: Split into enrichment vs insert
  console.log('Step 4: Processing firms...\n');

  const toEnrich = [];
  const toInsert = [];
  let skipped = 0;

  for (const [normName, record] of allFirms) {
    const existingId = existingNames.get(normName);
    const { _normName, _filingDate, _totalSold, ...cleanRecord } = record;

    if (existingId) {
      const updates = {};
      if (cleanRecord.hq_city) updates.hq_city = cleanRecord.hq_city;
      if (cleanRecord.hq_state) updates.hq_state = cleanRecord.hq_state;
      if (cleanRecord.hq_country) updates.hq_country = cleanRecord.hq_country;
      if (cleanRecord.hq_location) updates.hq_location = cleanRecord.hq_location;
      if (cleanRecord.stage_focus) updates.stage_focus = cleanRecord.stage_focus;
      if (cleanRecord.check_size_min) updates.check_size_min = cleanRecord.check_size_min;

      if (Object.keys(updates).length > 0) {
        toEnrich.push({ id: existingId, updates });
      } else {
        skipped++;
      }
    } else {
      cleanRecord.mvip_score = 0;
      cleanRecord.domain = null;
      toInsert.push(cleanRecord);
    }
  }

  console.log(`  To enrich (existing): ${toEnrich.length.toLocaleString()}`);
  console.log(`  To insert (new): ${toInsert.length.toLocaleString()}`);
  console.log(`  Skipped (no new data): ${skipped.toLocaleString()}\n`);

  if (DRY_RUN) {
    console.log('[DRY RUN] No database changes made.');
    const samplePath = join(DATA_DIR, 'sample-firms.json');
    const sample = [...allFirms.values()].slice(0, 50).map(({ _normName, _filingDate, _totalSold, ...r }) => r);
    writeFileSync(samplePath, JSON.stringify(sample, null, 2));
    console.log(`  Sample saved to ${samplePath}`);
    return;
  }

  // Step 5: Enrich existing investors (only update null fields)
  console.log('Step 5: Enriching existing investors...');
  let enriched = 0;
  let enrichErrors = 0;

  for (let i = 0; i < toEnrich.length; i++) {
    const { id, updates } = toEnrich[i];

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?id=eq.${id}&or=(hq_city.is.null,hq_state.is.null)`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      }
    );

    if (res.ok) enriched++;
    else enrichErrors++;

    if ((i + 1) % 2000 === 0) {
      console.log(`  Progress: ${i + 1}/${toEnrich.length} | ${enriched} enriched`);
    }
  }
  console.log(`  Enriched: ${enriched} | Errors: ${enrichErrors}\n`);

  // Step 6: Insert new investors in batches
  console.log('Step 6: Inserting new investors...');
  let inserted = 0;
  let insertErrors = 0;

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
      const errText = await res.text();
      console.error(`  Batch error at ${i}: ${res.status} ${errText.slice(0, 200)}`);
      insertErrors++;
    }

    if ((i + 500) % 5000 === 0) {
      console.log(`  Progress: ${Math.min(i + 500, toInsert.length)}/${toInsert.length} | ${inserted} inserted`);
    }
  }
  console.log(`  Inserted: ${inserted.toLocaleString()} | Errors: ${insertErrors}\n`);

  // Summary
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  FORM D HARVEST SUMMARY                                    ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Quarters processed:   ${String(downloadedFiles.length).padStart(8)}                             ║`);
  console.log(`║  Total filings:        ${String(totalFilings).padStart(8)}                             ║`);
  console.log(`║  Unique fund firms:    ${String(allFirms.size).padStart(8)}                             ║`);
  console.log(`║  Existing enriched:    ${String(enriched).padStart(8)}                             ║`);
  console.log(`║  New investors added:  ${String(inserted).padStart(8)}                             ║`);
  console.log(`║  Total investor DB:   ~${String(existingNames.size + inserted).padStart(7)}                             ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
