#!/usr/bin/env node
/**
 * Second-pass dedup: More aggressive parent extraction.
 * Handles cases like Sequoia Capital China Growth VII → Sequoia Capital
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

const DRY_RUN = process.argv.includes('--dry-run');

function extractParentAggressive(name) {
  if (!name) return name;
  let c = name.trim();

  // Strip legal suffixes
  c = c.replace(/\s*,?\s*(?:L\.?P\.?|G\.?P\.?|LLC|Inc\.?|Corp\.?|Ltd\.?|Limited Partnership|Limited|PBC)\s*$/gi, '').trim();

  // Strip everything after 'Fund' keyword (most aggressive — removes "Fund XIV, LP" etc)
  c = c.replace(/\s+Fund\b.*$/i, '').trim();

  // Strip SPV/Series/Class/Tranche labels
  c = c.replace(/\s*[-–]\s*(?:Series|Class|Tranche)\b.*$/i, '').trim();
  c = c.replace(/\s+(?:SPV|Sidecar|Co-?Invest|Annex|Parallel|Feeder|Blocker|Sub-?Fund)\b.*$/i, '').trim();

  // Strip trailing Roman numerals (I, II, III, IV, V, VI, VII, VIII, IX, X, etc)
  c = c.replace(/\s+[IVXLCDM]{1,8}\s*$/g, '').trim();
  // Strip trailing Arabic numbers
  c = c.replace(/\s+\d{1,4}\s*$/g, '').trim();
  // Strip vintage years
  c = c.replace(/\s+20[012]\d\s*$/g, '').trim();

  // Strip 'Principals' suffix
  c = c.replace(/\s+Principals?\s*$/i, '').trim();

  // Strip regional/strategy qualifiers that come after the core brand
  // e.g., "Sequoia Capital China Growth" → "Sequoia Capital"
  // "Sequoia Capital U.S. Venture" → "Sequoia Capital"
  // Be careful: only strip if we recognize the pattern
  const REGIONAL_STRATEGY = /\s+(?:China|India|Asia|Europe|Japan|Korea|LATAM|Brazil|Israel|Africa|Southeast Asia|U\.?S\.?|US\/E|Global|International|North America|Americas)\b.*$/i;
  const withoutRegion = c.replace(REGIONAL_STRATEGY, '').trim();
  if (withoutRegion.length >= 5) c = withoutRegion;

  const STRATEGY_SUFFIX = /\s+(?:Growth|Venture|Seed|Early Stage|Late Stage|Opportunity|Opportunities|Select|Access|Discovery|Innovation|Partners|Continuation|Technology|Healthcare|Energy|Climate|Impact|Flagship|Core|Alpha|Beta|Omega|Scout|Acceleration|Expansion|Credit|Debt|Real Estate|Infrastructure)\s*$/i;
  // Apply strategy stripping repeatedly
  for (let i = 0; i < 3; i++) {
    const prev = c;
    c = c.replace(STRATEGY_SUFFIX, '').trim();
    if (c === prev) break;
  }

  // Strip trailing comma/period
  c = c.replace(/\s*[,.]$/, '').trim();

  // Don't return if too short (< 3 chars)
  if (c.length < 3) return name.trim();

  return c;
}

function normalizeForGroup(name) {
  return (name || '').toLowerCase()
    .replace(/[,.'"\-()&]/g, '')
    .replace(/\b(llc|lp|inc|corp|ltd|co|the)\b/g, '')
    .replace(/\s+/g, ' ').trim();
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Dedup Pass 2: Aggressive Parent Firm Extraction           ║');
  console.log(`║  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}                                                    ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Load all VC investors
  console.log('Loading VC investors...');
  const all = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?select=id,canonical_name,description,investor_type,website,domain,hq_city,hq_state,hq_country,hq_location,is_midwest,stage_focus,sectors,check_size_min,check_size_max,source,completeness_score&investor_type=eq.vc&limit=1000&offset=${offset}`,
      { headers }
    );
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    offset += 1000;
  }
  console.log(`  Loaded: ${all.length.toLocaleString()} VC investors\n`);

  // Group by aggressively extracted parent
  const groups = new Map();
  for (const inv of all) {
    const parent = extractParentAggressive(inv.canonical_name);
    const norm = normalizeForGroup(parent);
    if (!groups.has(norm)) groups.set(norm, { parentName: parent, children: [] });
    groups.get(norm).children.push(inv);
  }

  // Generic names that should NOT be merged (too ambiguous)
  const GENERIC_NAMES = new Set([
    'hedge', 'crown', 'access', 'strategic', 'summit', 'advent', 'avenue',
    'unity', 'alter', 'logos', 'north haven', 'element', 'elementum',
    'acadian', 'frontier', 'atlas', 'horizon', 'bridge', 'lighthouse',
    'vanguard', 'pioneer', 'apex', 'prime', 'genesis', 'alpha', 'omega',
    'catalyst', 'nexus', 'pinnacle', 'sterling', 'patriot', 'liberty',
    'heritage', 'legacy', 'guardian', 'sentinel', 'eagle', 'falcon',
    'new', 'first', 'global', 'american', 'national', 'pacific',
    'atlantic', 'western', 'eastern', 'northern', 'southern',
    'forefront', 'ninety one', 'blue owl', 'asana', 'invesco',
  ]);

  // Find multi-entry groups, excluding generic parent names
  const multiGroups = [...groups.entries()]
    .filter(([norm, g]) => g.children.length > 1 && !GENERIC_NAMES.has(norm) && norm.length >= 4)
    .sort((a, b) => b[1].children.length - a[1].children.length);

  const singletons = [...groups.entries()].filter(([_, g]) => g.children.length === 1);
  const totalInMulti = multiGroups.reduce((s, [_, g]) => s + g.children.length, 0);
  const toRemove = totalInMulti - multiGroups.length;

  console.log(`  Unique parent firms: ${groups.size.toLocaleString()}`);
  console.log(`  Groups with multiple entries: ${multiGroups.length.toLocaleString()}`);
  console.log(`  Records in multi-groups: ${totalInMulti.toLocaleString()}`);
  console.log(`  Records to remove: ${toRemove.toLocaleString()}`);
  console.log(`  Projected final VC count: ${(singletons.length + multiGroups.length).toLocaleString()}\n`);

  // Show top 50
  console.log('Top 50 groups:');
  for (const [norm, group] of multiGroups.slice(0, 50)) {
    const names = group.children.map(c => c.canonical_name).slice(0, 5);
    console.log(`  [${group.children.length}] ${group.parentName}`);
    for (const n of names) console.log(`      → ${n}`);
    if (group.children.length > 5) console.log(`      → ... and ${group.children.length - 5} more`);
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] No changes applied.');
    return;
  }

  // Apply merges
  console.log('\nApplying merges...');
  let merged = 0;
  let deleted = 0;
  let errors = 0;

  for (let i = 0; i < multiGroups.length; i++) {
    const [normParent, group] = multiGroups[i];
    const children = group.children;

    // Score each to find best canonical record
    const scored = children.map(c => {
      let score = c.completeness_score || 0;
      if (c.website) score += 20;
      if (c.domain) score += 10;
      if (c.description && c.description.length > 50) score += 15;
      if (c.hq_city) score += 10;
      if (c.sectors?.length > 0) score += 10;
      // Prefer shorter names (more likely the clean parent)
      score += Math.max(0, 50 - c.canonical_name.length);
      return { ...c, _score: score };
    }).sort((a, b) => b._score - a._score);

    const canonical = scored[0];
    const childIds = scored.slice(1).map(c => c.id);

    // Aggregate best data from all children
    const aggregated = {
      canonical_name: group.parentName,
    };

    for (const child of children) {
      if (!aggregated.website && child.website) aggregated.website = child.website;
      if (!aggregated.domain && child.domain) aggregated.domain = child.domain;
      if (!aggregated.hq_city && child.hq_city) aggregated.hq_city = child.hq_city;
      if (!aggregated.hq_state && child.hq_state) aggregated.hq_state = child.hq_state;
      if (!aggregated.hq_country && child.hq_country) aggregated.hq_country = child.hq_country;
      if (!aggregated.hq_location && child.hq_location) aggregated.hq_location = child.hq_location;
      if (!aggregated.is_midwest && child.is_midwest) aggregated.is_midwest = true;
      if (!aggregated.stage_focus && child.stage_focus) aggregated.stage_focus = child.stage_focus;
      if (!aggregated.sectors && child.sectors?.length > 0) aggregated.sectors = child.sectors;
      if (child.check_size_min && (!aggregated.check_size_min || child.check_size_min < aggregated.check_size_min)) {
        aggregated.check_size_min = child.check_size_min;
      }
      if (child.check_size_max && (!aggregated.check_size_max || child.check_size_max > aggregated.check_size_max)) {
        aggregated.check_size_max = child.check_size_max;
      }
    }

    // Description
    const fundCount = children.length;
    aggregated.description = `Parent firm with ${fundCount} funds/vehicles tracked. ` + (canonical.description || '');

    // Recompute completeness
    let cs = 10;
    if (aggregated.website) cs += 15;
    if (aggregated.hq_city) cs += 15;
    if (aggregated.hq_state) cs += 10;
    if (aggregated.description?.length > 30) cs += 15;
    if (aggregated.sectors?.length > 0) cs += 10;
    if (aggregated.stage_focus) cs += 10;
    if (aggregated.check_size_min) cs += 10;
    aggregated.completeness_score = Math.min(cs, 100);

    // Update canonical record
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?id=eq.${canonical.id}`,
      { method: 'PATCH', headers, body: JSON.stringify(aggregated) }
    );

    if (!updateRes.ok) {
      // If name conflict, skip name update
      const withoutName = { ...aggregated };
      delete withoutName.canonical_name;
      await fetch(
        `${SUPABASE_URL}/rest/v1/investors?id=eq.${canonical.id}`,
        { method: 'PATCH', headers, body: JSON.stringify(withoutName) }
      );
    }

    // Delete child records
    if (childIds.length > 0) {
      for (let j = 0; j < childIds.length; j += 50) {
        const batch = childIds.slice(j, j + 50);
        const idFilter = batch.map(id => `id.eq.${id}`).join(',');
        const delRes = await fetch(
          `${SUPABASE_URL}/rest/v1/investors?or=(${idFilter})`,
          { method: 'DELETE', headers }
        );
        if (delRes.ok) deleted += batch.length;
        else errors++;
      }
    }

    merged++;
    if (merged % 500 === 0) {
      console.log(`  Merged: ${merged}/${multiGroups.length} | Deleted: ${deleted.toLocaleString()} | Errors: ${errors}`);
    }
  }

  // Final count
  const finalRes = await fetch(
    `${SUPABASE_URL}/rest/v1/investors?select=id&limit=1`,
    { headers: { ...headers, Prefer: 'count=exact' } }
  );
  const finalCount = parseInt(finalRes.headers.get('content-range')?.split('/')[1] || '0');

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  DEDUP PASS 2 SUMMARY                                      ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Starting VC records:   ${String(all.length).padStart(8)}                              ║`);
  console.log(`║  Groups merged:         ${String(merged).padStart(8)}                              ║`);
  console.log(`║  Child records deleted:  ${String(deleted).padStart(8)}                             ║`);
  console.log(`║  Errors:                ${String(errors).padStart(8)}                              ║`);
  console.log(`║  Final total (all):     ${String(finalCount).padStart(8)}                              ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
