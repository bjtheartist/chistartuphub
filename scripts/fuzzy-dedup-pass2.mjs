#!/usr/bin/env node
/**
 * Fuzzy Deduplication Pass 2 - More aggressive normalization
 * Targets SEC EDGAR "a series of X Fund" patterns, AL Vehicle variants,
 * and other remaining near-duplicates.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjM1MjI2MiwiZXhwIjoyMDgxOTI4MjYyfQ.Tufg3bYjGhtiHLel6fKOKwOn07neoXn_G3iXGztdFkk';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const FIELDS = ['id', 'name', 'organization', 'description', 'opportunity_type', 'check_size_min', 'check_size_max', 'stage', 'sectors', 'website', 'chicago_focused'];

async function fetchAll() {
  const all = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('funding_opportunities')
      .select(FIELDS.join(','))
      .range(offset, offset + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    offset += 1000;
    if (offset % 10000 === 0) console.log(`  fetched ${offset}...`);
    if (data.length < 1000) break;
  }
  console.log(`Fetched ${all.length} total records.`);
  return all;
}

// More aggressive normalization
function baseName(name) {
  if (!name) return '';
  let s = name.toLowerCase().trim();

  // Remove "a series of ..." pattern (SEC EDGAR)
  s = s.replace(/,?\s*(a series of|a sub-series of)\s+.*/i, '');
  // Remove "AL Vehicle" prefix pattern like "XX-NNNN Fund N AL Vehicle"
  s = s.replace(/\bal\s+vehicle\b/gi, '');
  // Remove alphanumeric codes like "OR-0104", "DR-0130", "TA-0612", "RA-0314"
  s = s.replace(/^[A-Za-z]{2}-\d{4}\s+/g, '');

  // Remove "the " prefix
  s = s.replace(/^the\s+/i, '');

  // Remove fund identifiers
  s = s.replace(/\b(fund|series)\s+(i{1,4}|iv|v|vi{0,4}|ix|x|xi{0,3}|[a-h]|[0-9]+)\b/gi, '');

  // Remove common suffixes (expanded)
  s = s.replace(/\b(l\.?p\.?|l\.?l\.?c\.?|inc\.?|corp(oration)?|ltd\.?|limited|co\.?|company|partners(hip)?|fund|funds|investments?|capital\s*management|asset\s*management|management|group|holdings?|advisors?|advisory|ventures|capital|equity|opportunities|offshore|onshore|levered|unlevered|rated|feeder|parallel|co-invest(ment)?|blocker|cayman|master|domestic|international|global|europe|asia|americas?|us|uk)\b/gi, '');

  // Remove trailing roman numerals
  s = s.replace(/\s+(i{1,4}|iv|v|vi{0,4}|ix|x|xi{0,3})$/i, '');

  // Remove special chars
  s = s.replace(/[^a-z0-9\s]/g, '');
  // Remove trailing numbers
  s = s.replace(/\s+\d+\s*$/, '');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

function richnessScore(r) {
  let score = 0;
  if (r.description && r.description.trim().length > 10) score += 2;
  if (r.website && r.website.trim().length > 3) score += 3;
  if (r.stage && (Array.isArray(r.stage) ? r.stage.length > 0 : true)) score += 2;
  if (r.sectors && (Array.isArray(r.sectors) ? r.sectors.length > 0 : true)) score += 2;
  if (r.check_size_min != null || r.check_size_max != null) score += 2;
  if (r.chicago_focused === true) score += 1;
  if (r.opportunity_type) score += 1;
  if (r.organization && r.organization.trim().length > 0) score += 1;
  return score;
}

function nameQuality(name) {
  if (!name) return 0;
  const len = name.length;
  let q = 0;
  if (len > 80) q -= 3;
  else if (len > 50) q -= 1;
  if (name === name.toUpperCase() && len > 5) q -= 2;
  // Prefer names without "a series of"
  if (/a series of/i.test(name)) q -= 3;
  if (/AL Vehicle/i.test(name)) q -= 3;
  if (/^[A-Z]{2}-\d{4}/.test(name)) q -= 4;
  return q;
}

function mergeCluster(records) {
  records.sort((a, b) => {
    const sa = richnessScore(a) + nameQuality(a.name);
    const sb = richnessScore(b) + nameQuality(b.name);
    return sb - sa;
  });
  const best = { ...records[0] };
  const updates = {};
  for (let i = 1; i < records.length; i++) {
    const r = records[i];
    if ((!best.description || best.description.trim().length < 10) && r.description && r.description.trim().length >= 10) {
      best.description = r.description; updates.description = r.description;
    }
    if ((!best.website || best.website.trim().length < 3) && r.website && r.website.trim().length >= 3) {
      best.website = r.website; updates.website = r.website;
    }
    if (!best.stage && r.stage) { best.stage = r.stage; updates.stage = r.stage; }
    if (!best.sectors && r.sectors) { best.sectors = r.sectors; updates.sectors = r.sectors; }
    if (best.check_size_min == null && r.check_size_min != null) { best.check_size_min = r.check_size_min; updates.check_size_min = r.check_size_min; }
    if (best.check_size_max == null && r.check_size_max != null) { best.check_size_max = r.check_size_max; updates.check_size_max = r.check_size_max; }
    if (!best.organization && r.organization) { best.organization = r.organization; updates.organization = r.organization; }
    if (!best.opportunity_type && r.opportunity_type) { best.opportunity_type = r.opportunity_type; updates.opportunity_type = r.opportunity_type; }
    if (best.chicago_focused !== true && r.chicago_focused === true) { best.chicago_focused = true; updates.chicago_focused = true; }
  }
  return { bestId: best.id, updates, deleteIds: records.slice(1).map(r => r.id) };
}

async function main() {
  console.log('=== Fuzzy Dedup Pass 2 (Aggressive) ===\n');

  console.log('Fetching all records...');
  const records = await fetchAll();

  console.log('\nNormalizing and grouping...');
  const groups = new Map();
  for (const r of records) {
    const bn = baseName(r.name);
    if (!bn || bn.length < 3) continue;
    if (!groups.has(bn)) groups.set(bn, []);
    groups.get(bn).push(r);
  }

  const clusters = [];
  for (const [bn, recs] of groups) {
    if (recs.length >= 2) clusters.push(recs);
  }

  console.log(`Found ${clusters.length} duplicate clusters covering ${clusters.reduce((s, c) => s + c.length, 0)} records.`);

  // Show some example clusters for verification
  console.log('\nSample clusters:');
  let shown = 0;
  for (const c of clusters) {
    if (c.length >= 3 && shown < 10) {
      console.log(`  [${c.length}] ${c.map(r => r.name).slice(0, 4).join(' | ')}`);
      shown++;
    }
  }

  const allDeleteIds = [];
  const allUpdates = [];
  for (const cluster of clusters) {
    const { bestId, updates, deleteIds } = mergeCluster(cluster);
    allDeleteIds.push(...deleteIds);
    if (Object.keys(updates).length > 0) allUpdates.push({ id: bestId, updates });
  }

  console.log(`\nRecords to delete: ${allDeleteIds.length}`);
  console.log(`Records to update: ${allUpdates.length}`);

  // Apply updates
  console.log('\nApplying updates...');
  for (let i = 0; i < allUpdates.length; i += 50) {
    const batch = allUpdates.slice(i, i + 50);
    for (const { id, updates } of batch) {
      const { error } = await supabase.from('funding_opportunities').update(updates).eq('id', id);
      if (error) console.error(`  Update error ${id}:`, error.message);
    }
  }
  console.log(`  Updated ${allUpdates.length} records.`);

  // Delete duplicates
  console.log('\nDeleting duplicates...');
  let deleted = 0;
  for (let i = 0; i < allDeleteIds.length; i += 100) {
    const batch = allDeleteIds.slice(i, i + 100);
    const { error } = await supabase.from('funding_opportunities').delete().in('id', batch);
    if (error) console.error(`  Delete error:`, error.message);
    deleted += batch.length;
    if (deleted % 1000 === 0) console.log(`  deleted ${deleted}/${allDeleteIds.length}`);
  }
  console.log(`  Deleted ${deleted} records.`);

  // Also remove records with base name < 3 chars (missed junk)
  console.log('\nCleaning short/empty base names...');
  const junkIds = records
    .filter(r => {
      const bn = baseName(r.name);
      return !bn || bn.length < 3;
    })
    .map(r => r.id);

  // Don't double-delete
  const deleteSet = new Set(allDeleteIds);
  const extraJunk = junkIds.filter(id => !deleteSet.has(id));
  console.log(`  Extra junk records: ${extraJunk.length}`);

  for (let i = 0; i < extraJunk.length; i += 100) {
    const batch = extraJunk.slice(i, i + 100);
    const { error } = await supabase.from('funding_opportunities').delete().in('id', batch);
    if (error) console.error(`  Junk delete error:`, error.message);
  }

  // Final count
  const { count } = await supabase.from('funding_opportunities').select('*', { count: 'exact', head: true });

  console.log('\n=== PASS 2 COMPLETE ===');
  console.log(`Clusters:       ${clusters.length}`);
  console.log(`Deleted (dup):  ${deleted}`);
  console.log(`Deleted (junk): ${extraJunk.length}`);
  console.log(`Final DB count: ${count}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
