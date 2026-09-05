#!/usr/bin/env node
/**
 * SEC EDGAR Investment Adviser Data Harvester
 *
 * Searches SEC EDGAR full-text search index for venture capital,
 * private equity, and angel investment firms across Midwest states.
 * Extracts firm names, locations, and CIK numbers from filing data.
 *
 * Writes to investor_enrichment_staging via shared harvester utils.
 */

import { insertToStaging, fetchWithRetry, sleep, supabase, getExistingNames, isDuplicate, normalizeName } from './harvester-utils.mjs';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEC_USER_AGENT = 'ChiStartupHub/1.0 (billyjoseph243@gmail.com)';
const EDGAR_SEARCH_URL = 'https://efts.sec.gov/LATEST/search-index';

// Midwest + key surrounding states
const MIDWEST_STATES = new Set(['IL', 'IN', 'MI', 'OH', 'WI', 'MN', 'MO', 'IA']);
const ALL_TARGET_STATES = new Set([...MIDWEST_STATES, 'NY', 'CA', 'MA', 'TX', 'CO', 'FL', 'PA', 'CT', 'GA', 'NC', 'VA', 'DC']);

// Search queries to run
const SEARCH_QUERIES = [
  // Midwest-specific searches (higher priority)
  { q: '"venture capital" "illinois"', label: 'VC + Illinois' },
  { q: '"venture capital" "chicago"', label: 'VC + Chicago' },
  { q: '"private equity" "chicago"', label: 'PE + Chicago' },
  { q: '"angel" "investment" "illinois"', label: 'Angel + Illinois' },
  { q: '"venture capital" "indiana"', label: 'VC + Indiana' },
  { q: '"venture capital" "michigan"', label: 'VC + Michigan' },
  { q: '"venture capital" "ohio"', label: 'VC + Ohio' },
  { q: '"venture capital" "wisconsin"', label: 'VC + Wisconsin' },
  { q: '"venture capital" "minnesota"', label: 'VC + Minnesota' },
  { q: '"venture capital" "missouri"', label: 'VC + Missouri' },
  { q: '"private equity" "illinois"', label: 'PE + Illinois' },
  { q: '"private equity" "indiana"', label: 'PE + Indiana' },
  { q: '"private equity" "michigan"', label: 'PE + Michigan' },
  { q: '"private equity" "ohio"', label: 'PE + Ohio' },
  { q: '"private equity" "minnesota"', label: 'PE + Minnesota' },
  { q: '"investment fund" "chicago"', label: 'Fund + Chicago' },
  { q: '"seed fund" "illinois"', label: 'Seed + Illinois' },
  { q: '"startup" "venture" "chicago"', label: 'Startup Venture + Chicago' },
  { q: '"startup" "venture" "midwest"', label: 'Startup Venture + Midwest' },
  // Broader searches (will filter by state)
  { q: '"venture capital" "midwest"', label: 'VC + Midwest' },
  { q: '"venture fund"', label: 'Venture Fund (broad)', stateFilter: true },
  { q: '"angel fund"', label: 'Angel Fund (broad)', stateFilter: true },
];

/**
 * Clean firm name - remove CIK suffix, series info, etc.
 */
function cleanFirmName(displayName) {
  if (!displayName) return null;
  // Remove CIK reference: "Firm Name  (CIK 0001234567)"
  let name = displayName.replace(/\s*\(CIK\s+\d+\)\s*$/i, '').trim();
  // Remove trailing LP/LLC/Inc variations for cleaner matching
  // but keep them in the name for display
  return name;
}

/**
 * Extract the parent firm name from fund names like:
 * "Fairway Venture Capital Fund II, L.P." -> "Fairway Venture Capital"
 * "GP Global Venture Capital U.S. 2023-2024 Series" -> "GP Global Venture Capital"
 */
function extractParentFirm(name) {
  if (!name) return name;
  let parent = name;
  // Remove "a series of X, L.P." pattern first (e.g. "U.S. 2023-2024 Series, a series of GP Global Venture Capital, L.P.")
  const seriesOfMatch = parent.match(/,\s*a\s+series\s+of\s+(.+)/i);
  if (seriesOfMatch) {
    parent = seriesOfMatch[1]; // use the parent entity name
  }
  // Remove fund/series/vintage suffixes
  parent = parent.replace(/\s*[-,]\s*(Fund|Series|Partners|Vintage)\s+[IVXLC0-9]+.*$/i, '');
  parent = parent.replace(/\s+(U\.?S\.?|China|Europe|Asia|Global)\s+\d{4}.*$/i, '');
  parent = parent.replace(/\s*[-,]\s*(L\.?P\.?|LLC|Inc\.?|Corp\.?|Ltd\.?)\.?\s*$/i, '');
  parent = parent.replace(/\s*[-,]\s*(L\.?P\.?|LLC|Inc\.?|Corp\.?|Ltd\.?)\.?\s*$/i, ''); // double pass
  parent = parent.replace(/\s*Fund\s*[IVXLC0-9]*\s*$/i, '');
  parent = parent.replace(/\s*[-,]\s*Series\s+[\w.]+\s*$/i, '');
  parent = parent.replace(/\s*\d{4}(-\d{4})?\s*$/, ''); // trailing years
  parent = parent.replace(/\s*[-,]\s*$/, ''); // trailing punctuation
  return parent.trim();
}

/**
 * Determine opportunity type from name/context
 */
function classifyFirm(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('angel')) return 'angel';
  if (lower.includes('private equity') || lower.includes(' pe ')) return 'vc'; // map PE to vc per instructions
  if (lower.includes('seed')) return 'vc';
  if (lower.includes('growth')) return 'vc';
  return 'vc';
}

/**
 * Determine likely investment stages from name
 */
function inferStages(name) {
  const lower = (name || '').toLowerCase();
  const stages = [];
  if (lower.includes('seed') || lower.includes('early')) stages.push('seed');
  if (lower.includes('pre-seed') || lower.includes('preseed')) stages.push('pre-seed');
  if (lower.includes('growth') || lower.includes('late')) stages.push('growth');
  if (lower.includes('series a')) stages.push('series-a');
  if (lower.includes('series b')) stages.push('series-b');
  // Default for VC firms without stage info
  if (stages.length === 0 && (lower.includes('venture') || lower.includes('angel'))) {
    stages.push('seed', 'series-a');
  }
  return stages;
}

/**
 * Fetch a page of EDGAR search results
 */
async function fetchEdgarPage(query, from = 0, size = 100) {
  const params = new URLSearchParams({
    q: query,
    dateRange: 'custom',
    startdt: '2020-01-01',
    enddt: '2026-12-31',
    _source: 'display_names,biz_locations,biz_states,ciks,root_forms,sics',
    from: from.toString(),
    size: size.toString(),
  });

  const url = `${EDGAR_SEARCH_URL}?${params}`;

  const res = await fetchWithRetry(url, {
    headers: {
      'User-Agent': SEC_USER_AGENT,
      'Accept': 'application/json',
    },
  }, 3, 2000);

  if (!res || !res.ok) {
    console.error(`  Failed to fetch: ${url} (status: ${res?.status})`);
    return null;
  }

  return res.json();
}

/**
 * Run a single search query and collect unique firms
 */
async function searchQuery(queryConfig, firmsByCik) {
  const { q, label, stateFilter } = queryConfig;
  console.log(`  Searching: ${label} ...`);

  let from = 0;
  const size = 100;
  let totalCollected = 0;
  let pages = 0;
  const maxPages = 5; // Cap at 500 results per query to be respectful

  while (pages < maxPages) {
    const data = await fetchEdgarPage(q, from, size);
    if (!data || !data.hits || !data.hits.hits || data.hits.hits.length === 0) break;

    for (const hit of data.hits.hits) {
      const src = hit._source;
      const cik = (src.ciks || [])[0];
      const displayName = (src.display_names || [])[0];
      const location = (src.biz_locations || [])[0] || '';
      const states = src.biz_states || [];

      if (!cik || !displayName) continue;

      // If stateFilter is set, only keep target states
      if (stateFilter) {
        const hasTargetState = states.some(s => ALL_TARGET_STATES.has(s));
        if (!hasTargetState) continue;
      }

      const cleanName = cleanFirmName(displayName);
      if (!cleanName) continue;

      // Skip very generic names or non-investment entities
      const lower = cleanName.toLowerCase();
      if (lower.length < 5) continue;

      if (!firmsByCik[cik]) {
        firmsByCik[cik] = {
          cik,
          name: cleanName,
          parentFirm: extractParentFirm(cleanName),
          location,
          states,
          forms: new Set(),
          isMidwest: states.some(s => MIDWEST_STATES.has(s)),
        };
        totalCollected++;
      }
      // Merge forms
      (src.root_forms || []).forEach(f => firmsByCik[cik].forms.add(f));
    }

    from += size;
    pages++;

    // Rate limit: be polite to SEC servers
    await sleep(200);
  }

  console.log(`    Found ${totalCollected} new unique firms (${label})`);
}

/**
 * Deduplicate firms by parent name to avoid listing
 * "Fund I", "Fund II", "Fund III" separately
 */
function deduplicateByParentFirm(firms) {
  const parentMap = {};

  for (const firm of firms) {
    const parentKey = firm.parentFirm.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    if (!parentMap[parentKey]) {
      parentMap[parentKey] = {
        ...firm,
        name: firm.parentFirm, // Use clean parent name
        allNames: [firm.name],
      };
    } else {
      parentMap[parentKey].allNames.push(firm.name);
      // Merge states
      firm.states.forEach(s => {
        if (!parentMap[parentKey].states.includes(s)) {
          parentMap[parentKey].states.push(s);
        }
      });
      // Update midwest flag
      if (firm.isMidwest) parentMap[parentKey].isMidwest = true;
    }
  }

  return Object.values(parentMap);
}

/**
 * Build a staging record from a firm
 */
function buildStagingRecord(firm) {
  const isChicagoFocused = firm.isMidwest && (
    firm.location.toLowerCase().includes('chicago') ||
    firm.location.toLowerCase().includes(', il')
  );

  // Build description
  let desc = `SEC-registered investment entity`;
  if (firm.allNames && firm.allNames.length > 1) {
    desc += ` with ${firm.allNames.length} funds/series on record`;
  }
  desc += `. Located in ${firm.location || 'unknown location'}.`;
  if (firm.cik) {
    desc += ` SEC CIK: ${firm.cik}.`;
  }

  // Use parent firm name for cleaner display
  const displayName = firm.parentFirm || firm.name;

  return {
    name: displayName,
    organization: displayName,
    description: desc,
    opportunity_type: classifyFirm(firm.name),
    check_size_min: null, // SEC filings don't provide this directly
    check_size_max: null,
    stage: inferStages(firm.name),
    sectors: [], // Would need additional enrichment
    website: null, // Would need additional enrichment
    location: firm.location || null,
    chicago_focused: isChicagoFocused,
    confidence_score: 75, // Reliable source but needs enrichment for check sizes
    raw_input: JSON.stringify({
      sec_cik: firm.cik,
      all_fund_names: firm.allNames || [firm.name],
      biz_states: firm.states,
      filing_forms: [...(firm.forms || [])],
      source: 'sec_edgar_search_index',
    }),
    field_sources: {
      name: 'sec_edgar',
      location: 'sec_edgar',
      description: 'sec_edgar',
    },
  };
}

async function main() {
  console.log('=== SEC EDGAR Investment Adviser Harvester ===');
  console.log(`Started at ${new Date().toISOString()}\n`);

  const firmsByCik = {};

  // Run all search queries
  for (const queryConfig of SEARCH_QUERIES) {
    try {
      await searchQuery(queryConfig, firmsByCik);
      await sleep(300); // Rate limit between queries
    } catch (err) {
      console.error(`  Error on query "${queryConfig.label}":`, err.message);
    }
  }

  const allFirms = Object.values(firmsByCik);
  console.log(`\nTotal unique firms by CIK: ${allFirms.length}`);
  console.log(`  Midwest firms: ${allFirms.filter(f => f.isMidwest).length}`);
  console.log(`  Other states: ${allFirms.filter(f => !f.isMidwest).length}`);

  // Deduplicate by parent firm name
  const dedupedFirms = deduplicateByParentFirm(allFirms);
  console.log(`After parent-firm dedup: ${dedupedFirms.length} unique firms\n`);

  // Build staging records
  const records = dedupedFirms.map(buildStagingRecord);

  // Log some samples
  console.log('Sample records:');
  records.slice(0, 5).forEach(r => {
    console.log(`  ${r.name} | ${r.location} | ${r.opportunity_type} | chicago_focused: ${r.chicago_focused}`);
  });
  console.log();

  if (records.length === 0) {
    console.log('No records to insert.');
    return { inserted: 0, skipped: 0, errors: 0 };
  }

  // Try staging table first
  let stats;
  try {
    stats = await insertToStaging(records, 'sec_adv');
  } catch (err) {
    console.log(`  Staging table insert failed: ${err.message}`);
    stats = { inserted: 0, skipped: 0, errors: records.length };
  }

  // If staging failed (table missing or RLS), try direct insert to funding_opportunities
  if (stats.inserted === 0 && stats.errors > 0) {
    console.log('\n  Staging table unavailable. Trying direct insert to funding_opportunities...');
    const existingNames = await getExistingNames();
    const deduped = records.filter(r => !isDuplicate(r.name, existingNames));
    console.log(`  ${records.length} records -> ${deduped.length} after dedup against existing DB`);

    const BATCH = 50;
    let inserted = 0, errors = 0;
    for (let i = 0; i < deduped.length; i += BATCH) {
      const batch = deduped.slice(i, i + BATCH).map(r => ({
        name: r.name,
        organization: r.organization,
        description: r.description,
        opportunity_type: r.opportunity_type,
        check_size_min: r.check_size_min,
        check_size_max: r.check_size_max,
        stage: r.stage?.length > 0 ? r.stage : null,
        sectors: r.sectors?.length > 0 ? r.sectors : null,
        website: r.website,
        chicago_focused: r.chicago_focused,
        is_active: true,
        created_date: new Date().toISOString(),
      }));
      const { error } = await supabase.from('funding_opportunities').insert(batch);
      if (error) {
        if (i === 0) console.log(`  Direct insert also failed (RLS): ${error.message}`);
        errors += batch.length;
      } else {
        inserted += batch.length;
      }
    }
    stats = { inserted, skipped: records.length - deduped.length, errors };
  }

  // Always save to local JSON as backup
  const jsonPath = join(__dirname, '..', 'data', 'sec-adv-harvest.json');
  try {
    const { mkdirSync } = await import('fs');
    mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
  } catch {}
  writeFileSync(jsonPath, JSON.stringify(records, null, 2));
  console.log(`  Saved ${records.length} records to ${jsonPath}`);

  console.log(`\n=== Final Results ===`);
  console.log(`  Total firms found: ${allFirms.length}`);
  console.log(`  After parent dedup: ${dedupedFirms.length}`);
  console.log(`  Inserted to DB: ${stats.inserted}`);
  console.log(`  Skipped (duplicates): ${stats.skipped}`);
  console.log(`  Errors: ${stats.errors}`);
  return stats;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
