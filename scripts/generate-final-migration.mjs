#!/usr/bin/env node
/**
 * Generate consolidated SQL migration for ALL harvested investor data.
 * Reads all JSON sources, normalizes, deduplicates, and outputs SQL.
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';

const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTIyNjIsImV4cCI6MjA4MTkyODI2Mn0.k6yRcQ60OONig97VQZ-UJdmC49ijEm7kskP_2qtaW1E';

const OUTPUT_PATH = '/Users/billyndizeye/chistartuphub/supabase/migrations/20260309100000_instance_b_full_import.sql';

// All source files in priority order (later = higher priority for merging)
const SOURCES = [
  { path: '/Users/billyndizeye/chistartuphub/data/harvest-openvc-full.json', label: 'openvc-full' },
  { path: '/Users/billyndizeye/chistartuphub/data/harvest-govt-sources.json', label: 'govt-sources' },
  { path: '/Users/billyndizeye/chistartuphub/data/harvested/govt_sources.json', label: 'govt-sources-enriched' },
  { path: '/Users/billyndizeye/chistartuphub/data/sec-adv-harvest.json', label: 'sec-adv' },
  { path: '/Users/billyndizeye/chistartuphub/data/harvested-investors.json', label: 'github-openvc' },
  { path: '/Users/billyndizeye/chistartuphub/data/harvested/wikipedia_vc.json', label: 'wikipedia-vc' },
  { path: '/Users/billyndizeye/chistartuphub/data/harvested/curated_vc.json', label: 'curated-vc' },
  { path: '/Users/billyndizeye/chistartuphub/tools/investor-harvester/results/angel-midwest-harvest.json', label: 'angel-midwest' },
  { path: '/Users/billyndizeye/chistartuphub/data/harvests/google-cse-combined-2026-03-09T22-26-18.json', label: 'google-cse-combined' },
  // Check for additional files
  { path: '/Users/billyndizeye/chistartuphub/data/harvest-sec-bulk.json', label: 'sec-bulk' },
  { path: '/Users/billyndizeye/chistartuphub/data/harvest-state-associations.json', label: 'state-associations' },
  { path: '/Users/billyndizeye/chistartuphub/data/harvest-aggregated-sources.json', label: 'aggregated-sources' },
];

// ---- Helpers ----

function normalizeKey(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\*\*/g, '')
    .replace(/\[/g, '').replace(/\]/g, '')
    .replace(/#/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanName(name) {
  if (!name) return null;
  return name
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')  // markdown links
    .replace(/\[/g, '').replace(/\]/g, '')
    .replace(/#/g, '')
    .replace(/\|/g, '')
    .trim();
}

function parseCheckSize(val) {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  const s = String(val).replace(/[$,\s]/g, '');
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(b|m|k)?$/i);
  if (!m) return null;
  let num = parseFloat(m[1]);
  const suffix = (m[2] || '').toLowerCase();
  if (suffix === 'b') num *= 1_000_000_000;
  else if (suffix === 'm') num *= 1_000_000;
  else if (suffix === 'k') num *= 1_000;
  return Math.round(num);
}

const VALID_TYPES = new Set(['vc', 'angel', 'grant', 'competition', 'non-dilutive']);
function normalizeType(t) {
  if (!t) return 'vc';
  const lt = String(t).toLowerCase().trim();
  if (VALID_TYPES.has(lt)) return lt;
  if (lt.includes('angel')) return 'angel';
  if (lt.includes('grant') || lt.includes('foundation') || lt.includes('nonprofit')) return 'grant';
  if (lt.includes('competition') || lt.includes('accelerator') || lt.includes('incubator')) return 'competition';
  if (lt.includes('non-dilutive') || lt.includes('nondilutive')) return 'non-dilutive';
  if (lt.includes('venture') || lt.includes('vc') || lt.includes('capital')) return 'vc';
  return 'vc';
}

const VALID_STAGES = new Set(['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'growth', 'late']);
function normalizeStage(s) {
  if (!s) return null;
  const ls = String(s).toLowerCase().trim().replace(/\s+/g, '-');
  if (VALID_STAGES.has(ls)) return ls;
  if (ls.includes('pre-seed') || ls.includes('preseed')) return 'pre-seed';
  if (ls.includes('seed')) return 'seed';
  if (ls.includes('series-a') || ls === 'a') return 'series-a';
  if (ls.includes('series-b') || ls === 'b') return 'series-b';
  if (ls.includes('series-c') || ls === 'c') return 'series-c';
  if (ls.includes('growth') || ls.includes('expansion')) return 'growth';
  if (ls.includes('late') || ls.includes('ipo')) return 'late';
  if (ls.includes('early')) return 'seed';
  return null;
}

function normalizeStages(arr) {
  if (!arr || !Array.isArray(arr)) return [];
  const result = [];
  for (const s of arr) {
    const n = normalizeStage(s);
    if (n && !result.includes(n)) result.push(n);
  }
  return result;
}

function normalizeWebsite(w) {
  if (!w || typeof w !== 'string') return null;
  const trimmed = w.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return null;
}

function isChicagoFocused(rec) {
  const loc = (rec.location || '').toLowerCase();
  if (loc.includes('chicago') || loc.includes('illinois') || /\bil\b/.test(loc)) return true;
  if (rec.chicago_focused === true) return true;
  return false;
}

function normalizeRecord(raw) {
  const name = cleanName(raw.name);
  if (!name || name.length < 2) return null;

  let desc = raw.description || null;
  if (desc && desc.length > 2000) desc = desc.slice(0, 2000);

  let checkMin = raw.check_size_min ?? null;
  let checkMax = raw.check_size_max ?? null;

  // Parse check_size string if present
  if (raw.check_size && typeof raw.check_size === 'string') {
    const parts = raw.check_size.replace(/[$,]/g, '').split(/[-–]/);
    if (parts.length >= 2) {
      checkMin = checkMin ?? parseCheckSize(parts[0]);
      checkMax = checkMax ?? parseCheckSize(parts[1]);
    } else {
      checkMin = checkMin ?? parseCheckSize(parts[0]);
    }
  }
  if (typeof checkMin === 'string') checkMin = parseCheckSize(checkMin);
  if (typeof checkMax === 'string') checkMax = parseCheckSize(checkMax);

  const sectors = Array.isArray(raw.sectors) ? raw.sectors.filter(Boolean).map(s => String(s).trim()).filter(s => s.length > 0) :
    Array.isArray(raw.focus_areas) ? raw.focus_areas.filter(Boolean).map(s => String(s).trim()).filter(s => s.length > 0) : [];

  return {
    name,
    organization: cleanName(raw.organization) || name,
    description: desc,
    opportunity_type: normalizeType(raw.opportunity_type || raw.type),
    check_size_min: (typeof checkMin === 'number' && isFinite(checkMin)) ? checkMin : null,
    check_size_max: (typeof checkMax === 'number' && isFinite(checkMax)) ? checkMax : null,
    stage: normalizeStages(raw.stage || raw.stages),
    sectors,
    website: normalizeWebsite(raw.website),
    location: raw.location || null,
    contact_email: raw.contact_email || null,
    application_link: normalizeWebsite(raw.application_link) || null,
    is_active: true,
    chicago_focused: isChicagoFocused(raw),
    featured: false,
  };
}

function fieldCount(rec) {
  let count = 0;
  if (rec.description) count += 2;
  if (rec.website) count += 2;
  if (rec.check_size_min) count++;
  if (rec.check_size_max) count++;
  if (rec.stage?.length) count++;
  if (rec.sectors?.length) count++;
  if (rec.location) count++;
  if (rec.contact_email) count++;
  if (rec.application_link) count++;
  if (rec.organization && rec.organization !== rec.name) count++;
  return count;
}

function mergeRecords(existing, incoming) {
  const merged = { ...existing };
  // Backfill missing fields from incoming
  if (!merged.description && incoming.description) merged.description = incoming.description;
  if (!merged.website && incoming.website) merged.website = incoming.website;
  if (!merged.check_size_min && incoming.check_size_min) merged.check_size_min = incoming.check_size_min;
  if (!merged.check_size_max && incoming.check_size_max) merged.check_size_max = incoming.check_size_max;
  if ((!merged.stage || merged.stage.length === 0) && incoming.stage?.length) merged.stage = incoming.stage;
  if ((!merged.sectors || merged.sectors.length === 0) && incoming.sectors?.length) merged.sectors = incoming.sectors;
  if (!merged.location && incoming.location) merged.location = incoming.location;
  if (!merged.contact_email && incoming.contact_email) merged.contact_email = incoming.contact_email;
  if (!merged.application_link && incoming.application_link) merged.application_link = incoming.application_link;
  if (!merged.organization && incoming.organization) merged.organization = incoming.organization;
  // If incoming has chicago_focused, propagate
  if (incoming.chicago_focused) merged.chicago_focused = true;
  return merged;
}

function escSql(val) {
  if (val == null) return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function arrayToSql(arr) {
  if (!arr || arr.length === 0) return "ARRAY[]::text[]";
  const items = arr.map(s => "'" + String(s).replace(/'/g, "''") + "'").join(',');
  return `ARRAY[${items}]::text[]`;
}

// ---- Main ----

async function main() {
  console.log('=== ChiStartup Hub - Final Migration Generator ===\n');

  // 1. Load all source files
  const sourceCounts = {};
  const allRecords = []; // { record, source }

  for (const { path: fpath, label } of SOURCES) {
    if (!existsSync(fpath)) {
      console.log(`  SKIP (not found): ${label} — ${fpath}`);
      continue;
    }
    try {
      const raw = JSON.parse(readFileSync(fpath, 'utf-8'));
      let records;
      if (Array.isArray(raw)) {
        records = raw;
      } else if (raw.records && Array.isArray(raw.records)) {
        records = raw.records;
      } else {
        console.log(`  SKIP (unknown format): ${label}`);
        continue;
      }

      if (records.length === 0) {
        console.log(`  SKIP (empty): ${label}`);
        continue;
      }

      sourceCounts[label] = records.length;
      console.log(`  Loaded: ${label} — ${records.length} records`);

      for (const r of records) {
        const normalized = normalizeRecord(r);
        if (normalized) {
          allRecords.push({ record: normalized, source: label });
        }
      }
    } catch (e) {
      console.log(`  ERROR loading ${label}: ${e.message}`);
    }
  }

  console.log(`\nTotal raw records loaded: ${allRecords.length}`);

  // 2. Cross-source dedup
  const deduped = new Map(); // normalizedKey -> record
  let crossDupes = 0;

  for (const { record } of allRecords) {
    const key = normalizeKey(record.name);
    if (!key) continue;

    if (deduped.has(key)) {
      crossDupes++;
      const existing = deduped.get(key);
      // Keep the one with more fields, backfill from the other
      if (fieldCount(record) > fieldCount(existing)) {
        deduped.set(key, mergeRecords(record, existing));
      } else {
        deduped.set(key, mergeRecords(existing, record));
      }
    } else {
      deduped.set(key, record);
    }
  }

  console.log(`After cross-source dedup: ${deduped.size} unique records (${crossDupes} duplicates merged)`);

  // 3. Fetch existing DB records to dedup
  let dbNames = new Set();
  let dbDupes = 0;
  try {
    console.log('\nFetching existing DB records...');
    // Fetch in pages of 1000
    let offset = 0;
    let allDbNames = [];
    while (true) {
      const url = `${SUPABASE_URL}/rest/v1/funding_opportunities?select=name&offset=${offset}&limit=1000`;
      const resp = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (!resp.ok) {
        console.log(`  DB fetch error: ${resp.status} ${resp.statusText}`);
        break;
      }
      const data = await resp.json();
      if (data.length === 0) break;
      allDbNames.push(...data.map(r => r.name));
      offset += 1000;
      if (data.length < 1000) break;
    }
    console.log(`  Found ${allDbNames.length} existing records in DB`);
    dbNames = new Set(allDbNames.map(n => normalizeKey(n)));
  } catch (e) {
    console.log(`  DB fetch failed: ${e.message} — proceeding without DB dedup`);
  }

  // Remove DB duplicates
  const finalRecords = [];
  for (const [key, record] of deduped) {
    if (dbNames.has(key)) {
      dbDupes++;
    } else {
      finalRecords.push(record);
    }
  }

  console.log(`DB duplicates removed: ${dbDupes}`);
  console.log(`Final net-new records: ${finalRecords.length}`);

  // 4. Generate SQL
  console.log('\nGenerating SQL migration...');

  const batchSize = 100;
  const totalBatches = Math.ceil(finalRecords.length / batchSize);

  let sql = '';

  // Header
  sql += '-- ===========================================\n';
  sql += '-- ChiStartup Hub - Full Dataset Import\n';
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- Total net-new records: ${finalRecords.length}\n`;
  sql += '-- Sources:\n';
  for (const [label, count] of Object.entries(sourceCounts)) {
    sql += `--   ${label}: ${count} raw records\n`;
  }
  sql += `-- Cross-source duplicates merged: ${crossDupes}\n`;
  sql += `-- Duplicates against existing DB: ${dbDupes}\n`;
  sql += '-- ===========================================\n\n';

  // Schema additions
  sql += `-- Ensure location column exists\n`;
  sql += `DO $$ BEGIN\n`;
  sql += `  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_opportunities' AND column_name = 'location') THEN\n`;
  sql += `    ALTER TABLE funding_opportunities ADD COLUMN location TEXT;\n`;
  sql += `  END IF;\nEND $$;\n\n`;

  sql += `-- Ensure unique constraint on name\n`;
  sql += `DO $$ BEGIN\n`;
  sql += `  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funding_opportunities_name_key') THEN\n`;
  sql += `    ALTER TABLE funding_opportunities ADD CONSTRAINT funding_opportunities_name_key UNIQUE (name);\n`;
  sql += `  END IF;\nEND $$;\n\n`;

  // Batch inserts
  for (let batch = 0; batch < totalBatches; batch++) {
    const start = batch * batchSize;
    const end = Math.min(start + batchSize, finalRecords.length);
    const batchRecords = finalRecords.slice(start, end);

    sql += `-- Batch ${batch + 1} of ${totalBatches}\n`;
    sql += `INSERT INTO funding_opportunities (name, organization, description, opportunity_type, check_size_min, check_size_max, stage, sectors, website, location, is_active, chicago_focused, featured) VALUES\n`;

    const rows = batchRecords.map(r => {
      return `(${escSql(r.name)}, ${escSql(r.organization)}, ${escSql(r.description)}, ${escSql(r.opportunity_type)}, ${r.check_size_min ?? 'NULL'}, ${r.check_size_max ?? 'NULL'}, ${arrayToSql(r.stage)}, ${arrayToSql(r.sectors)}, ${escSql(r.website)}, ${escSql(r.location)}, TRUE, ${r.chicago_focused ? 'TRUE' : 'FALSE'}, FALSE)`;
    });

    sql += rows.join(',\n');
    sql += '\nON CONFLICT (name) DO NOTHING;\n\n';
  }

  // Write file
  writeFileSync(OUTPUT_PATH, sql, 'utf-8');
  const fileSize = statSync(OUTPUT_PATH).size;

  console.log('\n=== RESULTS ===');
  console.log('Records from each source:');
  for (const [label, count] of Object.entries(sourceCounts)) {
    console.log(`  ${label}: ${count}`);
  }
  console.log(`Cross-source duplicates merged: ${crossDupes}`);
  console.log(`DB duplicates removed: ${dbDupes}`);
  console.log(`Final net-new record count: ${finalRecords.length}`);
  console.log(`Migration file: ${OUTPUT_PATH}`);
  console.log(`Migration file size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(e => { console.error(e); process.exit(1); });
