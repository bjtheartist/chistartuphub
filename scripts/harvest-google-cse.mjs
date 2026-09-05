#!/usr/bin/env node
/**
 * Google CSE + Wikipedia Investor Directory Harvester
 *
 * Strategy:
 * 1. Try Google Custom Search API for investor discovery queries
 * 2. Fall back to Wikipedia VC/angel investor lists (highest-value free source)
 * 3. Parse all results into investor records
 * 4. Write to investor_enrichment_staging via shared utils
 */

import { insertToStaging, fetchWithRetry, sleep, GOOGLE_CSE_KEY } from './harvester-utils.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, '..', 'data', 'harvests');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Google CSE Config ──
const CSE_CX = 'a07bee3e530e74fee';
const CSE_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';

const CSE_QUERIES = [
  // US-wide investor discovery
  { q: '"venture capital firm" "portfolio" site:crunchbase.com', label: 'Crunchbase VC firms' },
  { q: '"angel investor group" directory members', label: 'Angel investor groups' },
  { q: '"seed fund" "series a" midwest invest', label: 'Midwest seed/A funds' },
  { q: '"venture capital" Chicago portfolio companies', label: 'Chicago VC' },
  { q: '"venture fund" Illinois Indiana Michigan Ohio', label: 'Midwest states VC' },
  { q: '"corporate venture capital" startup investment program', label: 'CVC programs' },
  { q: '"family office" venture investment startups', label: 'Family office VC' },
  { q: '"micro vc" fund "check size"', label: 'Micro VC funds' },
  { q: '"emerging manager" venture fund 2024 2025', label: 'Emerging managers' },
  { q: '"pre-seed fund" startup investors USA', label: 'Pre-seed funds' },
  // Midwest-specific
  { q: '"venture capital" "Chicago" fund portfolio', label: 'Chicago VC portfolio' },
  { q: '"venture capital" "Detroit" OR "Ann Arbor" fund', label: 'Detroit/Ann Arbor VC' },
  { q: '"venture capital" "Columbus" OR "Cincinnati" Ohio fund', label: 'Ohio VC' },
  { q: '"venture capital" "Minneapolis" OR "Milwaukee" fund', label: 'Minneapolis/Milwaukee VC' },
  { q: '"venture capital" "Indianapolis" fund startup', label: 'Indianapolis VC' },
];

// ── Wikipedia sources ──
const WIKI_SOURCES = [
  {
    url: 'https://en.wikipedia.org/wiki/List_of_venture_capital_firms',
    label: 'Wikipedia VC list',
    type: 'vc',
  },
  {
    url: 'https://en.wikipedia.org/wiki/List_of_angel_investors',
    label: 'Wikipedia angel investors',
    type: 'angel',
  },
];

// ── Location extraction helpers ──
const US_STATES = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY',
};

const US_CITIES_CHICAGO = [
  'chicago', 'evanston', 'naperville', 'schaumburg', 'oak brook',
  'lake forest', 'highland park', 'wilmette',
  'deerfield, il', 'deerfield, illinois',
];

const STATE_ABBREVS = new Set(Object.values(US_STATES));

function extractLocation(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Look for "City, State" patterns
  const cityStateMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})\b/);
  if (cityStateMatch && STATE_ABBREVS.has(cityStateMatch[2])) {
    return cityStateMatch[1] + ', ' + cityStateMatch[2];
  }

  // Check for known cities first (more specific)
  const knownCities = {
    'san francisco': 'San Francisco, CA',
    'silicon valley': 'Silicon Valley, CA',
    'palo alto': 'Palo Alto, CA',
    'menlo park': 'Menlo Park, CA',
    'new york': 'New York, NY',
    'boston': 'Boston, MA',
    'seattle': 'Seattle, WA',
    'austin': 'Austin, TX',
    'denver': 'Denver, CO',
    'los angeles': 'Los Angeles, CA',
    'detroit': 'Detroit, MI',
    'ann arbor': 'Ann Arbor, MI',
    'columbus': 'Columbus, OH',
    'cincinnati': 'Cincinnati, OH',
    'indianapolis': 'Indianapolis, IN',
    'minneapolis': 'Minneapolis, MN',
    'milwaukee': 'Milwaukee, WI',
    'st. louis': 'St. Louis, MO',
    'saint louis': 'St. Louis, MO',
    'kansas city': 'Kansas City, MO',
    'pittsburgh': 'Pittsburgh, PA',
    'philadelphia': 'Philadelphia, PA',
    'washington': 'Washington, DC',
    'atlanta': 'Atlanta, GA',
    'miami': 'Miami, FL',
    'charlotte': 'Charlotte, NC',
    'raleigh': 'Raleigh, NC',
    'durham': 'Durham, NC',
    'nashville': 'Nashville, TN',
    'salt lake city': 'Salt Lake City, UT',
    'portland': 'Portland, OR',
    'boulder': 'Boulder, CO',
    'oakland': 'Oakland, CA',
    'cambridge': 'Cambridge, MA',
    'cleveland': 'Cleveland, OH',
    'new york city': 'New York, NY',
    'manhattan beach': 'Manhattan Beach, CA',
    'sunnyvale': 'Sunnyvale, CA',
    'mountain view': 'Mountain View, CA',
    'chevy chase': 'Chevy Chase, MD',
    'owings mills': 'Owings Mills, MD',
    'princeton': 'Princeton, NJ',
    'manchester': 'Manchester, NH',
  };

  for (const [city, loc] of Object.entries(knownCities)) {
    if (lower.includes(city)) return loc;
  }

  // Chicago-area cities
  for (const city of US_CITIES_CHICAGO) {
    if (lower.includes(city)) return 'Chicago, IL';
  }

  // Look for state names
  for (const [stateName, abbrev] of Object.entries(US_STATES)) {
    if (lower.includes(stateName)) {
      return abbrev;
    }
  }

  return null;
}

function isChicagoFocused(location, text) {
  const combined = ((location || '') + ' ' + (text || '')).toLowerCase();
  return US_CITIES_CHICAGO.some(function(c) { return combined.includes(c); }) || combined.includes(', il');
}

function classifyType(name, description) {
  const text = ((name || '') + ' ' + (description || '')).toLowerCase();
  if (text.includes('angel')) return 'angel';
  if (text.includes('corporate venture') || text.includes('cvc')) return 'vc';
  if (text.includes('family office')) return 'vc';
  if (text.includes('accelerator')) return 'vc';
  return 'vc';
}

function inferStages(name, description) {
  const text = ((name || '') + ' ' + (description || '')).toLowerCase();
  const stages = [];
  if (text.includes('pre-seed') || text.includes('preseed')) stages.push('pre-seed');
  if (text.includes('seed') && !text.includes('pre-seed')) stages.push('seed');
  if (text.includes('early stage') || text.includes('early-stage')) stages.push('seed');
  if (text.includes('series a')) stages.push('series-a');
  if (text.includes('series b')) stages.push('series-b');
  if (text.includes('series c')) stages.push('series-c');
  if (text.includes('growth') || text.includes('late stage') || text.includes('late-stage')) stages.push('growth');
  if (stages.length === 0) stages.push('seed', 'series-a');
  return stages;
}

function inferSectors(description) {
  if (!description) return [];
  const lower = description.toLowerCase();
  const sectors = [];
  if (lower.includes('biotech') || lower.includes('life science') || lower.includes('healthcare') || lower.includes('health')) sectors.push('healthcare');
  if (lower.includes('fintech') || lower.includes('financial')) sectors.push('fintech');
  if (lower.includes('saas') || lower.includes('software') || lower.includes('enterprise')) sectors.push('software');
  if (lower.includes('ai') || lower.includes('artificial intelligence') || lower.includes('machine learning')) sectors.push('AI/ML');
  if (lower.includes('clean') || lower.includes('climate') || lower.includes('energy')) sectors.push('cleantech');
  if (lower.includes('consumer')) sectors.push('consumer');
  if (lower.includes('deep tech') || lower.includes('deeptech')) sectors.push('deeptech');
  if (lower.includes('crypto') || lower.includes('blockchain') || lower.includes('web3')) sectors.push('crypto/web3');
  if (lower.includes('edtech') || lower.includes('education')) sectors.push('edtech');
  if (lower.includes('food') || lower.includes('agri') || lower.includes('agtech')) sectors.push('agtech');
  return sectors;
}

// ── Google CSE Functions ──

async function runCSEQuery(query, startIndex) {
  startIndex = startIndex || 1;
  const params = new URLSearchParams({
    key: GOOGLE_CSE_KEY,
    cx: CSE_CX,
    q: query,
    start: startIndex.toString(),
    num: '10',
  });

  const url = CSE_ENDPOINT + '?' + params;
  try {
    const res = await fetchWithRetry(url, {}, 2, 1500);
    if (!res || !res.ok) {
      const text = res ? await res.text() : 'no response';
      console.error('  CSE query failed (' + (res ? res.status : 'none') + '): ' + text.slice(0, 200));
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('  CSE fetch error: ' + err.message);
    return null;
  }
}

async function harvestGoogleCSE() {
  console.log('\n-- Google Custom Search API --');
  const records = [];
  let queriesUsed = 0;
  let cseWorking = true;

  for (const queryDef of CSE_QUERIES) {
    if (!cseWorking) break;
    if (queriesUsed >= 15) {
      console.log('  Reached CSE query budget (15), saving rest for future runs.');
      break;
    }

    console.log('  Query: ' + queryDef.label);
    const data = await runCSEQuery(queryDef.q);
    queriesUsed++;

    if (!data) {
      console.log('    CSE API not working, will skip remaining queries.');
      cseWorking = false;
      break;
    }

    if (data.error) {
      console.log('    CSE error: ' + data.error.message);
      if (data.error.code === 403 || data.error.code === 400) {
        console.log('    CSE not available (bad CX or quota). Skipping.');
        cseWorking = false;
        break;
      }
      continue;
    }

    const items = data.items || [];
    console.log('    Got ' + items.length + ' results');

    for (const item of items) {
      const name = cleanCSETitle(item.title);
      if (!name || name.length < 3) continue;

      // Skip non-investor results
      if (isIrrelevantResult(name, item.snippet)) continue;

      const location = extractLocation(item.snippet || '');
      const description = item.snippet || '';

      records.push({
        name: name,
        organization: name,
        description: description.slice(0, 500),
        website: item.link || null,
        location: location,
        opportunity_type: classifyType(name, description),
        stage: inferStages(name, description),
        sectors: inferSectors(description),
        chicago_focused: isChicagoFocused(location, description),
        confidence_score: 65,
        raw_input: JSON.stringify({
          source: 'google_cse',
          query: queryDef.q,
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        }),
        field_sources: {
          name: 'google_cse',
          website: 'google_cse',
          description: 'google_cse',
          location: 'google_cse_snippet',
        },
      });
    }

    await sleep(500);
  }

  console.log('  CSE total raw records: ' + records.length + ' (used ' + queriesUsed + ' queries)');
  return { records: records, cseWorking: cseWorking };
}

function cleanCSETitle(title) {
  if (!title) return null;
  var name = title
    .replace(/\s*[|]\s*(Crunchbase|Wikipedia|LinkedIn|AngelList|PitchBook|CB Insights).*$/i, '')
    .replace(/\s*[-]\s*(Crunchbase|Wikipedia|LinkedIn|AngelList|PitchBook|CB Insights).*$/i, '')
    .replace(/\s*[|]\s*Home$/i, '')
    .replace(/\s*\(.*\)\s*$/, '')
    .trim();
  return name;
}

function isIrrelevantResult(name, snippet) {
  const combined = ((name || '') + ' ' + (snippet || '')).toLowerCase();
  const skipTerms = [
    'how to become', 'what is venture capital', 'job posting', 'career',
    'news article', 'blog post', 'course', 'definition of', 'salary',
    'interview', 'book review', 'podcast', 'youtube',
  ];
  return skipTerms.some(function(t) { return combined.includes(t); });
}

// ── Wikipedia Parsing ──

/**
 * Parse a wikitable row into cells, handling both || inline and \n| newline separators.
 * Returns array of cleaned cell texts.
 */
function parseWikiTableRow(rowText) {
  // First, join multi-line cells: replace \n| with || for uniform splitting
  var normalized = rowText.replace(/^\s*\|-[^\n]*\n/, ''); // strip leading |- line
  // Split on || or \n|
  var cells = normalized.split(/\|\||\n\|/).map(function(c) { return c.trim(); }).filter(function(c) { return c.length > 0; });
  return cells;
}

/**
 * Extract a VC firm name from a wiki cell like:
 *   "1" (rank), "{{flagicon|USA}} [[Andreessen Horowitz]]", "[[Menlo Park, CA]]", "$42.0B"
 */
function extractFirmFromCell(cell) {
  // Remove flagicon templates
  var cleaned = cell.replace(/\{\{flagicon\|[^}]+\}\}\s*/g, '');
  // Extract wiki link name
  var linkMatch = cleaned.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  if (linkMatch) return (linkMatch[2] || linkMatch[1]).trim();
  // Fallback: plain text after removing templates
  cleaned = cleanWikiText(cleaned);
  // Skip if it's just a number (rank column)
  if (/^\d+$/.test(cleaned)) return null;
  return cleaned.length >= 3 ? cleaned : null;
}

async function harvestWikipediaVC() {
  console.log('\n-- Wikipedia: List of Venture Capital Firms --');
  const records = [];
  const seen = new Set();

  try {
    var apiUrl = 'https://en.wikipedia.org/w/api.php?action=parse&page=List_of_venture_capital_firms&prop=wikitext&format=json';
    var res = await fetchWithRetry(apiUrl, {}, 3, 2000);
    if (!res || !res.ok) {
      console.log('  Failed to fetch Wikipedia VC list via API, trying HTML...');
      return await harvestWikipediaVCFallback();
    }

    var data = await res.json();
    var wikitext = data && data.parse && data.parse.wikitext ? data.parse.wikitext['*'] : '';

    if (!wikitext) {
      console.log('  Empty wikitext, trying HTML fallback...');
      return await harvestWikipediaVCFallback();
    }

    console.log('  Got wikitext (' + wikitext.length + ' chars)');

    // Split into table rows using |- delimiter
    var tableRows = wikitext.match(/\|-[\s\S]*?(?=\|-|\|\})/g) || [];
    console.log('  Found ' + tableRows.length + ' table rows');

    for (var row of tableRows) {
      var cells = parseWikiTableRow(row);
      if (cells.length < 2) continue;

      // Skip header rows (contain !)
      if (cells.some(function(c) { return c.startsWith('!') || c.includes('style='); })) continue;

      // Find the firm name cell - it's the one with [[wikilink]] after the rank number
      var firmName = null;
      var locationText = null;
      var aumText = null;

      for (var i = 0; i < cells.length; i++) {
        var cellText = cells[i];
        // Skip rank numbers
        if (/^\d+$/.test(cellText.trim())) continue;

        // Cell with a wikilink that contains a firm name
        if (!firmName && (cellText.includes('[[') || cellText.includes('flagicon'))) {
          var extracted = extractFirmFromCell(cellText);
          if (extracted && extracted.length >= 3) {
            firmName = extracted;
            continue;
          }
        }

        // Location cell (has [[City, ST]] pattern)
        if (firmName && !locationText && cellText.includes('[[')) {
          locationText = cleanWikiText(cellText);
          continue;
        }

        // AUM/capital cell (has $ or number with B/M)
        if (firmName && (cellText.includes('$') || /\d+\.\d+/.test(cellText))) {
          aumText = cleanWikiText(cellText);
        }
      }

      if (!firmName || firmName.length < 3) continue;

      // Skip non-investor Wikipedia entries
      var skipNames = ['angel investor', 'comparison of', 'list of', 'venture capital',
        'startup company', 'private equity', 'see also', 'references', 'external links',
        'category:', 'file:', 'image:', 'wikipedia:', 'crowdfunding'];
      var lowerFirm = firmName.toLowerCase();
      if (skipNames.some(function(s) { return lowerFirm.includes(s); })) continue;

      // Dedup within Wikipedia results
      var nameKey = firmName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(nameKey)) continue;
      seen.add(nameKey);

      var location = extractLocation(locationText || '');
      var locCombined = (locationText || '') + ' ' + (firmName || '');

      // Skip non-US firms
      if (locationText && isNonUSLocation(locationText)) continue;

      var desc = 'Venture capital firm';
      if (location) desc += ' based in ' + location;
      if (aumText) desc += '. AUM: ' + aumText;
      desc += '.';

      records.push({
        name: firmName,
        organization: firmName,
        description: desc,
        website: null,
        location: location,
        opportunity_type: 'vc',
        stage: inferStages(firmName, ''),
        sectors: [],
        chicago_focused: isChicagoFocused(location, locCombined),
        confidence_score: 75,
        raw_input: JSON.stringify({
          source: 'wikipedia_vc_list',
          raw_cells: cells.slice(0, 4).map(function(c) { return c.slice(0, 200); }),
        }),
        field_sources: {
          name: 'wikipedia',
          location: 'wikipedia',
          description: 'wikipedia',
        },
      });
    }

    // Also extract from bullet lists
    var bulletItems = wikitext.match(/^\*\s*\[\[([^\]]+)\]\].*$/gm) || [];
    console.log('  Found ' + bulletItems.length + ' bullet list items');

    for (var item of bulletItems) {
      var nameMatch = item.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
      if (!nameMatch) continue;

      var bname = (nameMatch[2] || nameMatch[1]).trim();
      if (!bname || bname.length < 3) continue;

      var lowerBname = bname.toLowerCase();
      if (['angel investor', 'comparison of', 'list of', 'venture capital',
        'startup company', 'private equity', 'crowdfunding', 'hedge fund',
        'category:', 'file:', 'see also'].some(function(s) { return lowerBname.includes(s); })) continue;

      var bnameKey = bname.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(bnameKey)) continue;
      seen.add(bnameKey);

      var restText = item.replace(/^\*\s*\[\[[^\]]+\]\]\s*[-\u2013\u2014]?\s*/, '');
      var bloc = extractLocation(restText);

      if (isNonUSLocation(restText) && !bloc) continue;

      records.push({
        name: bname,
        organization: bname,
        description: cleanWikiText(restText) || 'Venture capital firm.',
        website: null,
        location: bloc,
        opportunity_type: 'vc',
        stage: inferStages(bname, restText),
        sectors: inferSectors(restText),
        chicago_focused: isChicagoFocused(bloc, restText),
        confidence_score: 75,
        raw_input: JSON.stringify({ source: 'wikipedia_vc_list', raw: item.slice(0, 300) }),
        field_sources: { name: 'wikipedia', location: 'wikipedia', description: 'wikipedia' },
      });
    }

    console.log('  Wikipedia VC raw records: ' + records.length);
    return records;

  } catch (err) {
    console.error('  Wikipedia VC error: ' + err.message);
    return await harvestWikipediaVCFallback();
  }
}

async function harvestWikipediaVCFallback() {
  console.log('  Using HTML fallback for Wikipedia VC list...');
  const records = [];

  try {
    const res = await fetchWithRetry('https://en.wikipedia.org/wiki/List_of_venture_capital_firms', {}, 3, 2000);
    if (!res || !res.ok) {
      console.log('  HTML fallback also failed.');
      return records;
    }

    const html = await res.text();

    // Extract links from table cells
    const linkPattern = /<td[^>]*>(?:<[^>]*>)*<a[^>]*title="([^"]*)"[^>]*>([^<]+)<\/a>/g;
    var match;
    const seen = new Set();

    while ((match = linkPattern.exec(html)) !== null) {
      const name = match[2].trim();
      if (seen.has(name.toLowerCase()) || name.length < 3) continue;
      seen.add(name.toLowerCase());

      if (['edit', 'edit section', 'citation needed', 'references'].includes(name.toLowerCase())) continue;

      records.push({
        name: name,
        organization: name,
        description: 'Venture capital firm listed on Wikipedia.',
        website: null,
        location: null,
        opportunity_type: 'vc',
        stage: ['seed', 'series-a'],
        sectors: [],
        chicago_focused: false,
        confidence_score: 70,
        raw_input: JSON.stringify({ source: 'wikipedia_vc_list_html' }),
        field_sources: { name: 'wikipedia' },
      });
    }

    console.log('  HTML fallback extracted ' + records.length + ' firms');
    return records;
  } catch (err) {
    console.error('  HTML fallback error: ' + err.message);
    return records;
  }
}

async function harvestWikipediaAngels() {
  console.log('\n-- Wikipedia: Angel Investors --');
  const records = [];

  try {
    const apiUrl = 'https://en.wikipedia.org/w/api.php?action=parse&page=List_of_angel_investors&prop=wikitext&format=json';
    const res = await fetchWithRetry(apiUrl, {}, 3, 2000);

    if (!res || !res.ok) {
      console.log('  Failed to fetch Wikipedia angel investor list');
      return records;
    }

    const data = await res.json();
    const wikitext = data && data.parse && data.parse.wikitext ? data.parse.wikitext['*'] : '';

    if (!wikitext || wikitext.length < 100) {
      console.log('  Angel investor list may not exist as separate page, trying alternative...');
      return records;
    }

    console.log('  Got wikitext (' + wikitext.length + ' chars)');

    // Parse angel investors
    const wikiLinks = wikitext.match(/\[\[([^\]]+)\]\]/g) || [];

    for (const link of wikiLinks) {
      const nameMatch = link.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
      if (!nameMatch) continue;
      const name = (nameMatch[2] || nameMatch[1]).trim();
      if (!name || name.length < 3) continue;

      // Skip generic Wikipedia links
      var skipList = ['angel investor', 'venture capital', 'startup company', 'silicon valley',
           'united states', 'category', 'file', 'image'];
      if (skipList.some(function(skip) { return name.toLowerCase().includes(skip); })) continue;

      records.push({
        name: name,
        organization: name,
        description: 'Angel investor listed on Wikipedia.',
        website: null,
        location: null,
        opportunity_type: 'angel',
        stage: ['pre-seed', 'seed'],
        sectors: [],
        chicago_focused: false,
        confidence_score: 70,
        raw_input: JSON.stringify({ source: 'wikipedia_angel_list' }),
        field_sources: { name: 'wikipedia' },
      });
    }

    console.log('  Wikipedia angel raw records: ' + records.length);
    return records;

  } catch (err) {
    console.error('  Wikipedia angel error: ' + err.message);
    return records;
  }
}

// ── Supplemental well-known VC firms ──
const SUPPLEMENTAL_VC_FIRMS = [
  // Major US VC firms
  { name: 'Andreessen Horowitz (a16z)', location: 'Menlo Park, CA', description: 'Top-tier VC investing in software, bio, crypto, games, and more. $35B+ AUM.', stages: ['seed', 'series-a', 'series-b', 'growth'] },
  { name: 'Sequoia Capital', location: 'Menlo Park, CA', description: 'Legendary VC firm. Backed Apple, Google, Airbnb, Stripe, etc.', stages: ['seed', 'series-a', 'series-b', 'growth'] },
  { name: 'Accel', location: 'Palo Alto, CA', description: 'Global VC firm focused on seed through growth-stage technology companies.', stages: ['seed', 'series-a', 'series-b'] },
  { name: 'Benchmark', location: 'San Francisco, CA', description: 'Early-stage VC. Backed eBay, Twitter, Uber, Snapchat.', stages: ['seed', 'series-a'] },
  { name: 'Greylock Partners', location: 'Menlo Park, CA', description: 'Consumer and enterprise technology investor since 1965.', stages: ['seed', 'series-a', 'series-b'] },
  { name: 'Lightspeed Venture Partners', location: 'Menlo Park, CA', description: 'Multi-stage VC investing in enterprise, consumer, and health.', stages: ['seed', 'series-a', 'series-b', 'growth'] },
  { name: 'Bessemer Venture Partners', location: 'San Francisco, CA', description: 'One of the oldest VC firms in the US, active since 1911.', stages: ['seed', 'series-a', 'series-b'] },
  { name: 'NEA (New Enterprise Associates)', location: 'Menlo Park, CA', description: 'One of the largest VC firms globally with $25B+ AUM.', stages: ['seed', 'series-a', 'series-b', 'growth'] },
  { name: 'General Catalyst', location: 'Cambridge, MA', description: 'Venture capital firm focused on transformative technology.', stages: ['seed', 'series-a', 'series-b', 'growth'] },
  { name: 'Founders Fund', location: 'San Francisco, CA', description: 'VC firm founded by Peter Thiel. Invests in ambitious tech companies.', stages: ['seed', 'series-a', 'series-b'] },
  { name: 'Union Square Ventures', location: 'New York, NY', description: 'Thesis-driven VC investing in large networks and marketplaces.', stages: ['seed', 'series-a'] },
  { name: 'First Round Capital', location: 'San Francisco, CA', description: 'Seed-stage VC known for community-driven approach.', stages: ['pre-seed', 'seed'] },
  { name: 'Index Ventures', location: 'San Francisco, CA', description: 'International VC with US offices, multi-stage investing.', stages: ['seed', 'series-a', 'series-b', 'growth'] },
  { name: 'Insight Partners', location: 'New York, NY', description: 'Growth-stage tech investor with $90B+ AUM.', stages: ['series-b', 'growth'] },
  { name: 'Tiger Global Management', location: 'New York, NY', description: 'Crossover fund investing in public and private tech companies.', stages: ['series-a', 'series-b', 'growth'] },
  { name: 'Khosla Ventures', location: 'Menlo Park, CA', description: 'Founded by Sun Microsystems co-founder. Invests in impactful tech.', stages: ['seed', 'series-a', 'series-b'] },
  { name: 'Battery Ventures', location: 'Boston, MA', description: 'Technology-focused investment firm with $13B+ AUM.', stages: ['seed', 'series-a', 'series-b', 'growth'] },
  { name: 'GGV Capital', location: 'Menlo Park, CA', description: 'Global VC with focus on seed-to-growth tech investing.', stages: ['seed', 'series-a', 'series-b'] },
  { name: 'Ribbit Capital', location: 'Menlo Park, CA', description: 'Fintech-focused VC firm.', stages: ['seed', 'series-a', 'series-b'], sectors: ['fintech'] },
  { name: 'Lux Capital', location: 'New York, NY', description: 'Deep tech and science-based technology investor.', stages: ['seed', 'series-a', 'series-b'], sectors: ['deeptech'] },

  // Midwest VC firms (high priority for ChiStartupHub)
  { name: 'Pritzker Group Venture Capital', location: 'Chicago, IL', description: 'Chicago-based VC investing in early-stage tech companies.', stages: ['seed', 'series-a'], chicago: true },
  { name: 'MATH Venture Partners', location: 'Chicago, IL', description: 'Chicago VC focused on B2B software and services.', stages: ['seed', 'series-a'], chicago: true },
  { name: 'Chicago Ventures', location: 'Chicago, IL', description: 'Seed and early-stage VC investing in Chicago-area startups.', stages: ['pre-seed', 'seed'], chicago: true },
  { name: 'OCA Ventures', location: 'Chicago, IL', description: 'Chicago-based VC investing in early-stage technology companies.', stages: ['seed', 'series-a'], chicago: true },
  { name: 'Hyde Park Venture Partners', location: 'Chicago, IL', description: 'Early-stage VC investing in B2B software in the Midwest.', stages: ['seed', 'series-a'], chicago: true },
  { name: 'Hyde Park Angels', location: 'Chicago, IL', description: 'One of the most active angel groups in the US, Chicago-based.', stages: ['pre-seed', 'seed'], chicago: true, type: 'angel' },
  { name: 'Lightbank', location: 'Chicago, IL', description: 'Chicago VC founded by Groupon co-founders.', stages: ['seed', 'series-a'], chicago: true },
  { name: 'Origin Ventures', location: 'Chicago, IL', description: 'Early-stage VC focused on Midwest startups.', stages: ['seed', 'series-a'], chicago: true },
  { name: 'West Loop Ventures', location: 'Chicago, IL', description: 'Chicago-based seed-stage venture capital firm.', stages: ['pre-seed', 'seed'], chicago: true },
  { name: 'M25', location: 'Chicago, IL', description: 'Most active VC in the Midwest, investing pre-seed to Series A.', stages: ['pre-seed', 'seed', 'series-a'], chicago: true },
  { name: 'Valor Equity Partners', location: 'Chicago, IL', description: 'Chicago-based operational growth investor. Early Tesla backer.', stages: ['series-a', 'series-b', 'growth'], chicago: true },
  { name: 'Cleveland Avenue', location: 'Chicago, IL', description: "Food, beverage, and technology VC founded by former McDonald's CEO.", stages: ['seed', 'series-a'], chicago: true, sectors: ['food'] },
  { name: 'IrishAngels', location: 'Chicago, IL', description: 'Notre Dame alumni angel investment network based in Chicago.', stages: ['pre-seed', 'seed'], chicago: true, type: 'angel' },
  { name: 'Tensility Venture Partners', location: 'Chicago, IL', description: 'Chicago-based VC focused on cybersecurity and data infrastructure.', stages: ['seed', 'series-a'], chicago: true, sectors: ['cybersecurity'] },
  { name: 'Left Lane Capital', location: 'Chicago, IL', description: 'Growth-stage consumer internet investor.', stages: ['series-a', 'series-b', 'growth'], chicago: true },
  { name: 'Invest Detroit Ventures', location: 'Detroit, MI', description: 'Early-stage fund investing in Michigan-based startups.', stages: ['pre-seed', 'seed'] },
  { name: 'Michigan Rise', location: 'Detroit, MI', description: 'Detroit-based pre-seed fund for Michigan entrepreneurs.', stages: ['pre-seed', 'seed'] },
  { name: 'Ludlow Ventures', location: 'Detroit, MI', description: 'Detroit-based seed fund investing in consumer and enterprise tech.', stages: ['seed'] },
  { name: 'Renaissance Venture Capital Fund', location: 'Ann Arbor, MI', description: 'Fund of funds investing in Michigan-connected VC funds.', stages: ['seed', 'series-a'] },
  { name: 'Drive Capital', location: 'Columbus, OH', description: 'Midwest VC fund based in Columbus, Ohio. Early- and growth-stage.', stages: ['seed', 'series-a', 'series-b'] },
  { name: 'Rev1 Ventures', location: 'Columbus, OH', description: 'Columbus-based startup investor and accelerator.', stages: ['pre-seed', 'seed'] },
  { name: 'CincyTech', location: 'Cincinnati, OH', description: 'Southwest Ohio seed-stage investor.', stages: ['pre-seed', 'seed'] },
  { name: 'JumpStart Inc', location: 'Cleveland, OH', description: 'Cleveland-based venture development organization.', stages: ['pre-seed', 'seed'] },
  { name: 'Elevate Ventures', location: 'Indianapolis, IN', description: "Indiana's most active venture fund.", stages: ['pre-seed', 'seed', 'series-a'] },
  { name: 'High Alpha', location: 'Indianapolis, IN', description: 'Venture studio and fund building enterprise SaaS companies.', stages: ['seed', 'series-a'] },
  { name: 'Allos Ventures', location: 'Indianapolis, IN', description: 'Midwest early-stage technology investor.', stages: ['seed', 'series-a'] },
  { name: 'Cultivation Capital', location: 'St. Louis, MO', description: 'St. Louis-based VC investing in tech and agriculture.', stages: ['seed', 'series-a'] },
  { name: 'Lewis & Clark Ventures', location: 'St. Louis, MO', description: 'Midwest-focused growth equity fund.', stages: ['series-a', 'series-b'] },
  { name: 'Matchstick Ventures', location: 'Minneapolis, MN', description: 'Seed-stage fund investing in the North and Midwest.', stages: ['seed'] },
  { name: 'Groove Capital', location: 'Minneapolis, MN', description: 'Minneapolis-based seed fund for B2B software.', stages: ['seed'] },

  // Other notable US VCs
  { name: 'Homebrew', location: 'San Francisco, CA', description: 'Seed-stage fund investing in the bottom-up economy.', stages: ['seed'] },
  { name: 'Initialized Capital', location: 'San Francisco, CA', description: 'Seed-stage fund co-founded by Alexis Ohanian.', stages: ['seed'] },
  { name: 'Floodgate', location: 'Menlo Park, CA', description: 'Seed-stage micro VC, known for early-stage technical companies.', stages: ['seed'] },
  { name: 'True Ventures', location: 'San Francisco, CA', description: 'Seed and early-stage VC focused on founders.', stages: ['seed', 'series-a'] },
  { name: 'Spark Capital', location: 'Boston, MA', description: 'VC investing from seed to growth in tech companies.', stages: ['seed', 'series-a', 'series-b'] },
  { name: 'Redpoint Ventures', location: 'Menlo Park, CA', description: 'Early and growth stage VC in enterprise and consumer tech.', stages: ['series-a', 'series-b', 'growth'] },
  { name: 'Norwest Venture Partners', location: 'Menlo Park, CA', description: 'Multi-stage VC with over $12.5B under management.', stages: ['seed', 'series-a', 'series-b', 'growth'] },
  { name: 'Mayfield Fund', location: 'Menlo Park, CA', description: 'Early-stage VC focused on enterprise and consumer sectors.', stages: ['seed', 'series-a'] },
  { name: 'Canvas Ventures', location: 'Menlo Park, CA', description: 'Early-stage fund investing in health, fintech, future of work.', stages: ['seed', 'series-a'] },
  { name: 'Revolution (Rise of the Rest)', location: 'Washington, DC', description: "Steve Case's fund investing in startups outside Silicon Valley, NYC, Boston.", stages: ['seed', 'series-a'] },
  { name: 'Crosslink Capital', location: 'San Francisco, CA', description: 'Multi-stage VC investing in tech since 1999.', stages: ['seed', 'series-a', 'series-b'] },
  { name: 'Greycroft', location: 'New York, NY', description: 'VC investing in internet and mobile companies.', stages: ['seed', 'series-a', 'series-b'] },
  { name: 'Thrive Capital', location: 'New York, NY', description: 'NYC-based VC investing in media, internet, and software.', stages: ['seed', 'series-a', 'series-b'] },
  { name: 'Felicis Ventures', location: 'Menlo Park, CA', description: 'Early-stage VC. Backed Shopify, Adyen, Credit Karma.', stages: ['seed', 'series-a'] },
  { name: 'Craft Ventures', location: 'San Francisco, CA', description: 'Early-stage VC founded by David Sacks.', stages: ['seed', 'series-a'] },
  { name: '8VC', location: 'Austin, TX', description: 'Industry-focused VC from Palantir co-founder Joe Lonsdale.', stages: ['seed', 'series-a', 'series-b'] },
  { name: 'Contrary Capital', location: 'San Francisco, CA', description: 'VC investing at the earliest stages through university talent scouts.', stages: ['pre-seed', 'seed'] },
  { name: 'Precursor Ventures', location: 'San Francisco, CA', description: 'Pre-seed VC investing in underrepresented founders.', stages: ['pre-seed', 'seed'] },
  { name: 'Harlem Capital', location: 'New York, NY', description: 'Early-stage VC investing in diverse founders.', stages: ['pre-seed', 'seed', 'series-a'] },
  { name: 'Kapor Capital', location: 'Oakland, CA', description: 'Seed-stage VC focused on closing gaps of access for underrepresented communities.', stages: ['seed'] },
  { name: 'Backstage Capital', location: 'Los Angeles, CA', description: 'VC investing in underrepresented startup founders.', stages: ['pre-seed', 'seed'] },
  { name: 'Techstars Ventures', location: 'Boulder, CO', description: 'Investment arm of Techstars accelerator network.', stages: ['pre-seed', 'seed'] },
  { name: '500 Global', location: 'San Francisco, CA', description: 'Global VC firm and accelerator, formerly 500 Startups.', stages: ['pre-seed', 'seed'] },
  { name: 'Y Combinator', location: 'San Francisco, CA', description: 'Top startup accelerator and seed investor. Backed Airbnb, Stripe, DoorDash.', stages: ['pre-seed', 'seed'] },
];

function buildSupplementalRecords() {
  console.log('\n-- Supplemental Known VC Firms --');
  const records = SUPPLEMENTAL_VC_FIRMS.map(function(firm) {
    return {
      name: firm.name,
      organization: firm.name,
      description: firm.description,
      website: null,
      location: firm.location,
      opportunity_type: firm.type || 'vc',
      stage: firm.stages || ['seed', 'series-a'],
      sectors: firm.sectors || inferSectors(firm.description),
      chicago_focused: firm.chicago || isChicagoFocused(firm.location, firm.description),
      confidence_score: 85,
      raw_input: JSON.stringify({ source: 'curated_supplemental' }),
      field_sources: { name: 'curated', location: 'curated', description: 'curated' },
    };
  });
  console.log('  Supplemental records: ' + records.length);
  return records;
}

// ── Wiki text helpers ──

function extractWikiName(cell) {
  var linkMatch = cell.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  if (linkMatch) return (linkMatch[2] || linkMatch[1]).trim();
  return cleanWikiText(cell);
}

function cleanWikiText(text) {
  if (!text) return '';
  return text
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/<ref[^/]*\/>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/'{2,}/g, '')
    .trim();
}

function extractWikiUrl(cell) {
  var urlMatch = cell.match(/\[?(https?:\/\/[^\s\]]+)\]?/);
  return urlMatch ? urlMatch[1] : null;
}

function extractWikiLocation(cell) {
  var text = cleanWikiText(cell);
  return extractLocation(text);
}

function isNonUSLocation(text) {
  var lower = text.toLowerCase();
  var nonUS = [
    'london', 'beijing', 'shanghai', 'tokyo', 'mumbai', 'bangalore',
    'singapore', 'hong kong', 'tel aviv', 'berlin', 'paris', 'toronto',
    'vancouver', 'sydney', 'melbourne', 'stockholm', 'amsterdam',
    'zurich', 'geneva', 'united kingdom', 'china', 'japan', 'india',
    'germany', 'france', 'canada', 'australia', 'israel', 'south korea',
    'brazil', 'mexico', 'nigeria', 'kenya', 'south africa', 'dubai',
    'abu dhabi', 'saudi', 'russia', 'moscow',
  ];
  var hasNonUS = nonUS.some(function(loc) { return lower.includes(loc); });
  var hasUS = Object.keys(US_STATES).some(function(s) { return lower.includes(s); }) ||
    ['usa', 'united states', 'u.s.'].some(function(t) { return lower.includes(t); });
  return hasNonUS && !hasUS;
}

// ── Main ──

/**
 * Escape a SQL string value
 */
function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

/**
 * Convert a record to a SQL INSERT statement for funding_opportunities table
 */
function recordToSQL(r) {
  return "INSERT INTO funding_opportunities (name, organization, description, opportunity_type, website, check_size_min, check_size_max, stage, sectors, chicago_focused, featured, is_active) VALUES (" +
    sqlEscape(r.name) + ", " +
    sqlEscape(r.organization || r.name) + ", " +
    sqlEscape(r.description) + ", " +
    sqlEscape(r.opportunity_type || 'vc') + ", " +
    sqlEscape(r.website) + ", " +
    (r.check_size_min || 'NULL') + ", " +
    (r.check_size_max || 'NULL') + ", " +
    "ARRAY[" + (Array.isArray(r.stage) ? r.stage.map(sqlEscape).join(',') : '') + "]::text[], " +
    "ARRAY[" + (Array.isArray(r.sectors) ? r.sectors.map(sqlEscape).join(',') : '') + "]::text[], " +
    (r.chicago_focused ? 'true' : 'false') + ", " +
    "false, true) ON CONFLICT (name) DO NOTHING;";
}

/**
 * Save records to JSON + SQL files
 */
function saveToFiles(allRecords, source) {
  var timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // JSON output
  var jsonPath = join(OUTPUT_DIR, 'google-cse-' + source + '-' + timestamp + '.json');
  writeFileSync(jsonPath, JSON.stringify(allRecords, null, 2));
  console.log('  Saved JSON: ' + jsonPath + ' (' + allRecords.length + ' records)');

  // SQL output
  var sqlStatements = allRecords.map(recordToSQL);
  var sqlContent = '-- Google CSE + Wikipedia Harvester Output\n';
  sqlContent += '-- Source: ' + source + '\n';
  sqlContent += '-- Generated: ' + new Date().toISOString() + '\n';
  sqlContent += '-- Records: ' + allRecords.length + '\n\n';
  sqlContent += sqlStatements.join('\n') + '\n';
  var sqlPath = join(OUTPUT_DIR, 'google-cse-' + source + '-' + timestamp + '.sql');
  writeFileSync(sqlPath, sqlContent);
  console.log('  Saved SQL:  ' + sqlPath);

  return { jsonPath: jsonPath, sqlPath: sqlPath };
}

async function tryInsertToStaging(records, source) {
  try {
    var stats = await insertToStaging(records, source);
    return stats;
  } catch (err) {
    console.log('  Staging insert failed for ' + source + ': ' + err.message);
    console.log('  Records saved to files (use SQL file to import manually).');
    return { inserted: 0, skipped: 0, errors: records.length };
  }
}

async function main() {
  console.log('=== Google CSE + Wikipedia Investor Harvester ===');
  console.log('Started at ' + new Date().toISOString() + '\n');

  var allStats = {};
  var allRecordsBySource = {};

  // 1. Try Google CSE
  var cseResult = await harvestGoogleCSE();
  var cseRecords = cseResult.records;
  allRecordsBySource.google_cse = cseRecords;
  if (cseRecords.length > 0) {
    saveToFiles(cseRecords, 'google_cse');
    allStats.google_cse = await tryInsertToStaging(cseRecords, 'google_cse');
  } else {
    console.log('  No CSE records to insert.');
    allStats.google_cse = { inserted: 0, skipped: 0, errors: 0 };
  }

  // 2. Wikipedia VC firms list
  var wikiVCRecords = await harvestWikipediaVC();
  allRecordsBySource.wikipedia_vc = wikiVCRecords;
  if (wikiVCRecords.length > 0) {
    saveToFiles(wikiVCRecords, 'wikipedia_vc');
    allStats.wikipedia_vc = await tryInsertToStaging(wikiVCRecords, 'wikipedia_vc');
  } else {
    console.log('  No Wikipedia VC records to insert.');
    allStats.wikipedia_vc = { inserted: 0, skipped: 0, errors: 0 };
  }

  // 3. Wikipedia angel investors
  var wikiAngelRecords = await harvestWikipediaAngels();
  allRecordsBySource.wikipedia_angel = wikiAngelRecords;
  if (wikiAngelRecords.length > 0) {
    saveToFiles(wikiAngelRecords, 'wikipedia_angel');
    allStats.wikipedia_angel = await tryInsertToStaging(wikiAngelRecords, 'wikipedia_angel');
  } else {
    console.log('  No Wikipedia angel records to insert.');
    allStats.wikipedia_angel = { inserted: 0, skipped: 0, errors: 0 };
  }

  // 4. Supplemental well-known firms
  var supplementalRecords = buildSupplementalRecords();
  allRecordsBySource.curated_vc = supplementalRecords;
  if (supplementalRecords.length > 0) {
    saveToFiles(supplementalRecords, 'curated_vc');
    allStats.curated_vc = await tryInsertToStaging(supplementalRecords, 'curated_vc');
  }

  // 5. Save combined output
  var allRecords = [];
  for (var src of Object.keys(allRecordsBySource)) {
    allRecords = allRecords.concat(allRecordsBySource[src]);
  }
  if (allRecords.length > 0) {
    saveToFiles(allRecords, 'combined');
  }

  // ── Summary ──
  console.log('\n===========================================');
  console.log('         HARVEST SUMMARY');
  console.log('===========================================');
  var totalInserted = 0, totalSkipped = 0, totalErrors = 0;
  var totalRecords = 0;
  for (var source of Object.keys(allStats)) {
    var s = allStats[source];
    var srcCount = (allRecordsBySource[source] || []).length;
    totalRecords += srcCount;
    console.log('  ' + source + ': ' + srcCount + ' harvested, ' + s.inserted + ' inserted, ' + s.skipped + ' skipped, ' + s.errors + ' errors');
    totalInserted += s.inserted;
    totalSkipped += s.skipped;
    totalErrors += s.errors;
  }
  console.log('-------------------------------------------');
  console.log('  TOTAL: ' + totalRecords + ' harvested, ' + totalInserted + ' inserted, ' + totalSkipped + ' skipped, ' + totalErrors + ' errors');
  console.log('  Output dir: ' + OUTPUT_DIR);
  console.log('===========================================');
  console.log('\nFinished at ' + new Date().toISOString());
}

main().catch(function(err) {
  console.error('Fatal error:', err);
  process.exit(1);
});
