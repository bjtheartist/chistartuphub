/**
 * Direct bulk import to funding_opportunities using service role key
 * Reads all harvested JSON files, deduplicates, and inserts via Supabase client
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// === Data Loading ===

function loadJSON(path, label) {
  if (!existsSync(path)) { console.log(`  [skip] ${label}: file not found`); return []; }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    const arr = Array.isArray(raw) ? raw : (raw.records || []);
    console.log(`  [load] ${label}: ${arr.length} records`);
    return arr;
  } catch (e) { console.error(`  [err] ${label}: ${e.message}`); return []; }
}

// === Normalization ===

function normalizeName(n) {
  if (!n) return '';
  return n.replace(/[\*\[\]#`]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeType(t) {
  if (!t) return 'vc';
  const s = t.toLowerCase();
  if (s.includes('angel')) return 'angel';
  if (s.includes('grant')) return 'grant';
  if (s.includes('competition') || s.includes('prize')) return 'competition';
  if (s.includes('non-dilutive') || s.includes('nondilutive')) return 'non-dilutive';
  return 'vc';
}

function parseSize(v) {
  if (!v) return null;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[$,\s]/g, '');
  const m = s.match(/^(\d+(?:\.\d+)?)\s*([kmb])?$/i);
  if (m) {
    let n = parseFloat(m[1]);
    const u = (m[2] || '').toUpperCase();
    if (u === 'K') n *= 1e3;
    if (u === 'M') n *= 1e6;
    if (u === 'B') n *= 1e9;
    return Math.round(n);
  }
  const p = parseInt(s, 10);
  return isNaN(p) ? null : p;
}

const STAGE_MAP = {
  'pre-seed': 'pre-seed', 'preseed': 'pre-seed', 'pre seed': 'pre-seed',
  'seed': 'seed', 'series a': 'series-a', 'series-a': 'series-a',
  'series b': 'series-b', 'series-b': 'series-b',
  'series c': 'series-c', 'series-c': 'series-c',
  'growth': 'growth', 'late': 'late', 'late stage': 'late',
  'early': 'seed', 'early stage': 'seed', 'early-stage': 'seed',
};

function normalizeStages(arr) {
  if (!arr) return [];
  const a = Array.isArray(arr) ? arr : String(arr).split(',');
  return [...new Set(a.map(s => STAGE_MAP[s.toLowerCase().trim()] || s.toLowerCase().trim()).filter(Boolean))];
}

function normalizeSectors(arr) {
  if (!arr) return [];
  const a = Array.isArray(arr) ? arr : String(arr).split(',');
  return [...new Set(a.map(s => s.trim()).filter(Boolean))];
}

function isChicagoFocused(r) {
  const loc = (r.location || '').toLowerCase();
  return loc.includes('chicago') || loc.includes('illinois') || /\bil\b/.test(loc) || r.chicago_focused === true;
}

function normalizeRecord(r) {
  const name = (r.name || '').replace(/[\*\[\]#`]/g, '').trim();
  if (!name || name.length < 2) return null;

  // Build description with location appended (location column doesn't exist yet)
  let desc = r.description ? r.description.substring(0, 1900) : '';
  if (r.location) desc = desc ? `${desc} [Location: ${r.location}]` : `[Location: ${r.location}]`;

  return {
    name: name.substring(0, 500),
    organization: (r.organization || name).substring(0, 500),
    description: desc || null,
    opportunity_type: normalizeType(r.opportunity_type || r.type),
    check_size_min: parseSize(r.check_size_min),
    check_size_max: parseSize(r.check_size_max),
    stage: normalizeStages(r.stage || r.stages),
    sectors: normalizeSectors(r.sectors || r.focus_areas),
    website: r.website && r.website.startsWith('http') ? r.website.substring(0, 500) : null,
    is_active: true,
    chicago_focused: isChicagoFocused(r),
    featured: false,
  };
}

// === Main ===

async function main() {
  console.log('=== ChiStartup Hub - Direct Bulk Import ===\n');

  // Get existing names
  console.log('Fetching existing records...');
  const existingNames = new Set();
  let offset = 0;
  while (true) {
    const { data } = await sb.from('funding_opportunities').select('name').range(offset, offset + 999);
    if (!data || data.length === 0) break;
    data.forEach(r => existingNames.add(normalizeName(r.name)));
    offset += 1000;
  }
  console.log(`  Existing records: ${existingNames.size}\n`);

  // Load all sources
  console.log('Loading data sources...');
  const sources = [
    ...loadJSON('data/harvest-openvc-full.json', 'OpenVC/Crunchbase'),
    ...loadJSON('data/sec-adv-harvest.json', 'SEC ADV'),
    ...loadJSON('data/harvest-govt-sources.json', 'Govt Sources'),
    ...loadJSON('data/harvest-state-associations.json', 'State Associations'),
    ...loadJSON('data/harvested-investors.json', 'GitHub/OpenVC').map(r => r),
    ...loadJSON('data/harvested/curated_vc.json', 'Curated VCs'),
    ...loadJSON('data/harvested/wikipedia_vc.json', 'Wikipedia VCs'),
    ...loadJSON('tools/investor-harvester/results/angel-midwest-harvest.json', 'Angel/Midwest'),
    ...loadJSON('data/harvest-sec-bulk.json', 'SEC Bulk'),
    ...loadJSON('data/harvest-aggregated-sources.json', 'Aggregated'),
    ...loadJSON('data/harvested/govt_sources.json', 'Govt Enriched'),
  ];

  // Handle harvested-investors.json which has .records
  const hiPath = 'data/harvested-investors.json';
  if (existsSync(hiPath)) {
    const raw = JSON.parse(readFileSync(hiPath, 'utf-8'));
    if (raw.records && !Array.isArray(raw)) {
      // Already loaded above via loadJSON which extracts .records
    }
  }

  console.log(`\nTotal raw records: ${sources.length}`);

  // Normalize and dedup
  console.log('Normalizing and deduplicating...');
  const seen = new Set();
  const records = [];
  let crossDupes = 0;
  let dbDupes = 0;
  let invalid = 0;

  for (const r of sources) {
    const normalized = normalizeRecord(r);
    if (!normalized) { invalid++; continue; }

    const key = normalizeName(normalized.name);
    if (!key) { invalid++; continue; }

    if (existingNames.has(key)) { dbDupes++; continue; }
    if (seen.has(key)) { crossDupes++; continue; }

    seen.add(key);
    records.push(normalized);
  }

  console.log(`  Invalid/empty: ${invalid}`);
  console.log(`  Cross-source duplicates: ${crossDupes}`);
  console.log(`  Already in DB: ${dbDupes}`);
  console.log(`  Net-new records: ${records.length}\n`);

  // Batch insert
  const BATCH = 100;
  let inserted = 0;
  let errors = 0;
  const total = records.length;

  console.log(`Inserting ${total} records in batches of ${BATCH}...`);

  for (let i = 0; i < total; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await sb.from('funding_opportunities').upsert(batch, {
      onConflict: 'name',
      ignoreDuplicates: true,
    });

    if (error) {
      // Try one by one for this batch
      let batchInserted = 0;
      for (const rec of batch) {
        const { error: e2 } = await sb.from('funding_opportunities').insert(rec);
        if (!e2) batchInserted++;
      }
      inserted += batchInserted;
      errors += batch.length - batchInserted;
    } else {
      inserted += batch.length;
    }

    if ((i + BATCH) % 1000 === 0 || i + BATCH >= total) {
      const pct = Math.min(100, Math.round((i + BATCH) / total * 100));
      console.log(`  Progress: ${Math.min(i + BATCH, total)}/${total} (${pct}%) — ${inserted} inserted, ${errors} errors`);
    }
  }

  // Verify
  const { count: after } = await sb.from('funding_opportunities').select('*', { count: 'exact', head: true });

  console.log('\n=== IMPORT COMPLETE ===');
  console.log(`  Records before: ${existingNames.size}`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Records after: ${after}`);
  console.log(`  Net new: ${after - existingNames.size}`);
}

main().catch(console.error);
