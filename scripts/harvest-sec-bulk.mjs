#!/usr/bin/env node
/**
 * SEC EDGAR Bulk Harvester - Aggressive data mining via EFTS search API
 * Targets 10,000+ investor records using Form D filings with multiple search terms
 * and date partitioning to bypass the 10,000 result window limit.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';

const UA = 'ChiStartupHub/1.0 research@chistartuphub.com';
const BASE = 'https://efts.sec.gov/LATEST/search-index';
const PAGE_SIZE = 100;
const RATE_LIMIT_MS = 120; // ~8 req/sec to stay under 10/sec

// ---------- Search terms ----------
const SEARCH_TERMS = [
  'venture capital',
  'private equity',
  'growth equity',
  'seed fund',
  'angel fund',
  'angel investor',
  'startup fund',
  'technology fund',
  'innovation fund',
  'venture fund',
  'venture partner',
  'early stage fund',
  'series a fund',
  'emerging manager',
  'micro fund',
  'impact fund',
  'climate fund',
  'deep tech',
  'fintech fund',
  'healthcare fund',
  'biotech fund',
  'real estate fund',
  'infrastructure fund',
  'opportunity fund',
  'acquisition fund',
  'buyout fund',
  'mezzanine fund',
  'distressed fund',
  'credit fund',
  'family office',
  'co-investment',
  'coinvestment',
  'venture debt',
  'growth fund',
  'capital partners',
  'equity partners',
  'investment partners',
  'fund lp',
  'fund i ',
  'fund ii',
  'fund iii',
  'fund iv',
  'fund v ',
];

// Date ranges to partition large result sets (each should be < 10k)
const DATE_RANGES = [
  { start: '2020-01-01', end: '2020-12-31' },
  { start: '2021-01-01', end: '2021-12-31' },
  { start: '2022-01-01', end: '2022-06-30' },
  { start: '2022-07-01', end: '2022-12-31' },
  { start: '2023-01-01', end: '2023-06-30' },
  { start: '2023-07-01', end: '2023-12-31' },
  { start: '2024-01-01', end: '2024-06-30' },
  { start: '2024-07-01', end: '2024-12-31' },
  { start: '2025-01-01', end: '2025-12-31' },
  { start: '2026-01-01', end: '2026-12-31' },
];

// Exclusion keywords (lowercase)
const EXCLUDE_KEYWORDS = [
  'mutual fund', 'index fund', 'etf', 'insurance',
  'bank trust', 'money market', 'fixed income',
  '401k', '401(k)', 'pension', 'annuity',
];

// ---------- State map ----------
const STATE_MAP = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// ---------- Globals ----------
const allCIKs = new Map(); // CIK -> record
let requestCount = 0;
let totalHitsProcessed = 0;

// ---------- Helpers ----------
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJSON(url) {
  requestCount++;
  if (requestCount % 50 === 0) {
    process.stdout.write(`  [${requestCount} requests, ${allCIKs.size} unique CIKs]\n`);
  }
  await sleep(RATE_LIMIT_MS);

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/json' },
    });
    if (resp.status === 429) {
      console.log('  Rate limited, waiting 5s...');
      await sleep(5000);
      return fetchJSON(url);
    }
    if (!resp.ok) {
      const text = await resp.text();
      if (text.includes('Result window is too large')) return null; // pagination limit
      console.error(`  HTTP ${resp.status} for ${url.substring(0, 100)}`);
      return null;
    }
    return await resp.json();
  } catch (e) {
    console.error(`  Fetch error: ${e.message}`);
    return null;
  }
}

function shouldExclude(name) {
  const lower = name.toLowerCase();
  return EXCLUDE_KEYWORDS.some(kw => lower.includes(kw));
}

function cleanName(displayName) {
  // "Firm Name  (CIK 0001234567)" -> "Firm Name"
  return displayName.replace(/\s*\(CIK\s+\d+\)\s*$/, '').trim();
}

function extractCIK(displayName) {
  const m = displayName.match(/\(CIK\s+(0*\d+)\)/);
  return m ? m[1].padStart(10, '0') : null;
}

function determineType(name) {
  const lower = name.toLowerCase();
  if (/venture|vc\b/.test(lower)) return 'vc';
  if (/angel/.test(lower)) return 'angel';
  if (/seed/.test(lower)) return 'vc';
  if (/private equity|buyout|acquisition|mezzanine|distressed/.test(lower)) return 'pe';
  if (/family office/.test(lower)) return 'family_office';
  if (/growth/.test(lower)) return 'growth';
  if (/impact|climate|social/.test(lower)) return 'impact';
  if (/real estate/.test(lower)) return 'real_estate';
  if (/fund|capital|partner|equity|invest/.test(lower)) return 'vc';
  return 'vc';
}

function processHits(hits) {
  for (const hit of hits) {
    const src = hit._source;
    if (!src || !src.display_names) continue;

    for (let i = 0; i < src.display_names.length; i++) {
      const displayName = src.display_names[i];
      const name = cleanName(displayName);
      const cik = extractCIK(displayName) || (src.ciks && src.ciks[i]) || null;

      if (!cik || !name) continue;
      if (shouldExclude(name)) continue;
      if (allCIKs.has(cik)) continue;

      const location = (src.biz_locations && src.biz_locations[i]) ||
                       (src.biz_states && src.biz_states[i] && STATE_MAP[src.biz_states[i]]) ||
                       '';
      const state = (src.biz_states && src.biz_states[i]) || '';
      const isChicago = location.toLowerCase().includes('chicago') ||
                        location.toLowerCase().includes(', il');

      allCIKs.set(cik, {
        name,
        organization: name,
        description: 'SEC-registered investment entity (Form D filing)',
        opportunity_type: determineType(name),
        location: location || (state ? (STATE_MAP[state] || state) : 'Unknown'),
        chicago_focused: isChicago,
        confidence_score: isChicago ? 85 : 70,
        source: 'sec_edgar_bulk',
        cik,
      });
    }
    totalHitsProcessed++;
  }
}

// ---------- Search functions ----------
async function searchQuery(term, dateRange = null) {
  const encoded = encodeURIComponent(`"${term}"`);
  let dateParams = '';
  if (dateRange) {
    dateParams = `&dateRange=custom&startdt=${dateRange.start}&enddt=${dateRange.end}`;
  }

  // First, get total count
  const firstUrl = `${BASE}?q=${encoded}&forms=D${dateParams}&from=0&size=100`;
  const first = await fetchJSON(firstUrl);
  if (!first || !first.hits) return 0;

  const total = first.hits.total?.value || 0;
  processHits(first.hits.hits || []);

  if (total <= 100) return total;

  // Paginate through results (max 10000)
  const maxFrom = Math.min(total, 9900);
  for (let from = 100; from <= maxFrom; from += 100) {
    const url = `${BASE}?q=${encoded}&forms=D${dateParams}&from=${from}&size=100`;
    const data = await fetchJSON(url);
    if (!data || !data.hits || !data.hits.hits?.length) break;
    processHits(data.hits.hits);
  }

  return total;
}

async function searchTermFull(term) {
  // First check total without date filter
  const encoded = encodeURIComponent(`"${term}"`);
  const countUrl = `${BASE}?q=${encoded}&forms=D&from=0&size=100`;
  const countData = await fetchJSON(countUrl);
  if (!countData || !countData.hits) return;

  const total = countData.hits.total?.value || 0;
  processHits(countData.hits.hits || []);

  if (total === 0) {
    console.log(`  "${term}": 0 results`);
    return;
  }

  if (total <= 10000) {
    console.log(`  "${term}": ${total} results (single pass)`);
    // Paginate the rest
    const maxFrom = Math.min(total, 9900);
    for (let from = 100; from <= maxFrom; from += 100) {
      const url = `${BASE}?q=${encoded}&forms=D&from=${from}&size=100`;
      const data = await fetchJSON(url);
      if (!data || !data.hits || !data.hits.hits?.length) break;
      processHits(data.hits.hits);
    }
  } else {
    console.log(`  "${term}": ${total}+ results (partitioning by date)`);
    // Need to partition by date ranges
    for (const dr of DATE_RANGES) {
      const partialTotal = await searchQuery(term, dr);
      if (partialTotal > 0) {
        process.stdout.write(`    ${dr.start}-${dr.end}: ${partialTotal} hits\n`);
      }
    }
  }
}

// ---------- Additional: SIC-based search via EFTS ----------
// We can also search by SIC codes in the filings
async function searchSIC(sic, label) {
  // The EFTS lets us filter by SIC indirectly by querying filings
  // But we can also use the company tickers/company data files
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&SIC=${sic}&owner=include&count=100&start=0&action=getcompany&output=atom`;

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/atom+xml' },
    });
    if (!resp.ok) return 0;
    const text = await resp.text();

    // Parse Atom XML for company entries
    const entries = text.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    let count = 0;

    for (const entry of entries) {
      const nameMatch = entry.match(/<title[^>]*>([^<]+)<\/title>/);
      const cikMatch = entry.match(/<CIK>(\d+)<\/CIK>/i) || entry.match(/CIK=(\d+)/);
      const stateMatch = entry.match(/<state-of-incorporation>([^<]+)<\/state-of-incorporation>/i) ||
                         entry.match(/<state>([^<]+)<\/state>/i);

      if (!nameMatch) continue;
      const name = nameMatch[1].trim();
      const cik = cikMatch ? cikMatch[1].padStart(10, '0') : null;
      if (!cik || allCIKs.has(cik)) continue;
      if (shouldExclude(name)) continue;

      const state = stateMatch ? stateMatch[1] : '';
      allCIKs.set(cik, {
        name,
        organization: name,
        description: `SEC-registered entity (SIC ${sic}: ${label})`,
        opportunity_type: determineType(name),
        location: STATE_MAP[state] || state || 'Unknown',
        chicago_focused: state === 'IL',
        confidence_score: 65,
        source: 'sec_edgar_sic',
        cik,
      });
      count++;
    }

    // Paginate
    let start = 100;
    while (entries.length >= 100) {
      await sleep(RATE_LIMIT_MS);
      requestCount++;
      const nextUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&SIC=${sic}&owner=include&count=100&start=${start}&action=getcompany&output=atom`;
      const nextResp = await fetch(nextUrl, {
        headers: { 'User-Agent': UA, 'Accept': 'application/atom+xml' },
      });
      if (!nextResp.ok) break;
      const nextText = await nextResp.text();
      const nextEntries = nextText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      if (nextEntries.length === 0) break;

      for (const entry of nextEntries) {
        const nameMatch = entry.match(/<title[^>]*>([^<]+)<\/title>/);
        const cikMatch = entry.match(/CIK=(\d+)/) || entry.match(/<CIK>(\d+)<\/CIK>/i);
        if (!nameMatch) continue;
        const name = nameMatch[1].trim();
        const cik = cikMatch ? cikMatch[1].padStart(10, '0') : null;
        if (!cik || allCIKs.has(cik)) continue;
        if (shouldExclude(name)) continue;
        allCIKs.set(cik, {
          name, organization: name,
          description: `SEC-registered entity (SIC ${sic}: ${label})`,
          opportunity_type: determineType(name),
          location: 'Unknown', chicago_focused: false,
          confidence_score: 65, source: 'sec_edgar_sic', cik,
        });
        count++;
      }
      if (nextEntries.length < 100) break;
      start += 100;
    }

    return count;
  } catch (e) {
    console.error(`  SIC ${sic} error: ${e.message}`);
    return 0;
  }
}

// ---------- Company tickers file ----------
async function harvestCompanyTickers() {
  console.log('\n=== Harvesting from SEC company_tickers_exchange.json ===');
  try {
    const resp = await fetch('https://www.sec.gov/files/company_tickers_exchange.json', {
      headers: { 'User-Agent': UA },
    });
    if (!resp.ok) {
      console.log('  Could not fetch company tickers');
      return;
    }
    const data = await resp.json();
    // Structure: { fields: [...], data: [[cik, name, ticker, exchange], ...] }
    const fields = data.fields;
    const cikIdx = fields.indexOf('cik');
    const nameIdx = fields.indexOf('name');

    let count = 0;
    for (const row of data.data) {
      const name = row[nameIdx];
      const cik = String(row[cikIdx]).padStart(10, '0');
      const lower = name.toLowerCase();

      // Only include investment-related firms
      if (!/venture|capital|equity|fund|invest|partner|angel|seed|growth/.test(lower)) continue;
      if (shouldExclude(name)) continue;
      if (allCIKs.has(cik)) continue;

      allCIKs.set(cik, {
        name, organization: name,
        description: 'SEC-registered entity (company tickers)',
        opportunity_type: determineType(name),
        location: 'Unknown', chicago_focused: false,
        confidence_score: 60, source: 'sec_edgar_tickers', cik,
      });
      count++;
    }
    console.log(`  Added ${count} from company tickers`);
  } catch (e) {
    console.error(`  Tickers error: ${e.message}`);
  }
}

// ---------- Main ----------
async function main() {
  console.log('=== SEC EDGAR Bulk Harvester ===');
  console.log(`Start time: ${new Date().toISOString()}`);

  // Load existing CIKs to exclude
  const existingPath = '/Users/billyndizeye/chistartuphub/data/sec-adv-harvest.json';
  const existingCIKs = new Set();
  if (existsSync(existingPath)) {
    const existing = JSON.parse(readFileSync(existingPath, 'utf8'));
    for (const r of existing) {
      if (r.raw_input) {
        try {
          const ri = JSON.parse(r.raw_input);
          if (ri.sec_cik) existingCIKs.add(ri.sec_cik);
        } catch {}
      }
      // Also match by name
      if (r.cik) existingCIKs.add(r.cik);
    }
    console.log(`Loaded ${existingCIKs.size} existing CIKs to exclude`);
  }

  // Phase 1: EFTS Full Text Search with all terms
  console.log('\n=== Phase 1: EFTS Full Text Search (Form D filings) ===');
  for (const term of SEARCH_TERMS) {
    await searchTermFull(term);
    console.log(`  Running total: ${allCIKs.size} unique CIKs`);
  }

  // Phase 2: Also search Form ADV (investment adviser registrations)
  console.log('\n=== Phase 2: Form ADV search ===');
  const ADV_TERMS = [
    'venture capital', 'private equity', 'growth equity', 'family office',
    'seed', 'angel', 'technology', 'startup', 'innovation',
    'fund of funds', 'hedge fund', 'real estate',
  ];
  for (const term of ADV_TERMS) {
    const encoded = encodeURIComponent(`"${term}"`);
    // Form ADV
    const url = `${BASE}?q=${encoded}&forms=ADV&from=0&size=100`;
    const data = await fetchJSON(url);
    if (data?.hits?.hits) {
      processHits(data.hits.hits);
      const total = data.hits.total?.value || 0;
      console.log(`  ADV "${term}": ${total} results`);
      const maxFrom = Math.min(total, 9900);
      for (let from = 100; from <= maxFrom; from += 100) {
        const nextUrl = `${BASE}?q=${encoded}&forms=ADV&from=${from}&size=100`;
        const next = await fetchJSON(nextUrl);
        if (!next?.hits?.hits?.length) break;
        processHits(next.hits.hits);
      }
    }
  }
  console.log(`  After ADV: ${allCIKs.size} unique CIKs`);

  // Phase 3: SIC code search via EDGAR company browser
  console.log('\n=== Phase 3: SIC Code Search ===');
  const SICS = [
    [6726, 'Investment Offices'],
    [6199, 'Finance Services'],
    [6211, 'Security Brokers/Dealers'],
    [6282, 'Investment Advice'],
  ];
  for (const [sic, label] of SICS) {
    const count = await searchSIC(sic, label);
    console.log(`  SIC ${sic} (${label}): ${count} new`);
  }

  // Phase 4: Company tickers
  await harvestCompanyTickers();

  // Phase 5: Deduplicate against existing harvest
  console.log('\n=== Deduplication ===');
  console.log(`Total unique CIKs before dedup: ${allCIKs.size}`);

  const netNew = [];
  for (const [cik, record] of allCIKs) {
    if (!existingCIKs.has(cik)) {
      netNew.push(record);
    }
  }

  console.log(`Existing CIKs removed: ${allCIKs.size - netNew.length}`);
  console.log(`Net new records: ${netNew.length}`);

  // Save
  const outPath = '/Users/billyndizeye/chistartuphub/data/harvest-sec-bulk.json';
  writeFileSync(outPath, JSON.stringify(netNew, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Stats
  const byType = {};
  const bySource = {};
  let chicagoCount = 0;
  for (const r of netNew) {
    byType[r.opportunity_type] = (byType[r.opportunity_type] || 0) + 1;
    bySource[r.source] = (bySource[r.source] || 0) + 1;
    if (r.chicago_focused) chicagoCount++;
  }
  console.log('\nBy type:', byType);
  console.log('By source:', bySource);
  console.log(`Chicago-focused: ${chicagoCount}`);
  console.log(`Total API requests: ${requestCount}`);
  console.log(`End time: ${new Date().toISOString()}`);
}

main().catch(e => { console.error(e); process.exit(1); });
