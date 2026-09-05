#!/usr/bin/env node
/**
 * Instance C — Free Source Enrichment Pipeline
 *
 * Cross-matches downloaded free datasets against the DB to backfill:
 * - Websites (from SEC Form ADV, Gigasheet, OpenVC)
 * - Check sizes (from OpenVC)
 * - Sectors (from Gigasheet, OpenVC)
 * - Location/Country (from SEC Form ADV, Gigasheet)
 *
 * All data is free — no API calls, $0 cost.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

const SB_URL = process.env.SUPABASE_URL || 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SB_KEY) {
  console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function log(phase, msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] [${phase}] ${msg}`);
}

// Simple CSV parser (handles quoted fields with commas)
function parseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j].trim().toLowerCase().replace(/\s+/g, '_')] = (values[j] || '').trim();
    }
    rows.push(obj);
  }
  return rows;
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// Normalize name for fuzzy matching
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(llc|lp|inc|corp|ltd|co|partners|capital|ventures|fund|management|advisors|advisory|group|investments|holdings)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Supabase REST helpers ────────────────────────────────────────────────────
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
    throw new Error(`Update failed: ${resp.status} ${err.slice(0, 200)}`);
  }
}

async function sbBatchUpdate(table, updates) {
  // updates: [{id, ...fields}]
  let success = 0, failed = 0;
  for (let i = 0; i < updates.length; i++) {
    const { id, ...fields } = updates[i];
    try {
      await sbUpdate(table, id, fields);
      success++;
    } catch {
      failed++;
    }
    // Light throttle — no API cost, just don't hammer the server
    if ((i + 1) % 100 === 0) {
      log('UPDATE', `  ${i + 1}/${updates.length} (${success} ok, ${failed} err)`);
      await sleep(100);
    }
  }
  return { success, failed };
}

// ─── Load & Index DB Records ──────────────────────────────────────────────────
async function loadDBRecords() {
  log('DB', 'Loading all funding_opportunities records...');
  const rows = await sbSelectAll('funding_opportunities', '',
    'id,name,organization,description,website,check_size_min,check_size_max,sectors,stage,location,country,region');

  log('DB', `Loaded ${rows.length} records`);

  // Build lookup indexes
  const byNormName = new Map();
  const byExactName = new Map();

  for (const r of rows) {
    const norm = normalizeName(r.name);
    if (norm) {
      if (!byNormName.has(norm)) byNormName.set(norm, []);
      byNormName.get(norm).push(r);
    }
    const exact = r.name?.toLowerCase().trim();
    if (exact) {
      if (!byExactName.has(exact)) byExactName.set(exact, []);
      byExactName.get(exact).push(r);
    }
  }

  return { rows, byNormName, byExactName };
}

// ─── Source 1: SEC Form ADV ───────────────────────────────────────────────────
async function enrichFromSECFormADV(db) {
  const filePath = path.join(DATA_DIR, 'sec-form-adv.csv');
  if (!fs.existsSync(filePath)) {
    // Try alternative names
    const alts = ['ia100.csv', 'ia-adviser-data.csv', 'sec-adv.csv', 'IA_ADV_Base_Recent.csv'];
    const found = alts.find(f => fs.existsSync(path.join(DATA_DIR, f)));
    if (!found) {
      log('SEC-ADV', 'No SEC Form ADV file found, skipping');
      return 0;
    }
    return enrichFromSECFormADVFile(path.join(DATA_DIR, found), db);
  }
  return enrichFromSECFormADVFile(filePath, db);
}

async function enrichFromSECFormADVFile(filePath, db) {
  log('SEC-ADV', `Loading ${path.basename(filePath)}...`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(raw);
  log('SEC-ADV', `Parsed ${rows.length} SEC adviser records`);

  // Show available columns
  if (rows.length > 0) {
    log('SEC-ADV', `Columns: ${Object.keys(rows[0]).join(', ')}`);
  }

  // Find relevant column names (they vary across SEC CSV versions)
  const sample = rows[0] || {};
  const nameCol = Object.keys(sample).find(k => /^(primary_business_name|business_name|firm_name|organization_name|legal_name|name)$/i.test(k));
  const websiteCol = Object.keys(sample).find(k => /^(website|website_url|web_address|firm_website|website_address|web_url)$/i.test(k));
  const cityCol = Object.keys(sample).find(k => /^(main_office_city|city|business_city)$/i.test(k));
  const stateCol = Object.keys(sample).find(k => /^(main_office_state|state|business_state)$/i.test(k));
  const countryCol = Object.keys(sample).find(k => /^(main_office_country|country|business_country)$/i.test(k));
  const cikCol = Object.keys(sample).find(k => /^(sec_file_number|cik|sec_number)$/i.test(k));

  log('SEC-ADV', `Mapped columns: name=${nameCol}, website=${websiteCol}, city=${cityCol}, state=${stateCol}, country=${countryCol}`);

  if (!nameCol) {
    log('SEC-ADV', 'Could not find name column, skipping');
    return 0;
  }

  // Build SEC lookup by normalized name
  const secByName = new Map();
  for (const r of rows) {
    const name = r[nameCol];
    if (!name) continue;
    const norm = normalizeName(name);
    if (norm) secByName.set(norm, r);
  }

  log('SEC-ADV', `Indexed ${secByName.size} unique SEC firms`);

  // Match against DB records
  const updates = [];

  for (const [norm, dbRecords] of db.byNormName) {
    const secRecord = secByName.get(norm);
    if (!secRecord) continue;

    for (const dbRec of dbRecords) {
      const upd = { id: dbRec.id };
      let changed = false;

      // Website
      if (!dbRec.website && websiteCol && secRecord[websiteCol]) {
        let url = secRecord[websiteCol].trim();
        if (url && !url.startsWith('http')) url = 'https://' + url;
        if (url && url.length > 5) {
          upd.website = url;
          changed = true;
        }
      }

      // Location
      if (!dbRec.location && cityCol && stateCol) {
        const city = secRecord[cityCol]?.trim();
        const state = secRecord[stateCol]?.trim();
        if (city && state) {
          upd.location = `${city}, ${state}`;
          changed = true;
        }
      }

      // Country
      if (!dbRec.country && countryCol) {
        const country = secRecord[countryCol]?.trim();
        if (country) {
          upd.country = country === 'US' || country === 'United States' ? 'United States' : country;
          changed = true;
        }
      }

      if (changed) updates.push(upd);
    }
  }

  log('SEC-ADV', `Matched ${updates.length} records for enrichment`);

  if (updates.length > 0) {
    const result = await sbBatchUpdate('funding_opportunities', updates);
    log('SEC-ADV', `✓ Updated ${result.success}, failed ${result.failed}`);
    return result.success;
  }
  return 0;
}

// ─── Source 2: Gigasheet VC/PE CSV ────────────────────────────────────────────
async function enrichFromGigasheet(db) {
  const filePath = path.join(DATA_DIR, 'gigasheet-vcpe.csv');
  if (!fs.existsSync(filePath)) {
    // Try alternatives
    const alts = ['vcpe.csv', 'vc-pe-businesses.csv', 'gigasheet.csv'];
    const found = alts.find(f => fs.existsSync(path.join(DATA_DIR, f)));
    if (!found) {
      log('GIGASHEET', 'No Gigasheet file found, skipping');
      return 0;
    }
    return enrichFromGigasheetFile(path.join(DATA_DIR, found), db);
  }
  return enrichFromGigasheetFile(filePath, db);
}

async function enrichFromGigasheetFile(filePath, db) {
  log('GIGASHEET', `Loading ${path.basename(filePath)}...`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(raw);
  log('GIGASHEET', `Parsed ${rows.length} records`);

  if (rows.length > 0) {
    log('GIGASHEET', `Columns: ${Object.keys(rows[0]).join(', ')}`);
  }

  const sample = rows[0] || {};
  const nameCol = Object.keys(sample).find(k => /^(company_name|name|organization|company)$/i.test(k));
  const websiteCol = Object.keys(sample).find(k => /^(website|domain|url|web)$/i.test(k));
  const countryCol = Object.keys(sample).find(k => /^(country|country_code|hq_country|location_country)$/i.test(k));
  const industryCol = Object.keys(sample).find(k => /^(industry|sector|category|type)$/i.test(k));
  const descCol = Object.keys(sample).find(k => /^(description|overview|about|summary)$/i.test(k));
  const foundedCol = Object.keys(sample).find(k => /^(founded|founded_year|year_founded|founding_year)$/i.test(k));

  log('GIGASHEET', `Mapped: name=${nameCol}, website=${websiteCol}, country=${countryCol}, industry=${industryCol}`);

  if (!nameCol) {
    log('GIGASHEET', 'Could not find name column, skipping');
    return 0;
  }

  // Build lookup
  const gsByName = new Map();
  for (const r of rows) {
    const name = r[nameCol];
    if (!name) continue;
    const norm = normalizeName(name);
    if (norm) gsByName.set(norm, r);
  }

  log('GIGASHEET', `Indexed ${gsByName.size} unique firms`);

  const updates = [];

  for (const [norm, dbRecords] of db.byNormName) {
    const gsRec = gsByName.get(norm);
    if (!gsRec) continue;

    for (const dbRec of dbRecords) {
      const upd = { id: dbRec.id };
      let changed = false;

      if (!dbRec.website && websiteCol && gsRec[websiteCol]) {
        let url = gsRec[websiteCol].trim();
        if (url && !url.startsWith('http')) url = 'https://' + url;
        if (url && url.length > 5) {
          upd.website = url;
          changed = true;
        }
      }

      if (!dbRec.country && countryCol && gsRec[countryCol]) {
        upd.country = gsRec[countryCol].trim();
        changed = true;
      }

      if ((!dbRec.description || dbRec.description.length < 50) && descCol && gsRec[descCol]?.length > 20) {
        upd.description = gsRec[descCol].trim().slice(0, 500);
        changed = true;
      }

      // Map industry to sectors
      if ((!dbRec.sectors || dbRec.sectors.length === 0) && industryCol && gsRec[industryCol]) {
        const sectors = mapIndustryToSectors(gsRec[industryCol]);
        if (sectors.length > 0) {
          upd.sectors = sectors;
          changed = true;
        }
      }

      if (changed) updates.push(upd);
    }
  }

  log('GIGASHEET', `Matched ${updates.length} records for enrichment`);

  if (updates.length > 0) {
    const result = await sbBatchUpdate('funding_opportunities', updates);
    log('GIGASHEET', `✓ Updated ${result.success}, failed ${result.failed}`);
    return result.success;
  }
  return 0;
}

function mapIndustryToSectors(industry) {
  if (!industry) return [];
  const text = industry.toLowerCase();
  const sectors = [];
  if (/financ|fintech|banking|payment/i.test(text)) sectors.push('fintech');
  if (/health|biotech|medic|pharma/i.test(text)) sectors.push('healthtech');
  if (/artificial|machine learn|ai\b|deep learn/i.test(text)) sectors.push('ai-ml');
  if (/software|saas|cloud/i.test(text)) sectors.push('saas');
  if (/enterprise|b2b/i.test(text)) sectors.push('enterprise');
  if (/consumer|retail|e-?commerce|b2c/i.test(text)) sectors.push('consumer');
  if (/clean|climate|energy|sustain|green/i.test(text)) sectors.push('climate');
  if (/educ|edtech|learn/i.test(text)) sectors.push('edtech');
  if (/hardware|robot|semiconductor|deep\s*tech/i.test(text)) sectors.push('deeptech');
  if (/crypto|blockchain|web3/i.test(text)) sectors.push('crypto');
  if (/agri|farm|food\s*tech/i.test(text)) sectors.push('agtech');
  if (/cyber|security|infosec/i.test(text)) sectors.push('cybersecurity');
  if (/real\s*estate|prop\s*tech/i.test(text)) sectors.push('proptech');
  if (/transport|mobil|auto/i.test(text)) sectors.push('mobility');
  if (/gaming|game/i.test(text)) sectors.push('gaming');
  return sectors.slice(0, 5);
}

// ─── Source 3: OpenVC Data ────────────────────────────────────────────────────
async function enrichFromOpenVC(db) {
  // Try multiple possible file names
  const candidates = ['harvest-openvc-full.json', 'openvc-investors.csv', 'openvc-investors.json', 'openvc.csv', 'openvc.json'];
  let filePath = null;

  for (const f of candidates) {
    const p = path.join(DATA_DIR, f);
    if (fs.existsSync(p)) { filePath = p; break; }
  }

  if (!filePath) {
    log('OPENVC', 'No OpenVC file found, skipping');
    return 0;
  }

  log('OPENVC', `Loading ${path.basename(filePath)}...`);
  const raw = fs.readFileSync(filePath, 'utf-8');

  let rows;
  if (filePath.endsWith('.json')) {
    rows = JSON.parse(raw);
    if (!Array.isArray(rows)) rows = rows.data || rows.investors || [];
  } else {
    rows = parseCSV(raw);
  }

  log('OPENVC', `Parsed ${rows.length} records`);

  if (rows.length === 0) return 0;
  log('OPENVC', `Columns: ${Object.keys(rows[0]).join(', ')}`);

  const sample = rows[0];
  const nameCol = Object.keys(sample).find(k => /^(name|firm_name|investor_name|organization)$/i.test(k));
  const websiteCol = Object.keys(sample).find(k => /^(website|url|domain)$/i.test(k));
  const checkMinCol = Object.keys(sample).find(k => /^(check_size_min|min_check|ticket_min|min_investment)$/i.test(k));
  const checkMaxCol = Object.keys(sample).find(k => /^(check_size_max|max_check|ticket_max|max_investment)$/i.test(k));
  const sectorsCol = Object.keys(sample).find(k => /^(sectors|focus_areas|industries|verticals)$/i.test(k));
  const stageCol = Object.keys(sample).find(k => /^(stage|stages|investment_stage|preferred_stage)$/i.test(k));
  const countryCol = Object.keys(sample).find(k => /^(country|location|hq_country|geography)$/i.test(k));
  const descCol = Object.keys(sample).find(k => /^(description|about|overview|bio)$/i.test(k));

  log('OPENVC', `Mapped: name=${nameCol}, website=${websiteCol}, checkMin=${checkMinCol}, sectors=${sectorsCol}`);

  if (!nameCol) {
    log('OPENVC', 'Could not find name column, skipping');
    return 0;
  }

  const ovcByName = new Map();
  for (const r of rows) {
    const name = r[nameCol];
    if (!name) continue;
    const norm = normalizeName(String(name));
    if (norm) ovcByName.set(norm, r);
  }

  log('OPENVC', `Indexed ${ovcByName.size} unique investors`);

  const updates = [];

  for (const [norm, dbRecords] of db.byNormName) {
    const ovcRec = ovcByName.get(norm);
    if (!ovcRec) continue;

    for (const dbRec of dbRecords) {
      const upd = { id: dbRec.id };
      let changed = false;

      if (!dbRec.website && websiteCol && ovcRec[websiteCol]) {
        let url = String(ovcRec[websiteCol]).trim();
        if (url && !url.startsWith('http')) url = 'https://' + url;
        if (url.length > 5) { upd.website = url; changed = true; }
      }

      if (dbRec.check_size_min == null && checkMinCol && ovcRec[checkMinCol]) {
        const val = parseInt(String(ovcRec[checkMinCol]).replace(/[^0-9]/g, ''));
        if (val > 0) { upd.check_size_min = val; changed = true; }
      }

      if (dbRec.check_size_max == null && checkMaxCol && ovcRec[checkMaxCol]) {
        const val = parseInt(String(ovcRec[checkMaxCol]).replace(/[^0-9]/g, ''));
        if (val > 0) { upd.check_size_max = val; changed = true; }
      }

      if ((!dbRec.sectors || dbRec.sectors.length === 0) && sectorsCol && ovcRec[sectorsCol]) {
        const raw = String(ovcRec[sectorsCol]);
        const sectors = raw.split(/[,;|]/).map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 5);
        if (sectors.length > 0) { upd.sectors = sectors; changed = true; }
      }

      if ((!dbRec.stage || dbRec.stage.length === 0) && stageCol && ovcRec[stageCol]) {
        const raw = String(ovcRec[stageCol]);
        const stages = raw.split(/[,;|]/).map(s => s.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean);
        if (stages.length > 0) { upd.stage = stages; changed = true; }
      }

      if (!dbRec.country && countryCol && ovcRec[countryCol]) {
        upd.country = String(ovcRec[countryCol]).trim();
        changed = true;
      }

      if ((!dbRec.description || dbRec.description.length < 50) && descCol && String(ovcRec[descCol] || '').length > 20) {
        upd.description = String(ovcRec[descCol]).trim().slice(0, 500);
        changed = true;
      }

      if (changed) updates.push(upd);
    }
  }

  log('OPENVC', `Matched ${updates.length} records for enrichment`);

  if (updates.length > 0) {
    const result = await sbBatchUpdate('funding_opportunities', updates);
    log('OPENVC', `✓ Updated ${result.success}, failed ${result.failed}`);
    return result.success;
  }
  return 0;
}

// ─── Source 4: Existing local data files ──────────────────────────────────────
async function enrichFromLocalFiles(db) {
  log('LOCAL', 'Checking existing local data files...');
  let totalEnriched = 0;

  // merged-vc-database.json has high website coverage
  const mergedPath = path.join(PROJECT_ROOT, 'tools/investor-enrichment/data/merged-vc-database.json');
  if (fs.existsSync(mergedPath)) {
    const data = JSON.parse(fs.readFileSync(mergedPath, 'utf-8'));
    const rows = Array.isArray(data) ? data : (data.investors || data.firms || []);
    log('LOCAL', `merged-vc-database.json: ${rows.length} records`);

    const byName = new Map();
    for (const r of rows) {
      const name = r.name || r.firm_name || r.organization;
      if (!name) continue;
      byName.set(normalizeName(String(name)), r);
    }

    const updates = [];
    for (const [norm, dbRecords] of db.byNormName) {
      const localRec = byName.get(norm);
      if (!localRec) continue;

      for (const dbRec of dbRecords) {
        const upd = { id: dbRec.id };
        let changed = false;

        const website = localRec.website || localRec.url || localRec.homepage;
        if (!dbRec.website && website) {
          let url = String(website).trim();
          if (url && !url.startsWith('http')) url = 'https://' + url;
          if (url.length > 5) { upd.website = url; changed = true; }
        }

        const desc = localRec.description || localRec.about || localRec.overview;
        if ((!dbRec.description || dbRec.description.length < 50) && desc && String(desc).length > 20) {
          upd.description = String(desc).trim().slice(0, 500);
          changed = true;
        }

        const loc = localRec.location || localRec.hq || localRec.city;
        if (!dbRec.location && loc) {
          upd.location = String(loc).trim();
          changed = true;
        }

        if (changed) updates.push(upd);
      }
    }

    if (updates.length > 0) {
      log('LOCAL', `merged-vc-database: ${updates.length} matches`);
      const result = await sbBatchUpdate('funding_opportunities', updates);
      totalEnriched += result.success;
      log('LOCAL', `✓ Updated ${result.success}`);
    }
  }

  // new-firms-to-import.json
  const newFirmsPath = path.join(PROJECT_ROOT, 'tools/investor-enrichment/data/new-firms-to-import.json');
  if (fs.existsSync(newFirmsPath)) {
    const data = JSON.parse(fs.readFileSync(newFirmsPath, 'utf-8'));
    const rows = Array.isArray(data) ? data : [];
    log('LOCAL', `new-firms-to-import.json: ${rows.length} records`);

    const byName = new Map();
    for (const r of rows) {
      const name = r.name || r.firm_name;
      if (!name) continue;
      byName.set(normalizeName(String(name)), r);
    }

    const updates = [];
    for (const [norm, dbRecords] of db.byNormName) {
      const localRec = byName.get(norm);
      if (!localRec) continue;

      for (const dbRec of dbRecords) {
        const upd = { id: dbRec.id };
        let changed = false;

        const website = localRec.website || localRec.url;
        if (!dbRec.website && website) {
          let url = String(website).trim();
          if (!url.startsWith('http')) url = 'https://' + url;
          if (url.length > 5) { upd.website = url; changed = true; }
        }

        if (changed) updates.push(upd);
      }
    }

    if (updates.length > 0) {
      log('LOCAL', `new-firms-to-import: ${updates.length} matches`);
      const result = await sbBatchUpdate('funding_opportunities', updates);
      totalEnriched += result.success;
      log('LOCAL', `✓ Updated ${result.success}`);
    }
  }

  log('LOCAL', `✓ Total from local files: ${totalEnriched}`);
  return totalEnriched;
}

// ─── Wikidata SPARQL ──────────────────────────────────────────────────────────
async function enrichFromWikidata(db) {
  log('WIKIDATA', 'Querying Wikidata for VC firms...');

  const sparql = `
SELECT ?item ?itemLabel ?website ?countryLabel ?hqLabel ?description WHERE {
  ?item wdt:P31/wdt:P279* wd:Q219577 .  # instance of venture capital firm (or subclass)
  OPTIONAL { ?item wdt:P856 ?website . }
  OPTIONAL { ?item wdt:P17 ?country . }
  OPTIONAL { ?item wdt:P159 ?hq . }
  OPTIONAL { ?item schema:description ?description . FILTER(LANG(?description) = "en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 10000`;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}`;

  try {
    const resp = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'ChiStartupHub/1.0' },
    });

    if (!resp.ok) {
      log('WIKIDATA', `Query failed: ${resp.status}`);
      return 0;
    }

    const data = await resp.json();
    const results = data.results?.bindings || [];
    log('WIKIDATA', `Got ${results.length} Wikidata results`);

    // Index by normalized name
    const wdByName = new Map();
    for (const r of results) {
      const name = r.itemLabel?.value;
      if (!name) continue;
      const norm = normalizeName(name);
      if (norm) {
        wdByName.set(norm, {
          website: r.website?.value || null,
          country: r.countryLabel?.value || null,
          hq: r.hqLabel?.value || null,
          description: r.description?.value || null,
        });
      }
    }

    log('WIKIDATA', `Indexed ${wdByName.size} unique firms`);

    const updates = [];
    for (const [norm, dbRecords] of db.byNormName) {
      const wdRec = wdByName.get(norm);
      if (!wdRec) continue;

      for (const dbRec of dbRecords) {
        const upd = { id: dbRec.id };
        let changed = false;

        if (!dbRec.website && wdRec.website) {
          upd.website = wdRec.website;
          changed = true;
        }
        if (!dbRec.country && wdRec.country) {
          upd.country = wdRec.country;
          changed = true;
        }
        if (!dbRec.location && wdRec.hq) {
          upd.location = wdRec.hq;
          changed = true;
        }
        if ((!dbRec.description || dbRec.description.length < 50) && wdRec.description && wdRec.description.length > 20) {
          upd.description = wdRec.description.slice(0, 500);
          changed = true;
        }

        if (changed) updates.push(upd);
      }
    }

    log('WIKIDATA', `Matched ${updates.length} records`);

    if (updates.length > 0) {
      const result = await sbBatchUpdate('funding_opportunities', updates);
      log('WIKIDATA', `✓ Updated ${result.success}`);
      return result.success;
    }
  } catch (err) {
    log('WIKIDATA', `Error: ${err.message}`);
  }
  return 0;
}

// ─── Completeness Report ──────────────────────────────────────────────────────
async function generateReport() {
  log('REPORT', 'Generating completeness report...');

  const rows = await sbSelectAll('funding_opportunities', '',
    'id,name,organization,description,website,check_size_min,check_size_max,sectors,stage,location,country,region,embedding,chicago_focused');

  const w = { name: 15, organization: 10, description: 20, website: 15, check_size: 15, location: 10, sectors: 5, stage: 5, embedding: 5 };
  let gold = 0, silver = 0, bronze = 0, totalScore = 0;
  const fields = { name: 0, organization: 0, description: 0, website: 0, check_size: 0, location: 0, sectors: 0, stage: 0, embedding: 0 };
  const regionStats = {};
  const countryStats = {};

  for (const r of rows) {
    let score = 0;
    if (r.name?.length > 2) { score += w.name; fields.name++; }
    if (r.organization) { score += w.organization; fields.organization++; }
    if (r.description?.length >= 50) { score += w.description; fields.description++; }
    else if (r.description?.length >= 20) score += w.description * 0.5;
    if (r.website?.startsWith('http')) { score += w.website; fields.website++; }
    if (r.check_size_min != null || r.check_size_max != null) { score += w.check_size; fields.check_size++; }
    if (r.location?.length > 2) { score += w.location; fields.location++; }
    if (r.sectors?.length > 0) { score += w.sectors; fields.sectors++; }
    if (r.stage?.length > 0) { score += w.stage; fields.stage++; }
    if (r.embedding) { score += w.embedding; fields.embedding++; }
    totalScore += score;
    if (score >= 85) gold++;
    else if (score >= 60) silver++;
    else bronze++;

    const reg = r.region || (r.chicago_focused ? 'Chicago' : 'Unknown');
    regionStats[reg] = (regionStats[reg] || 0) + 1;
    const ctry = r.country || 'Unknown';
    countryStats[ctry] = (countryStats[ctry] || 0) + 1;
  }

  const total = rows.length;
  const avg = Math.round(totalScore / (total || 1));

  const report = {
    generated_at: new Date().toISOString(),
    total_records: total, average_score: avg,
    tiers: { gold, gold_pct: Math.round(gold/total*100), silver, silver_pct: Math.round(silver/total*100), bronze, bronze_pct: Math.round(bronze/total*100) },
    field_coverage: Object.fromEntries(Object.entries(fields).map(([k,v]) => [k, {count:v, pct:Math.round(v/total*100)}])),
    regions: Object.fromEntries(Object.entries(regionStats).sort((a,b) => b[1]-a[1])),
    top_countries: Object.fromEntries(Object.entries(countryStats).sort((a,b) => b[1]-a[1]).slice(0,30)),
  };

  const reportPath = path.join(DATA_DIR, 'completeness-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(65));
  console.log('  COMPLETENESS REPORT (Post Free-Source Enrichment)');
  console.log('='.repeat(65));
  console.log(`  Total Records:       ${total}`);
  console.log(`  Average Score:       ${avg}/100`);
  console.log(`  Gold (>=85):         ${gold} (${report.tiers.gold_pct}%)`);
  console.log(`  Silver (60-84):      ${silver} (${report.tiers.silver_pct}%)`);
  console.log(`  Bronze (<60):        ${bronze} (${report.tiers.bronze_pct}%)`);
  console.log('-'.repeat(65));
  console.log('  FIELD COVERAGE:');
  for (const [f, {pct, count}] of Object.entries(report.field_coverage)) {
    const bar = '#'.repeat(Math.round(pct/3)) + '.'.repeat(33 - Math.round(pct/3));
    console.log(`    ${f.padEnd(14)} ${bar} ${String(pct).padStart(3)}% (${count})`);
  }
  console.log('-'.repeat(65));
  console.log('  TOP COUNTRIES:');
  for (const [c, n] of Object.entries(report.top_countries).slice(0,15)) {
    console.log(`    ${c.padEnd(25)} ${String(n).padStart(6)} records`);
  }
  console.log('='.repeat(65));
  console.log(`  Saved: ${reportPath}\n`);
  return report;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '='.repeat(65));
  console.log('  FREE SOURCE ENRICHMENT PIPELINE');
  console.log('  $0 cost — all free datasets');
  console.log('  Started: ' + new Date().toISOString());
  console.log('='.repeat(65) + '\n');

  // Load DB records into memory for matching
  const db = await loadDBRecords();

  // Run all sources
  const results = {};

  results.localFiles = await enrichFromLocalFiles(db);
  results.wikidata = await enrichFromWikidata(db);
  results.secFormADV = await enrichFromSECFormADV(db);
  results.gigasheet = await enrichFromGigasheet(db);
  results.openvc = await enrichFromOpenVC(db);

  const totalEnriched = Object.values(results).reduce((s, v) => s + v, 0);

  console.log('\n' + '='.repeat(65));
  console.log('  ENRICHMENT SUMMARY');
  console.log('='.repeat(65));
  for (const [source, count] of Object.entries(results)) {
    console.log(`  ${source.padEnd(20)} ${count} records enriched`);
  }
  console.log(`  ${'TOTAL'.padEnd(20)} ${totalEnriched} records enriched`);
  console.log('='.repeat(65) + '\n');

  // Generate updated report
  await generateReport();

  console.log('='.repeat(65));
  console.log('  PIPELINE COMPLETE — $0 spent');
  console.log('='.repeat(65) + '\n');
}

main().catch((err) => { console.error('FATAL:', err); process.exit(1); });
