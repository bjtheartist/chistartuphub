#!/usr/bin/env node
/**
 * generate-migration.mjs
 *
 * Reads all harvested investor JSON files, normalizes, deduplicates,
 * and generates a single SQL migration for the funding_opportunities table.
 */

import { readFileSync, writeFileSync, statSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');

// ─── Helpers ─────────────────────────────────────────────────────────

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function escapeSQL(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function toSQLArray(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "ARRAY[]::text[]";
  return "ARRAY[" + arr.map(v => escapeSQL(String(v))).join(', ') + "]";
}

function parseDollarAmount(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return val;
  const s = String(val).replace(/[$,\s]/g, '').toUpperCase();
  if (!s || s === 'NULL' || s === 'N/A') return null;
  let multiplier = 1;
  let num = s;
  if (s.endsWith('B')) { multiplier = 1_000_000_000; num = s.slice(0, -1); }
  else if (s.endsWith('M')) { multiplier = 1_000_000; num = s.slice(0, -1); }
  else if (s.endsWith('K')) { multiplier = 1_000; num = s.slice(0, -1); }
  const parsed = parseFloat(num);
  if (isNaN(parsed)) return null;
  return Math.round(parsed * multiplier);
}

const VALID_STAGES = new Set(['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'growth', 'late']);
const STAGE_MAP = {
  'preseed': 'pre-seed',
  'pre seed': 'pre-seed',
  'pre_seed': 'pre-seed',
  'seriesa': 'series-a',
  'series a': 'series-a',
  'series_a': 'series-a',
  'seriesb': 'series-b',
  'series b': 'series-b',
  'series_b': 'series-b',
  'seriesc': 'series-c',
  'series c': 'series-c',
  'series_c': 'series-c',
  'early': 'seed',
  'early stage': 'seed',
  'early-stage': 'seed',
  'late stage': 'late',
  'late-stage': 'late',
  'growth stage': 'growth',
};

function normalizeStage(stages) {
  if (!stages) return [];
  if (typeof stages === 'string') stages = stages.split(/[,;|]/);
  if (!Array.isArray(stages)) return [];
  const result = new Set();
  for (let s of stages) {
    if (!s) continue;
    const lower = String(s).trim().toLowerCase();
    if (VALID_STAGES.has(lower)) {
      result.add(lower);
    } else if (STAGE_MAP[lower]) {
      result.add(STAGE_MAP[lower]);
    }
    // else skip unknown
  }
  return [...result];
}

const VALID_TYPES = new Set(['vc', 'angel', 'grant', 'competition', 'non-dilutive']);
const TYPE_MAP = {
  'venture capital': 'vc',
  'venture_capital': 'vc',
  'venture': 'vc',
  'angel investor': 'angel',
  'angel_investor': 'angel',
  'angel network': 'angel',
  'angel group': 'angel',
  'accelerator': 'non-dilutive',
  'incubator': 'non-dilutive',
  'family office': 'vc',
  'family_office': 'vc',
  'cvc': 'vc',
  'corporate': 'vc',
  'corporate_vc': 'vc',
  'pe': 'vc',
  'private equity': 'vc',
  'micro-vc': 'vc',
  'micro vc': 'vc',
};

function normalizeType(t) {
  if (!t) return 'vc'; // default
  const lower = String(t).trim().toLowerCase();
  if (VALID_TYPES.has(lower)) return lower;
  return TYPE_MAP[lower] || 'vc';
}

function normalizeSectors(sectors) {
  if (!sectors) return [];
  if (typeof sectors === 'string') sectors = sectors.split(/[,;|]/);
  if (!Array.isArray(sectors)) return [];
  return sectors.map(s => String(s).trim()).filter(Boolean);
}

function countFilledFields(rec) {
  let count = 0;
  for (const [k, v] of Object.entries(rec)) {
    if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) count++;
  }
  return count;
}

// ─── Normalize a record from any source ──────────────────────────────

function stripMarkdown(s) {
  if (!s) return s;
  return s.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/, '').trim();
}

function normalizeRecord(raw, sourceLabel) {
  return {
    name: stripMarkdown((raw.name || raw.firm_name || raw.company || '').trim()),
    organization: stripMarkdown((raw.organization || raw.org || raw.firm_name || raw.name || '').trim()) || null,
    description: (raw.description || raw.desc || raw.bio || raw.summary || '').trim() || null,
    opportunity_type: normalizeType(raw.opportunity_type || raw.type || raw.investor_type),
    check_size_min: parseDollarAmount(raw.check_size_min || raw.min_check || raw.check_min),
    check_size_max: parseDollarAmount(raw.check_size_max || raw.max_check || raw.check_max),
    stage: normalizeStage(raw.stage || raw.stages || raw.investment_stage),
    sectors: normalizeSectors(raw.sectors || raw.focus_areas || raw.industries || raw.focus),
    website: (raw.website || raw.url || raw.homepage || '').trim() || null,
    contact_email: (raw.contact_email || raw.email || '').trim() || null,
    application_link: (raw.application_link || raw.apply_url || raw.application_url || '').trim() || null,
    is_active: raw.is_active !== undefined ? Boolean(raw.is_active) : true,
    chicago_focused: Boolean(raw.chicago_focused),
    featured: Boolean(raw.featured),
    location: (raw.location || '').trim() || null,
    _source: sourceLabel,
    _filled: 0, // will be computed
  };
}

// ─── Load JSON data ──────────────────────────────────────────────────

function loadJSON(path) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  if (Array.isArray(raw)) return raw;
  if (raw.records && Array.isArray(raw.records)) return raw.records;
  if (raw.data && Array.isArray(raw.data)) return raw.data;
  return [];
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const stats = {};
  const allRecords = [];

  // Primary sources
  const sources = [
    { label: 'sec-adv', path: join(ROOT, 'data/sec-adv-harvest.json') },
    { label: 'github-openvc', path: join(ROOT, 'data/harvested-investors.json') },
    { label: 'angel-midwest', path: join(ROOT, 'tools/investor-harvester/results/angel-midwest-harvest.json') },
    { label: 'wikipedia-vc', path: join(ROOT, 'data/harvested/wikipedia_vc.json') },
    { label: 'curated-vc', path: join(ROOT, 'data/harvested/curated_vc.json') },
  ];

  // Check for optional extra files
  const optionalPaths = [
    join(ROOT, 'data/family-cvc-harvest.json'),
    join(ROOT, 'tools/investor-harvester/results/family-cvc-harvest.json'),
  ];
  for (const p of optionalPaths) {
    try { statSync(p); sources.push({ label: 'family-cvc', path: p }); } catch {}
  }

  // Also include the latest Google CSE combined harvest
  try {
    const harvestDir = join(ROOT, 'data/harvests');
    const combined = readdirSync(harvestDir)
      .filter(f => f.startsWith('google-cse-combined') && f.endsWith('.json'))
      .sort()
      .pop(); // latest
    if (combined) {
      sources.push({ label: 'google-cse', path: join(harvestDir, combined) });
    }
  } catch {}

  // Load all sources
  for (const src of sources) {
    try {
      const raw = loadJSON(src.path);
      const normalized = raw
        .map(r => normalizeRecord(r, src.label))
        .filter(r => r.name && r.name.length > 0);
      normalized.forEach(r => { r._filled = countFilledFields(r); });
      stats[src.label] = normalized.length;
      allRecords.push(...normalized);
      console.log(`Loaded ${normalized.length} records from ${src.label}`);
    } catch (e) {
      console.log(`Skipped ${src.label}: ${e.message}`);
      stats[src.label] = 0;
    }
  }

  console.log(`\nTotal raw records: ${allRecords.length}`);

  // ─── Cross-source dedup ──────────────────────────────────────────
  const dedupMap = new Map(); // normalizedName -> best record
  let crossDupes = 0;
  for (const rec of allRecords) {
    const key = normalizeName(rec.name);
    if (!key) continue;
    const existing = dedupMap.get(key);
    if (existing) {
      crossDupes++;
      // Merge: keep the one with more filled fields, but merge in missing data
      const winner = existing._filled >= rec._filled ? existing : rec;
      const loser = existing._filled >= rec._filled ? rec : existing;
      // Fill in blanks from loser
      for (const field of ['organization', 'description', 'website', 'contact_email', 'application_link', 'location']) {
        if (!winner[field] && loser[field]) winner[field] = loser[field];
      }
      if (winner.check_size_min === null && loser.check_size_min !== null) winner.check_size_min = loser.check_size_min;
      if (winner.check_size_max === null && loser.check_size_max !== null) winner.check_size_max = loser.check_size_max;
      if (winner.stage.length === 0 && loser.stage.length > 0) winner.stage = loser.stage;
      if (winner.sectors.length === 0 && loser.sectors.length > 0) winner.sectors = loser.sectors;
      if (!winner.chicago_focused && loser.chicago_focused) winner.chicago_focused = true;
      winner._filled = countFilledFields(winner);
      dedupMap.set(key, winner);
    } else {
      dedupMap.set(key, rec);
    }
  }
  console.log(`Cross-source duplicates merged: ${crossDupes}`);
  console.log(`Unique records after cross-dedup: ${dedupMap.size}`);

  // ─── Dedup against existing DB ───────────────────────────────────
  let existingNames = new Set();
  let dbDupes = 0;
  try {
    const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTIyNjIsImV4cCI6MjA4MTkyODI2Mn0.k6yRcQ60OONig97VQZ-UJdmC49ijEm7kskP_2qtaW1E';

    // Fetch all existing names (paginate with range)
    let allNames = [];
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const url = `${SUPABASE_URL}/rest/v1/funding_opportunities?select=name&offset=${offset}&limit=${pageSize}`;
      const resp = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      });
      if (!resp.ok) {
        console.log(`Warning: Supabase fetch failed (${resp.status}), skipping DB dedup`);
        break;
      }
      const rows = await resp.json();
      allNames.push(...rows.map(r => r.name));
      if (rows.length < pageSize) break;
      offset += pageSize;
    }

    existingNames = new Set(allNames.map(n => normalizeName(n)));
    console.log(`Existing DB records: ${allNames.length}`);

    // Remove records that match existing
    for (const [key, rec] of dedupMap) {
      if (existingNames.has(key)) {
        dedupMap.delete(key);
        dbDupes++;
      }
    }
    console.log(`Duplicates against existing DB: ${dbDupes}`);
  } catch (e) {
    console.log(`Warning: Could not fetch existing records: ${e.message}`);
  }

  const finalRecords = [...dedupMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  console.log(`Net-new records for migration: ${finalRecords.length}`);

  if (finalRecords.length === 0) {
    console.log('No new records to insert. Migration not generated.');
    return;
  }

  // ─── Generate SQL ────────────────────────────────────────────────
  const BATCH_SIZE = 50;
  const lines = [];

  lines.push('-- ===========================================');
  lines.push('-- ChiStartup Hub - Instance B Bulk Import');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Total net-new investors: ${finalRecords.length}`);
  lines.push('-- Sources:');
  for (const [src, count] of Object.entries(stats)) {
    lines.push(`--   ${src}: ${count} raw records`);
  }
  lines.push(`-- Cross-source duplicates merged: ${crossDupes}`);
  lines.push(`-- Duplicates against existing DB: ${dbDupes}`);
  lines.push('-- ===========================================');
  lines.push('');

  // Ensure unique constraint exists
  lines.push('DO $$');
  lines.push('BEGIN');
  lines.push("  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funding_opportunities_name_unique') THEN");
  lines.push("    ALTER TABLE funding_opportunities ADD CONSTRAINT funding_opportunities_name_unique UNIQUE (name);");
  lines.push('  END IF;');
  lines.push('END $$;');
  lines.push('');

  // Ensure location column exists
  lines.push('DO $$');
  lines.push('BEGIN');
  lines.push("  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_opportunities' AND column_name = 'location') THEN");
  lines.push("    ALTER TABLE funding_opportunities ADD COLUMN location TEXT;");
  lines.push('  END IF;');
  lines.push('END $$;');
  lines.push('');

  for (let i = 0; i < finalRecords.length; i += BATCH_SIZE) {
    const batch = finalRecords.slice(i, i + BATCH_SIZE);
    lines.push(`-- Batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(finalRecords.length / BATCH_SIZE)}`);
    lines.push('INSERT INTO funding_opportunities (');
    lines.push('  name, organization, description, opportunity_type,');
    lines.push('  check_size_min, check_size_max, stage, sectors,');
    lines.push('  website, contact_email, application_link, is_active,');
    lines.push('  chicago_focused, featured, location');
    lines.push(') VALUES');

    const valueRows = batch.map(rec => {
      const vals = [
        escapeSQL(rec.name),
        escapeSQL(rec.organization),
        escapeSQL(rec.description),
        escapeSQL(rec.opportunity_type),
        rec.check_size_min !== null ? rec.check_size_min : 'NULL',
        rec.check_size_max !== null ? rec.check_size_max : 'NULL',
        toSQLArray(rec.stage),
        toSQLArray(rec.sectors),
        escapeSQL(rec.website),
        escapeSQL(rec.contact_email),
        escapeSQL(rec.application_link),
        rec.is_active ? 'TRUE' : 'FALSE',
        rec.chicago_focused ? 'TRUE' : 'FALSE',
        rec.featured ? 'TRUE' : 'FALSE',
        escapeSQL(rec.location),
      ];
      return '(' + vals.join(', ') + ')';
    });

    lines.push(valueRows.join(',\n'));
    lines.push('ON CONFLICT (name) DO NOTHING;');
    lines.push('');
  }

  const sql = lines.join('\n');
  // User requested this exact filename
  const outPath = join(ROOT, 'supabase/migrations/20260309000000_instance_b_bulk_import.sql');
  writeFileSync(outPath, sql, 'utf8');

  const fileSize = statSync(outPath).size;
  console.log(`\n=== SUMMARY ===`);
  console.log(`Records from each source:`);
  for (const [src, count] of Object.entries(stats)) {
    console.log(`  ${src}: ${count}`);
  }
  console.log(`Cross-source duplicates merged: ${crossDupes}`);
  console.log(`Duplicates against existing DB removed: ${dbDupes}`);
  console.log(`Final net-new records: ${finalRecords.length}`);
  console.log(`Migration file: ${outPath}`);
  console.log(`Migration file size: ${(fileSize / 1024).toFixed(1)} KB`);
}

main().catch(e => { console.error(e); process.exit(1); });
