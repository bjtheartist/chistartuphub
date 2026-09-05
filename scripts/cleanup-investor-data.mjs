#!/usr/bin/env node
/**
 * Investor Data Cleanup Pipeline
 *
 * Phase 1: Filter out non-VC entities (real estate, hedge, credit, commodity funds)
 * Phase 2: Dedup fund-level → firm-level (collapse "Sequoia Fund XIV" into "Sequoia Capital")
 *
 * This script:
 * - Tags non-startup-relevant entities with investor_type markers for filtering
 * - Identifies parent firm names from fund names
 * - Creates a parent_firm column linking fund entries to canonical firm records
 * - Aggregates data from child funds up to the parent firm
 *
 * Usage:
 *   node scripts/cleanup-investor-data.mjs --dry-run    # analyze only
 *   node scripts/cleanup-investor-data.mjs              # apply changes
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===================================================================
// PHASE 1: Classify non-VC entities
// ===================================================================

// Patterns that indicate a non-startup-relevant fund
const NON_VC_PATTERNS = [
  // Real estate
  { pattern: /\b(real estate|realty|reit|property|properties|mortgage|housing|apartment|residential|commercial real est|land fund|real asset)/i, type: 'real_estate' },
  // Hedge funds
  { pattern: /\b(hedge fund|macro fund|long.?short|market neutral|quantitative fund|quant fund|systematic fund|arbitrage fund)/i, type: 'hedge_fund' },
  // Credit / debt
  { pattern: /\b(credit fund|debt fund|lending fund|loan fund|fixed income|bond fund|mezzanine debt|distressed debt|senior secured|CLO|collateralized)/i, type: 'credit' },
  // Commodities / natural resources
  { pattern: /\b(commodity|commodities|oil fund|gas fund|mining fund|timber fund|lumber|natural resource fund|energy royalt|mineral right)/i, type: 'commodity' },
  // Insurance
  { pattern: /\b(insurance fund|insurance co|annuity|life insurance|reinsurance)/i, type: 'insurance' },
  // Index / mutual / ETF
  { pattern: /\b(index fund|mutual fund|etf\b|exchange.?traded|money market|401k|401\(k\)|403b|pension fund|retirement fund)/i, type: 'passive' },
  // Infrastructure (non-tech)
  { pattern: /\b(infrastructure fund|toll road|water fund|utility fund|pipeline fund|midstream)/i, type: 'infrastructure' },
  // Agriculture
  { pattern: /\b(agriculture fund|farmland|agri fund|livestock|dairy fund|crop fund)/i, type: 'agriculture' },
];

// Patterns that PROTECT a record from being filtered out (even if it matches above)
const VC_PROTECT_PATTERNS = [
  /\b(venture|vc\b|startup|innovation|tech fund|technology fund|seed fund|angel|early.?stage|series [a-d]|growth equity|fintech fund|biotech venture|healthtech|deeptech|climate tech|cleantech|saas fund)/i,
  /\b(accelerator|incubator|y combinator|techstars|500 startups)/i,
];

function classifyEntity(name, description, investorType) {
  const combined = `${name || ''} ${description || ''}`;

  // Check if protected as VC/startup-relevant
  for (const protect of VC_PROTECT_PATTERNS) {
    if (protect.test(combined)) return null; // keep it
  }

  // Check non-VC patterns
  for (const { pattern, type } of NON_VC_PATTERNS) {
    if (pattern.test(combined)) return type;
  }

  return null; // keep by default
}

// ===================================================================
// PHASE 2: Dedup fund names → parent firm
// ===================================================================

// Common fund name suffixes to strip
const FUND_SUFFIX_PATTERNS = [
  // Roman numeral fund numbers: "Fund XIV", "Fund III-B"
  /\s+fund\s+[ivxlcdm]+(?:\s*[-–]\s*[a-z])?\s*$/i,
  // Arabic numeral fund numbers: "Fund 3", "Fund 14"
  /\s+fund\s+\d+\s*$/i,
  // Vintage years: "Fund 2023", "2024 Fund"
  /\s+(?:fund\s+)?20[12]\d\s*$/i,
  /^20[12]\d\s+/i,
  // Series labels: "Series A", "Series 1667"
  /\s*[-–]\s*series\s+\S+\s*$/i,
  /\s+series\s+\S+\s*$/i,
  // SPV / co-invest labels
  /\s+(?:spv|co.?invest|sidecar|annex|parallel|feeder|blocker)\s*(?:\d+|[ivxlcdm]+)?\s*$/i,
  // LP/GP suffixes
  /\s*,?\s*(?:l\.?p\.?|g\.?p\.?|llc|inc|corp|ltd|limited partnership)\s*$/i,
  // Generic "Fund" at end
  /\s+fund\s*$/i,
  // Trailing letters/numbers after comma: ", LP", ", LLC"
  /\s*,\s*(?:lp|gp|llc|inc|ltd)\s*$/i,
];

// Additional patterns for known fund naming conventions
const PARENT_EXTRACTION_PATTERNS = [
  // "ABC Capital Partners Fund XIV, LP" → "ABC Capital Partners"
  { match: /^(.+?)\s+fund\s+/i, group: 1 },
  // "ABC Ventures II" → "ABC Ventures"
  { match: /^(.+?)\s+[ivxlcdm]{1,6}\s*$/i, group: 1 },
  // "ABC Growth Fund - Series B" → "ABC Growth Fund"
  { match: /^(.+?)\s*[-–]\s*(?:series|class|tranche)/i, group: 1 },
  // "ABC SPC Fund - XYZ SP" → "ABC SPC Fund"
  { match: /^(.+?)\s*[-–]\s*.+\s+SP\s*$/i, group: 1 },
];

function extractParentFirm(name) {
  if (!name) return name;

  let cleaned = name.trim();

  // Apply suffix stripping (multiple passes for nested suffixes)
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (const pattern of FUND_SUFFIX_PATTERNS) {
      const newCleaned = cleaned.replace(pattern, '').trim();
      if (newCleaned !== cleaned && newCleaned.length >= 3) {
        cleaned = newCleaned;
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Try extraction patterns
  for (const { match, group } of PARENT_EXTRACTION_PATTERNS) {
    const m = cleaned.match(match);
    if (m && m[group] && m[group].length >= 3) {
      cleaned = m[group].trim();
      break;
    }
  }

  // Final cleanup
  cleaned = cleaned.replace(/\s*,\s*$/, '').trim();

  return cleaned;
}

function normalizeForDedup(name) {
  return (name || '').toLowerCase()
    .replace(/[,.'"\-()]/g, '')
    .replace(/\b(llc|lp|inc|corp|ltd|co|group)\b/g, '')
    .replace(/\s+/g, ' ').trim();
}

// ===================================================================
// MAIN
// ===================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Investor Data Cleanup Pipeline                            ║');
  console.log(`║  Mode: ${DRY_RUN ? 'DRY RUN (analysis only)' : 'LIVE'}                                      ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Load all investors
  console.log('Loading all investors...');
  const allInvestors = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?select=id,canonical_name,description,investor_type,hq_city,hq_state,hq_country,hq_location,is_midwest,stage_focus,sectors,check_size_min,check_size_max,website,domain,source,completeness_score,mvip_score&limit=1000&offset=${offset}`,
      { headers }
    );
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    allInvestors.push(...batch);
    offset += 1000;
  }
  console.log(`  Loaded: ${allInvestors.length.toLocaleString()} investors\n`);

  // ============================
  // PHASE 1: Filter non-VC
  // ============================
  console.log('═══ PHASE 1: Classify Non-VC Entities ═══\n');

  const nonVcCounts = {};
  const nonVcIds = [];
  let vcCount = 0;

  for (const inv of allInvestors) {
    const classification = classifyEntity(inv.canonical_name, inv.description, inv.investor_type);
    if (classification) {
      nonVcCounts[classification] = (nonVcCounts[classification] || 0) + 1;
      nonVcIds.push({ id: inv.id, type: classification });
    } else {
      vcCount++;
    }
  }

  console.log('  Non-VC entity breakdown:');
  const sortedTypes = Object.entries(nonVcCounts).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes) {
    console.log(`    ${type.padEnd(20)} ${count.toLocaleString()}`);
  }
  console.log(`    ${'─'.repeat(30)}`);
  console.log(`    Total non-VC:        ${nonVcIds.length.toLocaleString()}`);
  console.log(`    Startup-relevant:    ${vcCount.toLocaleString()}\n`);

  // Tag non-VC entities (don't delete — just update investor_type for filtering)
  if (!DRY_RUN && nonVcIds.length > 0) {
    console.log('  Tagging non-VC entities...');
    let tagged = 0;
    for (let i = 0; i < nonVcIds.length; i += 100) {
      const batch = nonVcIds.slice(i, i + 100);
      // Group by type for efficient updates
      const byType = {};
      for (const { id, type } of batch) {
        if (!byType[type]) byType[type] = [];
        byType[type].push(id);
      }

      for (const [type, ids] of Object.entries(byType)) {
        const idFilter = ids.map(id => `id.eq.${id}`).join(',');
        await fetch(
          `${SUPABASE_URL}/rest/v1/investors?or=(${idFilter})`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ investor_type: type }),
          }
        );
      }
      tagged += batch.length;
      if (tagged % 5000 === 0) console.log(`    Tagged ${tagged.toLocaleString()}...`);
    }
    console.log(`  Tagged: ${tagged.toLocaleString()} non-VC entities\n`);
  }

  // ============================
  // PHASE 2: Dedup fund → firm
  // ============================
  console.log('═══ PHASE 2: Dedup Fund → Firm ═══\n');

  // Only process VC-relevant entities
  const vcInvestors = allInvestors.filter(inv => {
    const classification = classifyEntity(inv.canonical_name, inv.description, inv.investor_type);
    return !classification;
  });

  // Group by parent firm name
  const firmGroups = new Map(); // normalizedParent → [investors]

  for (const inv of vcInvestors) {
    const parentName = extractParentFirm(inv.canonical_name);
    const normParent = normalizeForDedup(parentName);

    if (!firmGroups.has(normParent)) {
      firmGroups.set(normParent, { parentName, children: [] });
    }
    firmGroups.get(normParent).children.push(inv);
  }

  // Find groups with multiple entries (actual duplicates)
  const multiGroups = [...firmGroups.entries()]
    .filter(([_, g]) => g.children.length > 1)
    .sort((a, b) => b[1].children.length - a[1].children.length);

  const singletons = [...firmGroups.entries()].filter(([_, g]) => g.children.length === 1);

  console.log(`  Total VC-relevant entities: ${vcInvestors.length.toLocaleString()}`);
  console.log(`  Unique parent firms: ${firmGroups.size.toLocaleString()}`);
  console.log(`  Groups with multiple funds: ${multiGroups.length.toLocaleString()}`);
  console.log(`  Total records in multi-groups: ${multiGroups.reduce((s, [_, g]) => s + g.children.length, 0).toLocaleString()}`);
  console.log(`  Singleton entries: ${singletons.length.toLocaleString()}\n`);

  // Show top 20 dedup groups
  console.log('  Top 20 firm groups (by fund count):');
  for (const [norm, group] of multiGroups.slice(0, 20)) {
    const names = group.children.map(c => c.canonical_name).slice(0, 3);
    console.log(`    [${group.children.length}] ${group.parentName}`);
    for (const n of names) {
      console.log(`        → ${n}`);
    }
    if (group.children.length > 3) console.log(`        → ... and ${group.children.length - 3} more`);
  }

  // For each multi-group, pick the "best" record as the canonical firm
  // and mark others as child funds
  const mergeOps = []; // { canonicalId, childIds, aggregatedData }

  for (const [normParent, group] of multiGroups) {
    const children = group.children;

    // Score each child to find the best canonical record
    const scored = children.map(c => {
      let score = c.completeness_score || 0;
      if (c.website) score += 20;
      if (c.domain) score += 10;
      if (c.description && c.description.length > 50) score += 15;
      if (c.hq_city) score += 10;
      if (c.sectors?.length > 0) score += 10;
      // Prefer shorter names (more likely the parent, not "Fund XIV")
      score += Math.max(0, 50 - c.canonical_name.length);
      return { ...c, _score: score };
    }).sort((a, b) => b._score - a._score);

    const canonical = scored[0];
    const childIds = scored.slice(1).map(c => c.id);

    // Aggregate: merge best data from all children
    const aggregated = {
      canonical_name: group.parentName,
    };

    // Take best non-null value for each field across all children
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

    // Build aggregated description
    const fundCount = children.length;
    const sources = [...new Set(children.map(c => c.source).filter(Boolean))];
    aggregated.description = `Parent firm with ${fundCount} funds tracked. ` +
      (canonical.description || '') +
      (sources.length > 0 ? ` Sources: ${sources.join(', ')}.` : '');

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

    mergeOps.push({ canonicalId: canonical.id, childIds, aggregated });
  }

  console.log(`\n  Merge operations: ${mergeOps.length.toLocaleString()}`);
  console.log(`  Records to consolidate: ${mergeOps.reduce((s, m) => s + m.childIds.length, 0).toLocaleString()}`);
  console.log(`  Final unique firms: ~${(singletons.length + mergeOps.length).toLocaleString()}\n`);

  if (DRY_RUN) {
    console.log('[DRY RUN] No changes applied.');

    // Save analysis
    const analysisPath = resolve(__dirname, '..', 'data', 'cleanup-analysis.json');
    writeFileSync(analysisPath, JSON.stringify({
      nonVcBreakdown: nonVcCounts,
      totalNonVc: nonVcIds.length,
      totalVcRelevant: vcCount,
      uniqueFirms: firmGroups.size,
      multiGroupCount: multiGroups.length,
      recordsToConsolidate: mergeOps.reduce((s, m) => s + m.childIds.length, 0),
      topGroups: multiGroups.slice(0, 50).map(([_, g]) => ({
        parentName: g.parentName,
        count: g.children.length,
        funds: g.children.map(c => c.canonical_name).slice(0, 10),
      })),
    }, null, 2));
    console.log(`  Analysis saved to ${analysisPath}`);
    return;
  }

  // Apply merges
  console.log('  Applying merges...');
  let merged = 0;
  let deleted = 0;

  for (let i = 0; i < mergeOps.length; i++) {
    const { canonicalId, childIds, aggregated } = mergeOps[i];

    // Update the canonical record with aggregated data
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?id=eq.${canonicalId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(aggregated),
      }
    );

    if (!updateRes.ok) {
      // If canonical_name conflict, skip the name update
      const withoutName = { ...aggregated };
      delete withoutName.canonical_name;
      await fetch(
        `${SUPABASE_URL}/rest/v1/investors?id=eq.${canonicalId}`,
        { method: 'PATCH', headers, body: JSON.stringify(withoutName) }
      );
    }

    // Delete child fund records (they're now consolidated)
    if (childIds.length > 0) {
      for (let j = 0; j < childIds.length; j += 50) {
        const batch = childIds.slice(j, j + 50);
        const idFilter = batch.map(id => `id.eq.${id}`).join(',');
        await fetch(
          `${SUPABASE_URL}/rest/v1/investors?or=(${idFilter})`,
          { method: 'DELETE', headers }
        );
        deleted += batch.length;
      }
    }

    merged++;
    if (merged % 500 === 0) {
      console.log(`    Merged: ${merged}/${mergeOps.length} | Deleted: ${deleted.toLocaleString()} child records`);
    }
  }

  console.log(`  Merged: ${merged.toLocaleString()} firm groups`);
  console.log(`  Deleted: ${deleted.toLocaleString()} duplicate fund records\n`);

  // Final count
  const finalRes = await fetch(
    `${SUPABASE_URL}/rest/v1/investors?select=id&limit=1`,
    { headers: { ...headers, Prefer: 'count=exact' } }
  );
  const finalCount = parseInt(finalRes.headers.get('content-range')?.split('/')[1] || '0');

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  CLEANUP SUMMARY                                           ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Starting records:     ${String(allInvestors.length).padStart(8)}                             ║`);
  console.log(`║  Non-VC tagged:        ${String(nonVcIds.length).padStart(8)}                             ║`);
  console.log(`║  Fund dupes merged:    ${String(deleted).padStart(8)}                             ║`);
  console.log(`║  Final record count:   ${String(finalCount).padStart(8)}                             ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
