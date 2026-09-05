#!/usr/bin/env node
/**
 * Fuzzy Deduplication for funding_opportunities table
 * Normalizes names, groups duplicates, merges best data, deletes extras.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjM1MjI2MiwiZXhwIjoyMDgxOTI4MjYyfQ.Tufg3bYjGhtiHLel6fKOKwOn07neoXn_G3iXGztdFkk';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const FIELDS = ['id', 'name', 'organization', 'description', 'opportunity_type', 'check_size_min', 'check_size_max', 'stage', 'sectors', 'website', 'chicago_focused'];

// ─── Phase 0: Fetch all records ───────────────────────────────────────────────

async function fetchAll() {
  const all = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('funding_opportunities')
      .select(FIELDS.join(','))
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    offset += PAGE;
    if (offset % 10000 === 0) console.log(`  fetched ${offset} records...`);
    if (data.length < PAGE) break;
  }
  console.log(`Fetched ${all.length} total records.`);
  return all;
}

// ─── Phase 1: Normalize names ─────────────────────────────────────────────────

const SUFFIX_RE = /\b(l\.?p\.?|l\.?l\.?c\.?|inc\.?|corp(oration)?|ltd\.?|limited|co\.?|company|partners(hip)?|fund|investments?|capital\s*management|asset\s*management|management|group|holdings?|advisors?|advisory)\b/gi;

const FUND_ID_RE = /\b(fund|series)\s+(i{1,4}|iv|v|vi{0,4}|ix|x|xi{0,3}|[a-h]|[0-9]+)\b/gi;

const ROMAN_TRAIL_RE = /\s+(i{1,4}|iv|v|vi{0,4}|ix|x|xi{0,3})$/i;

const GENERIC_NAMES = new Set(['fund', 'capital', 'ventures', 'investment', 'investments', 'the', 'partners', 'group', 'management', 'holdings', '']);

function baseName(name) {
  if (!name) return '';
  let s = name.toLowerCase().trim();
  // Remove "the " prefix
  s = s.replace(/^the\s+/i, '');
  // Remove fund identifiers (Fund I, Series A, etc.)
  s = s.replace(FUND_ID_RE, '');
  // Remove common suffixes
  s = s.replace(SUFFIX_RE, '');
  // Remove trailing roman numerals
  s = s.replace(ROMAN_TRAIL_RE, '');
  // Remove special chars except spaces and alphanumerics
  s = s.replace(/[^a-z0-9\s]/g, '');
  // Remove trailing numbers
  s = s.replace(/\s+\d+\s*$/, '');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

// ─── Jaccard token similarity ─────────────────────────────────────────────────

function jaccard(a, b) {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

// ─── Phase 2: Score records ───────────────────────────────────────────────────

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
  // Prefer shorter, cleaner names. Penalize very long SEC-style names.
  const len = name.length;
  if (len > 80) return -2;
  if (len > 50) return -1;
  // Penalize all-caps
  if (name === name.toUpperCase() && name.length > 5) return -1;
  return 1;
}

// ─── Phase 3: Merge clusters ─────────────────────────────────────────────────

function mergeCluster(records) {
  // Sort by richness score desc, then name quality desc
  records.sort((a, b) => {
    const sa = richnessScore(a) + nameQuality(a.name);
    const sb = richnessScore(b) + nameQuality(b.name);
    return sb - sa;
  });

  const best = { ...records[0] };
  const updates = {};

  // Backfill missing fields from other records
  for (let i = 1; i < records.length; i++) {
    const r = records[i];
    if ((!best.description || best.description.trim().length < 10) && r.description && r.description.trim().length >= 10) {
      best.description = r.description;
      updates.description = r.description;
    }
    if ((!best.website || best.website.trim().length < 3) && r.website && r.website.trim().length >= 3) {
      best.website = r.website;
      updates.website = r.website;
    }
    if (!best.stage && r.stage) {
      best.stage = r.stage;
      updates.stage = r.stage;
    }
    if (!best.sectors && r.sectors) {
      best.sectors = r.sectors;
      updates.sectors = r.sectors;
    }
    if (best.check_size_min == null && r.check_size_min != null) {
      best.check_size_min = r.check_size_min;
      updates.check_size_min = r.check_size_min;
    }
    if (best.check_size_max == null && r.check_size_max != null) {
      best.check_size_max = r.check_size_max;
      updates.check_size_max = r.check_size_max;
    }
    if (!best.organization && r.organization) {
      best.organization = r.organization;
      updates.organization = r.organization;
    }
    if (!best.opportunity_type && r.opportunity_type) {
      best.opportunity_type = r.opportunity_type;
      updates.opportunity_type = r.opportunity_type;
    }
    if (best.chicago_focused !== true && r.chicago_focused === true) {
      best.chicago_focused = true;
      updates.chicago_focused = true;
    }
  }

  const deleteIds = records.slice(1).map(r => r.id);
  return { bestId: best.id, updates, deleteIds };
}

// ─── Phase 4: Junk cleanup ───────────────────────────────────────────────────

function isJunkRecord(r) {
  const name = (r.name || '').trim();
  if (name.length < 3) return true;
  const lower = name.toLowerCase();
  if (GENERIC_NAMES.has(lower)) return true;
  // Pure numbers or codes
  if (/^[0-9\s\-\.]+$/.test(name)) return true;
  return false;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Fuzzy Deduplication of funding_opportunities ===\n');

  // Phase 0
  console.log('Phase 0: Fetching all records...');
  const records = await fetchAll();

  // Phase 1: Normalize and group
  console.log('\nPhase 1: Normalizing names and grouping...');
  const groups = new Map(); // baseName -> [records]
  for (const r of records) {
    const bn = baseName(r.name);
    if (!bn) continue;
    if (!groups.has(bn)) groups.set(bn, []);
    groups.get(bn).push(r);
  }

  // Filter to clusters (2+ records with same base name)
  const clusters = [];
  for (const [bn, recs] of groups) {
    if (recs.length < 2) continue;
    // Apply Jaccard similarity check: only keep records similar enough to the first
    const anchor = recs[0].name || '';
    const similar = [recs[0]];
    for (let i = 1; i < recs.length; i++) {
      const sim = jaccard(anchor, recs[i].name || '');
      // Also check base-name exact match (which already groups them)
      // Use lower threshold since base names already match
      if (sim >= 0.3 || baseName(recs[i].name) === baseName(anchor)) {
        similar.push(recs[i]);
      }
    }
    if (similar.length >= 2) {
      clusters.push(similar);
    }
  }

  console.log(`Found ${clusters.length} duplicate clusters covering ${clusters.reduce((s, c) => s + c.length, 0)} records.`);

  // Phase 2: Score and merge
  console.log('\nPhase 2: Computing merges...');
  const allDeleteIds = [];
  const allUpdates = []; // { id, updates }

  for (const cluster of clusters) {
    const { bestId, updates, deleteIds } = mergeCluster(cluster);
    allDeleteIds.push(...deleteIds);
    if (Object.keys(updates).length > 0) {
      allUpdates.push({ id: bestId, updates });
    }
  }

  console.log(`Records to delete (duplicates): ${allDeleteIds.length}`);
  console.log(`Records to update (backfill):   ${allUpdates.length}`);

  // Phase 3: Apply updates
  console.log('\nPhase 3: Applying updates...');
  let updateCount = 0;
  for (let i = 0; i < allUpdates.length; i += 50) {
    const batch = allUpdates.slice(i, i + 50);
    for (const { id, updates } of batch) {
      const { error } = await supabase
        .from('funding_opportunities')
        .update(updates)
        .eq('id', id);
      if (error) console.error(`  Update error for ${id}:`, error.message);
    }
    updateCount += batch.length;
    if (updateCount % 500 === 0) console.log(`  updated ${updateCount}/${allUpdates.length}`);
  }
  console.log(`  Updated ${updateCount} records.`);

  // Delete duplicates
  console.log('\nDeleting duplicates...');
  let deleteCount = 0;
  for (let i = 0; i < allDeleteIds.length; i += 100) {
    const batch = allDeleteIds.slice(i, i + 100);
    const { error } = await supabase
      .from('funding_opportunities')
      .delete()
      .in('id', batch);
    if (error) console.error(`  Delete error:`, error.message);
    deleteCount += batch.length;
    if (deleteCount % 1000 === 0) console.log(`  deleted ${deleteCount}/${allDeleteIds.length}`);
  }
  console.log(`  Deleted ${deleteCount} duplicate records.`);

  // Phase 4: Junk cleanup
  console.log('\nPhase 4: Cleaning up junk records...');
  // Re-fetch remaining to check for junk
  const remaining = await fetchAll();
  const junkIds = remaining.filter(isJunkRecord).map(r => r.id);
  console.log(`Found ${junkIds.length} junk records to remove.`);

  let junkDeleted = 0;
  for (let i = 0; i < junkIds.length; i += 100) {
    const batch = junkIds.slice(i, i + 100);
    const { error } = await supabase
      .from('funding_opportunities')
      .delete()
      .in('id', batch);
    if (error) console.error(`  Junk delete error:`, error.message);
    junkDeleted += batch.length;
  }
  console.log(`  Deleted ${junkDeleted} junk records.`);

  // Final count
  const { count, error: countErr } = await supabase
    .from('funding_opportunities')
    .select('*', { count: 'exact', head: true });
  if (countErr) console.error('Count error:', countErr.message);

  console.log('\n=== DEDUP COMPLETE ===');
  console.log(`Clusters found:      ${clusters.length}`);
  console.log(`Duplicates deleted:  ${deleteCount}`);
  console.log(`Junk deleted:        ${junkDeleted}`);
  console.log(`Total deleted:       ${deleteCount + junkDeleted}`);
  console.log(`Final DB count:      ${count}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
