#!/usr/bin/env node

/**
 * Google Custom Search API bulk harvester for US investor firms.
 * Uses up to 100 queries to find VC/angel/PE firms.
 */

const API_KEY = process.env.GOOGLE_API_KEY; // Key removed — pass via env var
const CX = '11f92775a1a4a42d5';
const ENDPOINT = `https://www.googleapis.com/customsearch/v1`;
const OUTPUT_PATH = '/Users/billyndizeye/chistartuphub/data/harvest-google-cse-bulk.json';
const MAX_QUERIES = 100;
const DELAY_MS = 250;

import { writeFileSync } from 'fs';

// --- Query definitions ---

const sectorQueries = [
  '"venture capital" fintech fund',
  '"venture capital" healthtech fund',
  '"venture capital" saas fund portfolio',
  '"venture capital" AI artificial intelligence fund',
  '"venture capital" biotech life sciences fund',
  '"venture capital" cleantech climate fund',
  '"venture capital" edtech education fund',
  '"venture capital" proptech real estate fund',
  '"venture capital" cybersecurity fund',
  '"venture capital" enterprise software fund',
  '"venture capital" consumer fund portfolio',
  '"venture capital" deep tech fund',
  '"venture capital" food agriculture fund',
  '"venture capital" mobility transport fund',
  '"venture capital" blockchain crypto fund',
  '"venture capital" insurtech fund',
  '"venture capital" supply chain logistics fund',
  '"venture capital" media entertainment fund',
  '"venture capital" hardware robotics fund',
  '"venture capital" space defense fund',
  '"seed fund" "pre-seed" startup invest',
  '"micro vc" fund portfolio',
  '"solo GP" venture fund',
  '"emerging manager" venture fund 2024',
  '"angel investor" group network',
  '"family office" venture investment',
  '"corporate venture" startup fund',
  '"growth equity" fund portfolio',
  '"impact investing" venture fund',
  '"diversity" venture fund underrepresented',
];

const cities = [
  'Chicago', 'New York', 'San Francisco', 'Boston', 'Austin',
  'Seattle', 'Denver', 'Miami', 'Los Angeles', 'Atlanta',
  'Nashville', 'Washington DC', 'Philadelphia', 'Pittsburgh',
  'Detroit', 'Minneapolis', 'Portland', 'Salt Lake City',
  'Raleigh', 'Charlotte',
];
const cityQueries = cities.map(c => `"venture capital" "${c}" fund`);

const states = [
  'Texas', 'California', 'Massachusetts', 'Georgia', 'Colorado',
  'Florida', 'Virginia', 'North Carolina', 'Ohio', 'Illinois',
];
const stateQueries = states.map(s => `"vc firm" "${s}" fund portfolio`);

const stageQueries = [
  '"series a" investor fund portfolio companies',
  '"series b" venture capital fund',
  '"late stage" growth fund portfolio',
  '"pre-seed" "seed" fund investor',
  'top venture capital firms 2024 list',
  'best vc firms startup funding',
  'venture capital firm directory',
  'angel investor directory USA',
  'startup investor database',
  '"venture capital" fund I fund II',
];

// Combine all first-page queries
const allQueries = [
  ...sectorQueries,      // 30
  ...cityQueries,        // 20
  ...stateQueries,       // 10
  ...stageQueries,       // 10
];
// That's 70 queries. We have 30 left for pagination on highest-value queries.

// Pagination targets — paginate the sector queries (page 2 = start=11)
const paginationQueries = sectorQueries.slice(0, 20).map(q => ({ query: q, start: 11 }));
// And paginate top city queries (page 2)
const cityPagination = cityQueries.slice(0, 10).map(q => ({ query: q, start: 11 }));

// Total: 70 first-page + 20 sector-page2 + 10 city-page2 = 100
const paginatedAll = [...paginationQueries, ...cityPagination];

// --- Helpers ---

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function searchGoogle(query, start = 1) {
  const url = `${ENDPOINT}?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&start=${start}&num=10`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error(`  ERROR ${res.status}: ${text.slice(0, 200)}`);
    return [];
  }
  const data = await res.json();
  return data.items || [];
}

function cleanFirmName(title) {
  if (!title) return '';
  return title
    .replace(/\s*[-–|:]\s*(Home|Homepage|Welcome|About|About Us|Venture Capital|VC|Fund|Portfolio|Investments|Investing|Official Site|Official Website|LinkedIn|Crunchbase|AngelList|PitchBook).*$/i, '')
    .replace(/\s*\|.*$/, '')
    .replace(/\s*[-–].*?(home|page|site|about|welcome|capital|venture).*$/i, '')
    .replace(/\s*\.{3,}$/, '')
    .trim();
}

function extractLocation(snippet, title) {
  // Try to find city, state patterns
  const patterns = [
    /(?:based in|located in|headquarters? in|from)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,?\s*(?:[A-Z]{2}|[A-Z][a-z]+))/i,
    /((?:New York|San Francisco|Los Angeles|Silicon Valley|Boston|Chicago|Austin|Seattle|Denver|Miami|Atlanta|Nashville|Washington|Philadelphia|Pittsburgh|Detroit|Minneapolis|Portland|Salt Lake City|Raleigh|Charlotte|Dallas|Houston|Phoenix|San Diego|San Jose|Columbus|Indianapolis|Jacksonville|Charlotte|Memphis|Baltimore|Milwaukee|Albuquerque|Tucson|Omaha|Kansas City|Cleveland|Virginia Beach|Oakland|Tampa|Tulsa|Arlington|New Orleans|Honolulu|Henderson|Stockton|Lexington|Corpus Christi|Riverside|Santa Ana|Cincinnati|Orlando|Irvine|Newark|Durham|Chula Vista|Toledo|Fort Wayne|St\. Petersburg|Laredo|Jersey City|Chandler|Madison|Lubbock|Scottsdale|Reno|Buffalo|Fremont|Spokane|Rochester|Cambridge|Palo Alto|Menlo Park|Mountain View|Sunnyvale)(?:,?\s*(?:[A-Z]{2}|California|New York|Texas|Massachusetts|Illinois|Colorado|Florida|Georgia|Virginia|North Carolina|Ohio|Pennsylvania|Oregon|Washington|Minnesota|Michigan|Tennessee|Utah|Arizona|Maryland|Wisconsin|Missouri|Indiana|Connecticut|Oklahoma|Nevada|Iowa|Arkansas|Kansas|Mississippi|Nebraska|New Mexico|Idaho|New Hampshire|Maine|Montana|Rhode Island|Delaware|South Dakota|North Dakota|Vermont|Wyoming|Alaska|Hawaii))?)/,
  ];
  const combined = `${title} ${snippet}`;
  for (const p of patterns) {
    const m = combined.match(p);
    if (m) return m[1].trim().replace(/,\s*$/, '');
  }
  return '';
}

function isLikelyInvestor(title, snippet) {
  const combined = `${title} ${snippet}`.toLowerCase();
  const investorKeywords = ['venture', 'capital', 'fund', 'invest', 'portfolio', 'seed', 'angel', 'equity', 'vc', 'partner', 'startup', 'fintech', 'accelerat'];
  const antiKeywords = ['job', 'career', 'hiring', 'salary', 'wikipedia.org', 'news article', 'blog post'];
  const hasInvestorWord = investorKeywords.some(k => combined.includes(k));
  const hasAntiWord = antiKeywords.some(k => combined.includes(k));
  return hasInvestorWord && !hasAntiWord;
}

function getDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url;
  }
}

function classifyType(title, snippet) {
  const combined = `${title} ${snippet}`.toLowerCase();
  if (combined.includes('angel')) return 'angel_group';
  if (combined.includes('family office')) return 'family_office';
  if (combined.includes('corporate venture') || combined.includes('cvc')) return 'cvc';
  if (combined.includes('private equity') || combined.includes('growth equity')) return 'pe';
  if (combined.includes('accelerat') || combined.includes('incubat')) return 'accelerator';
  return 'vc';
}

// --- Main ---

async function main() {
  let queryCount = 0;
  const allResults = [];

  console.log(`Starting Google CSE bulk harvest...`);
  console.log(`First-page queries: ${allQueries.length}`);
  console.log(`Pagination queries: ${paginatedAll.length}`);
  console.log(`Total planned: ${allQueries.length + paginatedAll.length}`);

  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;

  // Phase 1: First page of all queries
  for (const q of allQueries) {
    if (queryCount >= MAX_QUERIES) break;
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.error(`\nAborting: ${MAX_CONSECUTIVE_ERRORS} consecutive errors. Check API key/quota.`);
      break;
    }
    queryCount++;
    console.log(`[${queryCount}/${MAX_QUERIES}] "${q.slice(0, 60)}..." start=1`);
    const items = await searchGoogle(q, 1);
    if (items.length === 0) {
      consecutiveErrors++;
    } else {
      consecutiveErrors = 0;
      for (const item of items) {
        allResults.push({ ...item, _query: q, _start: 1 });
      }
    }
    console.log(`  → ${items.length} results`);
    await sleep(DELAY_MS);
  }

  // Phase 2: Pagination
  if (consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
    for (const { query, start } of paginatedAll) {
      if (queryCount >= MAX_QUERIES) break;
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(`\nAborting: ${MAX_CONSECUTIVE_ERRORS} consecutive errors. Check API key/quota.`);
        break;
      }
      queryCount++;
      console.log(`[${queryCount}/${MAX_QUERIES}] "${query.slice(0, 60)}..." start=${start}`);
      const items = await searchGoogle(query, start);
      if (items.length === 0) {
        consecutiveErrors++;
      } else {
        consecutiveErrors = 0;
        for (const item of items) {
          allResults.push({ ...item, _query: query, _start: start });
        }
      }
      console.log(`  → ${items.length} results`);
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nTotal queries used: ${queryCount}`);
  console.log(`Total raw results: ${allResults.length}`);

  // Parse and filter
  const parsed = [];
  for (const item of allResults) {
    const title = item.title || '';
    const snippet = item.snippet || '';
    const link = item.link || '';

    if (!isLikelyInvestor(title, snippet)) continue;

    const name = cleanFirmName(title);
    if (!name || name.length < 3) continue;

    const location = extractLocation(snippet, title);
    const isChicago = /chicago|illinois/i.test(`${location} ${snippet} ${title}`);

    parsed.push({
      name,
      organization: name,
      description: snippet.replace(/\n/g, ' ').trim().slice(0, 300),
      website: link,
      opportunity_type: classifyType(title, snippet),
      location: location || '',
      chicago_focused: isChicago,
      confidence_score: 65,
      source: 'google_cse',
      query: item._query,
    });
  }

  console.log(`After investor filtering: ${parsed.length}`);

  // Deduplicate by domain
  const seenDomains = new Set();
  const seenNames = new Set();
  const deduped = [];

  for (const firm of parsed) {
    const domain = getDomain(firm.website);
    const normName = firm.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Skip aggregator sites
    const skipDomains = ['crunchbase.com', 'linkedin.com', 'pitchbook.com', 'angellist.com', 'wikipedia.org', 'twitter.com', 'x.com', 'facebook.com', 'youtube.com', 'medium.com', 'techcrunch.com', 'forbes.com', 'bloomberg.com', 'wsj.com', 'nytimes.com', 'reuters.com', 'cbinsights.com', 'nvca.org', 'investopedia.com'];
    if (skipDomains.some(d => domain.includes(d))) continue;

    if (seenDomains.has(domain) || seenNames.has(normName)) continue;
    seenDomains.add(domain);
    seenNames.add(normName);
    deduped.push(firm);
  }

  console.log(`After deduplication: ${deduped.length}`);

  // Type breakdown
  const typeCounts = {};
  for (const f of deduped) {
    typeCounts[f.opportunity_type] = (typeCounts[f.opportunity_type] || 0) + 1;
  }
  console.log(`\nType breakdown:`);
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  const chicagoCount = deduped.filter(f => f.chicago_focused).length;
  console.log(`Chicago-focused: ${chicagoCount}`);

  // Save
  writeFileSync(OUTPUT_PATH, JSON.stringify(deduped, null, 2));
  console.log(`\nSaved ${deduped.length} firms to ${OUTPUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
