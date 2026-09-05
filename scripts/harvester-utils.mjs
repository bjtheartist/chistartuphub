/**
 * Shared utilities for Instance B data harvesters
 * Writes to investor_pipeline (with service role key) or saves to JSON fallback
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export const GOOGLE_CSE_KEY = process.env.GOOGLE_API_KEY; // Key removed — pass via env var
export const GOOGLE_CSE_CX = '11f92775a1a4a42d5';

const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTIyNjIsImV4cCI6MjA4MTkyODI2Mn0.k6yRcQ60OONig97VQZ-UJdmC49ijEm7kskP_2qtaW1E';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('[harvester-utils] Using service role key for database access');
} else {
  console.log('[harvester-utils] WARNING: No SUPABASE_SERVICE_ROLE_KEY set. Using anon key - writes may fail due to RLS.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Existing names cache for client-side dedup
let existingNamesCache = null;

export async function getExistingNames() {
  if (existingNamesCache) return existingNamesCache;
  const names = new Set();
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data } = await supabase
      .from('funding_opportunities')
      .select('name')
      .range(offset, offset + limit - 1);
    if (!data || data.length === 0) break;
    data.forEach(r => names.add(normalizeName(r.name)));
    offset += limit;
  }
  // Also get staging names to avoid double-inserts across harvesters
  offset = 0;
  while (true) {
    const { data } = await supabase
      .from('investor_pipeline')
      .select('name')
      .range(offset, offset + limit - 1);
    if (!data || data.length === 0) break;
    data.forEach(r => names.add(normalizeName(r.name)));
    offset += limit;
  }
  existingNamesCache = names;
  return names;
}

export function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fuzzy match using Levenshtein-like similarity
export function similarity(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return 1.0;
  if (!na || !nb) return 0;

  // Token overlap (Jaccard)
  const tokensA = new Set(na.split(' '));
  const tokensB = new Set(nb.split(' '));
  const intersection = [...tokensA].filter(t => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

export function isDuplicate(name, existingNames) {
  const normalized = normalizeName(name);
  if (existingNames.has(normalized)) return true;

  // Check fuzzy matches against existing
  for (const existing of existingNames) {
    if (similarity(name, existing) >= 0.75) return true;
  }
  return false;
}

/**
 * Insert records into staging table in batches
 * @param {Array} records - Array of normalized records
 * @param {string} source - Source identifier (e.g., 'sec_adv', 'github_awesome_vc')
 * @returns {Object} { inserted: number, skipped: number, errors: number }
 */
export async function insertToStaging(records, source) {
  const existingNames = await getExistingNames();
  const stats = { inserted: 0, skipped: 0, errors: 0 };
  const BATCH_SIZE = 50;

  const deduped = records.filter(r => {
    if (!r.name || r.name.trim() === '') {
      stats.skipped++;
      return false;
    }
    if (isDuplicate(r.name, existingNames)) {
      stats.skipped++;
      return false;
    }
    // Add to cache so subsequent batches/harvesters don't double-insert
    existingNames.add(normalizeName(r.name));
    return true;
  });

  console.log(`  [${source}] ${records.length} total → ${deduped.length} after dedup (${stats.skipped} skipped)`);

  const allNormalized = deduped.map(r => ({
    name: r.name?.trim(),
    organization: r.organization?.trim() || r.name?.trim(),
    description: r.description?.trim() || null,
    website: r.website?.trim() || null,
    location: r.location?.trim() || null,
    opportunity_type: normalizeOpportunityType(r.opportunity_type),
    check_size_min: parseCheckSize(r.check_size_min),
    check_size_max: parseCheckSize(r.check_size_max),
    stage: normalizeStages(r.stage),
    sectors: normalizeSectors(r.sectors),
    chicago_focused: r.chicago_focused || false,
    confidence_score: r.confidence_score || 70,
    enrichment_source: 'web',
    needs_review: (r.confidence_score || 70) < 80,
    match_type: 'new',
    status: 'pending',
    raw_input: r.raw_input || null,
    field_sources: r.field_sources || {},
  }));

  // Try DB insert first
  const TARGET_TABLE = 'investor_pipeline';
  for (let i = 0; i < allNormalized.length; i += BATCH_SIZE) {
    const batch = allNormalized.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(TARGET_TABLE).insert(batch);
    if (error) {
      console.error(`  [${source}] Batch ${i / BATCH_SIZE + 1} DB error:`, error.message);
      stats.errors += batch.length;
    } else {
      stats.inserted += batch.length;
    }
  }

  // Always save to JSON fallback (append-friendly)
  const jsonDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'harvested');
  try {
    const { mkdirSync: mkdirSyncFs } = await import('node:fs');
    mkdirSyncFs(jsonDir, { recursive: true });
  } catch {}
  const jsonPath = join(jsonDir, `${source}.json`);
  try {
    let existing = [];
    if (existsSync(jsonPath)) {
      existing = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    }
    writeFileSync(jsonPath, JSON.stringify([...existing, ...allNormalized], null, 2));
    console.log(`  [${source}] Saved ${allNormalized.length} records to ${jsonPath}`);
  } catch (err) {
    console.error(`  [${source}] JSON save error:`, err.message);
  }

  console.log(`  [${source}] Result: ${stats.inserted} inserted to DB, ${stats.skipped} skipped, ${stats.errors} errors`);
  return { ...stats, json_saved: allNormalized.length };
}

function normalizeOpportunityType(type) {
  if (!type) return 'vc';
  const t = type.toLowerCase().trim();
  if (t.includes('angel')) return 'angel';
  if (t.includes('grant')) return 'grant';
  if (t.includes('competition') || t.includes('prize')) return 'competition';
  if (t.includes('non-dilutive') || t.includes('nondilutive')) return 'non-dilutive';
  if (t.includes('corporate') || t.includes('cvc')) return 'vc';
  if (t.includes('family')) return 'vc';
  if (t.includes('pe') || t.includes('private equity')) return 'vc';
  return 'vc';
}

function parseCheckSize(val) {
  if (!val) return null;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[$,\s]/g, '');
  // Handle M/B/K suffixes
  const match = str.match(/^(\d+(?:\.\d+)?)\s*([mkbMKB])?$/);
  if (match) {
    let num = parseFloat(match[1]);
    const suffix = (match[2] || '').toUpperCase();
    if (suffix === 'K') num *= 1_000;
    if (suffix === 'M') num *= 1_000_000;
    if (suffix === 'B') num *= 1_000_000_000;
    return Math.round(num);
  }
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? null : parsed;
}

function normalizeStages(stages) {
  if (!stages) return [];
  const arr = Array.isArray(stages) ? stages : String(stages).split(',');
  const STAGE_MAP = {
    'pre-seed': 'pre-seed', 'preseed': 'pre-seed', 'pre seed': 'pre-seed',
    'seed': 'seed',
    'series a': 'series-a', 'series-a': 'series-a', 'a': 'series-a',
    'series b': 'series-b', 'series-b': 'series-b', 'b': 'series-b',
    'series c': 'series-c', 'series-c': 'series-c', 'c': 'series-c',
    'growth': 'growth', 'late': 'late', 'late stage': 'late',
    'early': 'seed', 'early stage': 'seed', 'early-stage': 'seed',
  };
  return [...new Set(arr.map(s => STAGE_MAP[s.toLowerCase().trim()] || s.toLowerCase().trim()).filter(Boolean))];
}

function normalizeSectors(sectors) {
  if (!sectors) return [];
  const arr = Array.isArray(sectors) ? sectors : String(sectors).split(',');
  return [...new Set(arr.map(s => s.trim()).filter(Boolean))];
}

/**
 * Fetch a URL with retry and rate limiting
 */
export async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'ChiStartupHub-Research/1.0 (educational)',
          ...options.headers,
        },
      });
      if (res.ok) return res;
      if (res.status === 429) {
        console.log(`  Rate limited on ${url}, waiting ${delayMs * 2}ms...`);
        await sleep(delayMs * 2);
        continue;
      }
      if (res.status >= 500) {
        await sleep(delayMs);
        continue;
      }
      return res; // 4xx errors, don't retry
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(delayMs);
    }
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse CSV string into array of objects
 */
export function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim(); });
    return obj;
  });
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}
