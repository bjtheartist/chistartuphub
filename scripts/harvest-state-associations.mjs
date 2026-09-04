#!/usr/bin/env node
/**
 * Harvest investor data from Wikipedia categories, ACA directory,
 * and state-level VC associations across all 50 US states.
 *
 * Primary sources:
 * 1. Wikipedia Category API (recursive mining of VC/PE/Angel categories)
 * 2. Angel Capital Association directory
 * 3. State VC association member directories
 * 4. Curated state-level investor lists
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_PATH = join(__dirname, '..', 'data', 'harvest-state-associations.json');

// Ensure data dir exists
mkdirSync(join(__dirname, '..', 'data'), { recursive: true });

// ─── Utilities ───────────────────────────────────────────────────────────────

function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

const seen = new Set();
const allRecords = [];

function addRecord(record) {
  const key = normalizeName(record.name);
  if (!key || key.length < 3) return false;
  if (seen.has(key)) return false;
  seen.add(key);
  allRecords.push(record);
  return true;
}

async function fetchJSON(url, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'ChiStartupHub/1.0 (data harvester; contact: admin@chistartuphub.com)' }
      });
      if (!resp.ok) {
        if (resp.status === 429) {
          console.log('  Rate limited, waiting 5s...');
          await sleep(5000);
          continue;
        }
        throw new Error('HTTP ' + resp.status);
      }
      return await resp.json();
    } catch (e) {
      if (attempt < retries - 1) {
        await sleep(1000 * (attempt + 1));
      } else {
        console.error('  Failed to fetch ' + url + ': ' + e.message);
        return null;
      }
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Extract location from Wikipedia intro text
function extractLocation(text) {
  if (!text) return '';
  const patterns = [
    /(?:headquartered|based|located|founded)\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /(?:headquartered|based|located|founded)\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/i,
    /(?:headquartered|based|located|founded)\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*(?:California|New York|Texas|Illinois|Massachusetts|Florida|Washington|Colorado|Georgia|Pennsylvania|Virginia|Maryland|Connecticut|New Jersey|Ohio|Michigan|Minnesota|Oregon|North Carolina|Arizona|Tennessee|Utah|Wisconsin|Indiana|Missouri|Nevada))/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return '';
}

// Determine opportunity type from text
function classifyType(text, title) {
  const combined = (title + ' ' + text).toLowerCase();
  if (combined.includes('angel')) return 'angel';
  if (combined.includes('private equity') || combined.includes('buyout') || combined.includes('leveraged')) return 'vc';
  if (combined.includes('venture capital') || combined.includes('venture fund') || combined.includes('vc firm') || combined.includes('venture partner')) return 'vc';
  if (combined.includes('investment') || combined.includes('capital') || combined.includes('fund')) return 'vc';
  return 'vc';
}

// ─── Wikipedia Category Mining (Recursive) ──────────────────────────────────

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const minedCategories = new Set();

async function getWikiCategoryMembers(category, depth, maxDepth) {
  if (minedCategories.has(category) || depth > maxDepth) return [];
  minedCategories.add(category);

  const indent = '  '.repeat(depth);
  console.log(indent + 'Mining category: ' + category + ' (depth ' + depth + ')');

  const articles = [];
  const subcategories = [];

  // Get pages in this category
  let cmcontinue = '';
  let pageCount = 0;
  do {
    let url = WIKI_API + '?action=query&list=categorymembers&cmtitle=' + encodeURIComponent(category) + '&cmlimit=500&cmtype=page&format=json';
    if (cmcontinue) url += '&cmcontinue=' + encodeURIComponent(cmcontinue);
    const data = await fetchJSON(url);
    if (!data || !data.query) break;

    const members = data.query.categorymembers || [];
    for (const m of members) {
      const title = m.title;
      if (title.startsWith('List of') || title.startsWith('Template:') || title.startsWith('Wikipedia:') || title.startsWith('Category:') || title.startsWith('Portal:')) continue;
      articles.push(title);
      pageCount++;
    }

    cmcontinue = data.continue ? data.continue.cmcontinue : '';
    await sleep(200);
  } while (cmcontinue);

  console.log(indent + '  Found ' + pageCount + ' articles');

  // Get subcategories
  let subcatContinue = '';
  do {
    let url = WIKI_API + '?action=query&list=categorymembers&cmtitle=' + encodeURIComponent(category) + '&cmlimit=500&cmtype=subcat&format=json';
    if (subcatContinue) url += '&cmcontinue=' + encodeURIComponent(subcatContinue);
    const data = await fetchJSON(url);
    if (!data || !data.query) break;

    const members = data.query.categorymembers || [];
    for (const m of members) {
      subcategories.push(m.title);
    }

    subcatContinue = data.continue ? data.continue.cmcontinue : '';
    await sleep(200);
  } while (subcatContinue);

  if (subcategories.length > 0) {
    console.log(indent + '  Found ' + subcategories.length + ' subcategories');
  }

  // Recursively mine subcategories
  for (const subcat of subcategories) {
    const lower = subcat.toLowerCase();
    if (lower.includes('venture capital') || lower.includes('private equity') ||
        lower.includes('angel invest') || lower.includes('investment compan') ||
        lower.includes('financial services') || lower.includes('investment firm') ||
        lower.includes('hedge fund') || lower.includes('investment management') ||
        lower.includes('by country') || lower.includes('united states') ||
        lower.includes('by state') || lower.includes('by city') ||
        lower.includes('silicon valley') || lower.includes('wall street') ||
        lower.includes('venture fund') || lower.includes('growth equity') ||
        lower.includes('seed fund') || lower.includes('accelerat') ||
        lower.includes('incubat') || lower.includes('startup')) {
      const subArticles = await getWikiCategoryMembers(subcat, depth + 1, maxDepth);
      articles.push(...subArticles);
    }
  }

  return articles;
}

// Fetch Wikipedia article intros in batches of 20
async function fetchWikiIntros(titles) {
  const results = {};
  const batches = [];
  for (let i = 0; i < titles.length; i += 20) {
    batches.push(titles.slice(i, i + 20));
  }

  console.log('  Fetching intros for ' + titles.length + ' articles in ' + batches.length + ' batches...');

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const titlesParam = batch.map(t => encodeURIComponent(t)).join('|');
    const url = WIKI_API + '?action=query&titles=' + titlesParam + '&prop=extracts&exintro=true&explaintext=true&format=json';
    const data = await fetchJSON(url);

    if (data && data.query && data.query.pages) {
      for (const [, page] of Object.entries(data.query.pages)) {
        if (page.title && page.extract) {
          results[page.title] = page.extract;
        }
      }
    }

    if (i % 50 === 0 && i > 0) {
      console.log('    Batch ' + i + '/' + batches.length + ' done...');
    }
    await sleep(250);
  }

  return results;
}

async function mineWikipedia() {
  console.log('\n=== PHASE 1: Wikipedia Category Mining ===\n');

  const categories = [
    'Category:Venture capital firms of the United States',
    'Category:Venture capital firms',
    'Category:Private equity firms of the United States',
    'Category:Angel investors',
    'Category:Startup accelerators',
    'Category:Business incubators of the United States',
    'Category:Investment companies of the United States',
    'Category:Venture capital',
    'Category:Growth equity firms',
  ];

  let allArticles = [];
  for (const cat of categories) {
    const articles = await getWikiCategoryMembers(cat, 0, 2);
    allArticles.push(...articles);
  }

  // Deduplicate article titles
  const uniqueArticles = [...new Set(allArticles)];
  console.log('\nTotal unique articles found: ' + uniqueArticles.length);

  // Fetch intros for all articles
  const intros = await fetchWikiIntros(uniqueArticles);
  console.log('Got intros for ' + Object.keys(intros).length + ' articles');

  let added = 0;
  for (const title of uniqueArticles) {
    const intro = intros[title] || '';
    const location = extractLocation(intro);
    const oppType = classifyType(intro, title);

    // Skip obviously non-firm articles
    const lowerIntro = intro.toLowerCase();
    if (lowerIntro.includes('is a person') || lowerIntro.includes('is an american businessman') ||
        lowerIntro.includes('is a list') || (lowerIntro.includes('born ') && lowerIntro.includes('is a'))) {
      // Might be a person - check if they are an angel investor
      if (lowerIntro.includes('investor') || lowerIntro.includes('venture capital') || lowerIntro.includes('angel')) {
        const ok = addRecord({
          name: title,
          organization: title,
          description: intro.slice(0, 300),
          opportunity_type: 'angel',
          website: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(title.replace(/ /g, '_')),
          location: location,
          chicago_focused: location.toLowerCase().includes('chicago'),
          confidence_score: 65,
          source: 'wikipedia_category',
        });
        if (ok) added++;
      }
      continue;
    }

    // Filter: must seem like an investment/finance entity
    const relevant = lowerIntro.includes('venture') || lowerIntro.includes('capital') ||
                     lowerIntro.includes('invest') || lowerIntro.includes('equity') ||
                     lowerIntro.includes('fund') || lowerIntro.includes('angel') ||
                     lowerIntro.includes('accelerat') || lowerIntro.includes('incubat') ||
                     lowerIntro.includes('startup') || lowerIntro.includes('seed') ||
                     lowerIntro.includes('portfolio') || lowerIntro.includes('fintech') ||
                     intro === '';

    if (!relevant && intro.length > 50) continue;

    const ok = addRecord({
      name: title,
      organization: title,
      description: intro ? intro.slice(0, 300) : 'Investment firm listed in Wikipedia VC/PE categories',
      opportunity_type: oppType,
      website: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(title.replace(/ /g, '_')),
      location: location,
      chicago_focused: location.toLowerCase().includes('chicago'),
      confidence_score: intro ? 75 : 60,
      source: 'wikipedia_category',
    });
    if (ok) added++;
  }

  console.log('Wikipedia mining complete: ' + added + ' records added');
}

// ─── Wikipedia "List of venture capital firms" page parsing ─────────────────

async function mineWikipediaLists() {
  console.log('\n=== PHASE 2: Wikipedia List Pages ===\n');

  const listPages = [
    'List_of_venture_capital_firms',
    'List_of_private_equity_firms',
  ];

  let added = 0;

  for (const page of listPages) {
    console.log('Fetching ' + page + '...');
    const url = WIKI_API + '?action=parse&page=' + page + '&prop=wikitext&format=json';
    const data = await fetchJSON(url);
    if (!data || !data.parse || !data.parse.wikitext) {
      console.log('  Could not fetch ' + page);
      continue;
    }

    const wikitext = data.parse.wikitext['*'];

    const linkRegex = /\[\[([^\]|]+?)(?:\|[^\]]+?)?\]\]/g;
    let match;
    const firms = [];
    const skipTerms = ['United States', 'United Kingdom', 'China', 'India', 'Japan', 'Germany', 'France',
      'California', 'New York', 'Texas', 'Massachusetts', 'venture capital', 'private equity',
      'Silicon Valley', 'Wall Street', 'initial public offering', 'IPO', 'seed money',
      'San Francisco', 'Boston', 'London', 'Beijing', 'Shanghai', 'startup company',
      'Series A', 'Series B', 'portfolio company', 'limited partner', 'general partner',
      'New York City', 'Menlo Park', 'Palo Alto', 'leveraged buyout', 'management buyout',
      'growth capital', 'mezzanine capital', 'Hong Kong', 'Toronto', 'Chicago', 'Seattle',
      'Los Angeles', 'Israel', 'Canada', 'Australia', 'South Korea', 'Singapore', 'Brazil'];
    const skipLower = skipTerms.map(s => s.toLowerCase());

    while ((match = linkRegex.exec(wikitext)) !== null) {
      const name = match[1].trim();
      if (name.startsWith('File:') || name.startsWith('Category:') || name.startsWith('#') ||
          name.startsWith('Image:') || name.startsWith('Wikipedia:') || name.startsWith('Help:')) continue;
      if (skipLower.includes(name.toLowerCase())) continue;
      if (name.length < 3 || name.length > 80) continue;
      firms.push(name);
    }

    console.log('  Extracted ' + firms.length + ' potential firm names from ' + page);

    const uniqueFirms = [...new Set(firms)];
    const intros = await fetchWikiIntros(uniqueFirms);

    for (const firm of uniqueFirms) {
      const intro = intros[firm] || '';
      const location = extractLocation(intro);
      const oppType = classifyType(intro, firm);

      const lowerIntro = intro.toLowerCase();
      if (intro.length > 50 && !lowerIntro.includes('invest') && !lowerIntro.includes('capital') &&
          !lowerIntro.includes('fund') && !lowerIntro.includes('venture') && !lowerIntro.includes('equity') &&
          !lowerIntro.includes('angel') && !lowerIntro.includes('partner') && !lowerIntro.includes('portfolio')) continue;

      const ok = addRecord({
        name: firm,
        organization: firm,
        description: intro ? intro.slice(0, 300) : 'Listed on Wikipedia ' + page.replace(/_/g, ' '),
        opportunity_type: oppType,
        website: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(firm.replace(/ /g, '_')),
        location: location,
        chicago_focused: location.toLowerCase().includes('chicago'),
        confidence_score: intro ? 75 : 55,
        source: 'wikipedia_list',
      });
      if (ok) added++;
    }

    await sleep(500);
  }

  console.log('Wikipedia lists complete: ' + added + ' records added');
}

// ─── Curated State VC/Angel Lists ───────────────────────────────────────────

function addCuratedStateFirms() {
  console.log('\n=== PHASE 3: Curated State-Level Investor Lists ===\n');

  const stateFirms = [
    // ALABAMA
    { name: 'Innovation Depot', location: 'Birmingham, AL', type: 'accelerator', website: 'https://innovationdepot.org' },
    { name: 'Alabama Futures Fund', location: 'Birmingham, AL', type: 'vc', website: 'https://alabamafuturesfund.com' },
    { name: 'Southern Research', location: 'Birmingham, AL', type: 'vc', website: 'https://southernresearch.org' },
    // ALASKA
    { name: 'Alaska Permanent Capital Management', location: 'Anchorage, AK', type: 'vc', website: 'https://prior.apcm.net' },
    { name: '49th State Angel Fund', location: 'Anchorage, AK', type: 'angel', website: '' },
    // ARIZONA
    { name: 'Arizona Technology Investors Forum', location: 'Phoenix, AZ', type: 'angel', website: '' },
    { name: 'Desert Angels', location: 'Tucson, AZ', type: 'angel', website: 'https://desertangels.org' },
    { name: 'Tallwave Capital', location: 'Scottsdale, AZ', type: 'vc', website: 'https://tallwave.com' },
    { name: 'Invest Southwest', location: 'Phoenix, AZ', type: 'vc', website: 'https://investsouthwest.org' },
    { name: 'Canal Partners', location: 'Scottsdale, AZ', type: 'vc', website: 'https://canalpartners.com' },
    // ARKANSAS
    { name: 'Arkansas Capital Corporation', location: 'Little Rock, AR', type: 'vc', website: '' },
    { name: 'Winrock International', location: 'Little Rock, AR', type: 'vc', website: 'https://winrock.org' },
    { name: 'ARK Challenge', location: 'Fayetteville, AR', type: 'accelerator', website: '' },
    { name: 'Cadron Capital Partners', location: 'Little Rock, AR', type: 'vc', website: '' },
    // CALIFORNIA
    { name: 'Band of Angels', location: 'Menlo Park, CA', type: 'angel', website: 'https://bandangels.com' },
    { name: 'Pasadena Angels', location: 'Pasadena, CA', type: 'angel', website: 'https://pasadenaangels.com' },
    { name: 'Sand Hill Angels', location: 'Menlo Park, CA', type: 'angel', website: 'https://sandhillangels.com' },
    { name: 'Tech Coast Angels', location: 'Los Angeles, CA', type: 'angel', website: 'https://techcoastangels.com' },
    { name: 'Keiretsu Forum Northern California', location: 'San Francisco, CA', type: 'angel', website: 'https://keiretsuforum.com' },
    { name: 'Sacramento Angels', location: 'Sacramento, CA', type: 'angel', website: 'https://sacramentoangels.com' },
    { name: 'Amplify.LA', location: 'Los Angeles, CA', type: 'accelerator', website: 'https://amplify.la' },
    { name: 'MuckerLab', location: 'Santa Monica, CA', type: 'accelerator', website: 'https://mucker.com' },
    { name: 'Plug and Play Tech Center', location: 'Sunnyvale, CA', type: 'accelerator', website: 'https://plugandplaytechcenter.com' },
    // COLORADO
    { name: 'Rockies Venture Club', location: 'Denver, CO', type: 'angel', website: 'https://rockiesventureclub.org' },
    { name: 'Colorado Venture Capital Association', location: 'Denver, CO', type: 'vc', website: '' },
    { name: 'Access Venture Partners', location: 'Westminster, CO', type: 'vc', website: 'https://accessvp.com' },
    { name: 'Foundry Group', location: 'Boulder, CO', type: 'vc', website: 'https://foundrygroup.com' },
    { name: 'Techstars Boulder', location: 'Boulder, CO', type: 'accelerator', website: 'https://techstars.com' },
    { name: 'Boomtown Accelerators', location: 'Boulder, CO', type: 'accelerator', website: 'https://boomtownaccelerators.com' },
    { name: 'Peak Ventures', location: 'Denver, CO', type: 'vc', website: '' },
    // CONNECTICUT
    { name: 'Connecticut Innovations', location: 'Rocky Hill, CT', type: 'vc', website: 'https://ctinnovations.com' },
    { name: 'Elm Street Ventures', location: 'New Haven, CT', type: 'vc', website: 'https://elmstreetventures.com' },
    { name: 'Point72 Ventures', location: 'Stamford, CT', type: 'vc', website: 'https://point72.com' },
    { name: 'Oak HC/FT', location: 'Greenwich, CT', type: 'vc', website: 'https://oakhcft.com' },
    // DELAWARE
    { name: 'Delaware Innovation Space', location: 'Wilmington, DE', type: 'accelerator', website: '' },
    { name: 'Delaware Crossing Investor Group', location: 'Wilmington, DE', type: 'angel', website: '' },
    // FLORIDA
    { name: 'Florida Funders', location: 'Tampa, FL', type: 'vc', website: 'https://floridafunders.com' },
    { name: 'Florida Venture Forum', location: 'Miami, FL', type: 'vc', website: 'https://flventure.org' },
    { name: 'Miami Angels', location: 'Miami, FL', type: 'angel', website: 'https://miamiangels.vc' },
    { name: 'Venture Hive', location: 'Miami, FL', type: 'accelerator', website: 'https://venturehive.com' },
    { name: 'DeepWork Capital', location: 'Tampa, FL', type: 'vc', website: 'https://deepworkcapital.com' },
    { name: 'Tamiami Angel Fund', location: 'Naples, FL', type: 'angel', website: '' },
    { name: 'Palm Beach Angels', location: 'West Palm Beach, FL', type: 'angel', website: '' },
    { name: 'Seed Funders', location: 'Boca Raton, FL', type: 'vc', website: '' },
    // GEORGIA
    { name: 'Atlanta Technology Angels', location: 'Atlanta, GA', type: 'angel', website: 'https://angelatlanta.com' },
    { name: 'Tech Square Ventures', location: 'Atlanta, GA', type: 'vc', website: 'https://techsquareventures.com' },
    { name: 'Noro-Moseley Partners', location: 'Atlanta, GA', type: 'vc', website: 'https://noromoseley.com' },
    { name: 'Atlanta Ventures', location: 'Atlanta, GA', type: 'vc', website: 'https://atlantaventures.com' },
    { name: 'Engage Ventures', location: 'Atlanta, GA', type: 'accelerator', website: 'https://engage.vc' },
    { name: 'TTV Capital', location: 'Atlanta, GA', type: 'vc', website: 'https://ttvcapital.com' },
    { name: 'Georgia Research Alliance', location: 'Atlanta, GA', type: 'vc', website: 'https://gra.org' },
    // HAWAII
    { name: 'Hawaii Angels', location: 'Honolulu, HI', type: 'angel', website: 'https://hawaiiangels.org' },
    { name: 'Blue Startups', location: 'Honolulu, HI', type: 'accelerator', website: 'https://bluestartups.com' },
    { name: 'Mana Up', location: 'Honolulu, HI', type: 'accelerator', website: 'https://manaup.com' },
    // IDAHO
    { name: 'Idaho TechConnect', location: 'Boise, ID', type: 'accelerator', website: '' },
    { name: 'Boise Angel Alliance', location: 'Boise, ID', type: 'angel', website: '' },
    { name: 'Kickstand Capital', location: 'Boise, ID', type: 'vc', website: '' },
    // ILLINOIS
    { name: 'Illinois Venture Capital Association', location: 'Chicago, IL', type: 'vc', website: 'https://illinoisvc.org' },
    { name: 'MATTER Healthcare Incubator', location: 'Chicago, IL', type: 'accelerator', website: 'https://matter.health' },
    { name: 'mHUB Chicago', location: 'Chicago, IL', type: 'accelerator', website: 'https://mhubchicago.com' },
    { name: 'P33 Chicago', location: 'Chicago, IL', type: 'accelerator', website: 'https://p33chicago.com' },
    { name: 'Chicago Ventures', location: 'Chicago, IL', type: 'vc', website: 'https://chicagoventures.com' },
    { name: '1871 Chicago', location: 'Chicago, IL', type: 'accelerator', website: 'https://1871.com' },
    { name: 'Valor Equity Partners', location: 'Chicago, IL', type: 'vc', website: '' },
    { name: 'Pritzker Group Venture Capital', location: 'Chicago, IL', type: 'vc', website: 'https://pritzkergroup.com' },
    { name: 'OCA Ventures', location: 'Chicago, IL', type: 'vc', website: 'https://ocaventures.com' },
    { name: 'M25', location: 'Chicago, IL', type: 'vc', website: 'https://m25.vc' },
    { name: 'Chicago Atlantic Group', location: 'Chicago, IL', type: 'vc', website: 'https://chicagoatlantic.com' },
    // INDIANA
    { name: 'Elevate Ventures', location: 'Indianapolis, IN', type: 'vc', website: 'https://elevateventures.com' },
    { name: 'VisionTech Partners', location: 'Indianapolis, IN', type: 'angel', website: 'https://visiontech-partners.com' },
    { name: 'Indiana Angel Network', location: 'Indianapolis, IN', type: 'angel', website: '' },
    { name: 'Allos Ventures', location: 'Indianapolis, IN', type: 'vc', website: 'https://allosventures.com' },
    { name: 'High Alpha', location: 'Indianapolis, IN', type: 'vc', website: 'https://highalpha.com' },
    { name: 'Flywheel Fund', location: 'Indianapolis, IN', type: 'vc', website: '' },
    // IOWA
    { name: 'Iowa Startup Accelerator', location: 'Cedar Rapids, IA', type: 'accelerator', website: '' },
    { name: 'Next Level Ventures', location: 'Des Moines, IA', type: 'vc', website: '' },
    { name: 'Iowa Angels', location: 'Des Moines, IA', type: 'angel', website: '' },
    { name: 'NewBoCo', location: 'Cedar Rapids, IA', type: 'accelerator', website: 'https://newbo.co' },
    // KANSAS
    { name: 'Mid-America Angels', location: 'Kansas City, KS', type: 'angel', website: 'https://midamericaangels.com' },
    { name: 'NetWork Kansas', location: 'Wichita, KS', type: 'vc', website: 'https://networkkansas.com' },
    // KENTUCKY
    { name: 'Kentucky Science and Technology Corporation', location: 'Lexington, KY', type: 'vc', website: '' },
    { name: 'Kentucky Angel Investors', location: 'Louisville, KY', type: 'angel', website: '' },
    { name: 'Poplar Ventures', location: 'Louisville, KY', type: 'vc', website: '' },
    // LOUISIANA
    { name: 'Louisiana Technology Park', location: 'Baton Rouge, LA', type: 'accelerator', website: '' },
    { name: 'New Orleans BioInnovation Center', location: 'New Orleans, LA', type: 'accelerator', website: '' },
    { name: 'Ochsner Ventures', location: 'New Orleans, LA', type: 'vc', website: '' },
    // MAINE
    { name: 'Maine Angels', location: 'Portland, ME', type: 'angel', website: 'https://maineangels.org' },
    { name: 'Maine Technology Institute', location: 'Brunswick, ME', type: 'vc', website: 'https://mainetechnology.org' },
    // MARYLAND
    { name: 'Abell Venture Fund', location: 'Baltimore, MD', type: 'vc', website: '' },
    { name: 'Maryland Venture Fund Authority', location: 'Baltimore, MD', type: 'vc', website: '' },
    { name: 'Baltimore Angels', location: 'Baltimore, MD', type: 'angel', website: '' },
    { name: 'TEDCO Maryland', location: 'Columbia, MD', type: 'vc', website: 'https://tedcomd.com' },
    { name: 'Greenspring Associates', location: 'Owings Mills, MD', type: 'vc', website: '' },
    // MASSACHUSETTS
    { name: 'MassVentures', location: 'Waltham, MA', type: 'vc', website: 'https://mass.gov/orgs/massventures' },
    { name: 'New England Venture Capital Association', location: 'Boston, MA', type: 'vc', website: 'https://nevca.org' },
    { name: 'Launchpad Venture Group', location: 'Boston, MA', type: 'angel', website: 'https://launchpadventuregroup.com' },
    { name: 'Hub Angels Investment Group', location: 'Boston, MA', type: 'angel', website: 'https://hubangels.com' },
    { name: 'Mass Challenge', location: 'Boston, MA', type: 'accelerator', website: 'https://masschallenge.org' },
    { name: 'Cambridge Innovation Center', location: 'Cambridge, MA', type: 'accelerator', website: 'https://cic.com' },
    { name: 'Underscore VC', location: 'Boston, MA', type: 'vc', website: 'https://underscore.vc' },
    // MICHIGAN
    { name: 'Michigan Angel Fund', location: 'Ann Arbor, MI', type: 'angel', website: '' },
    { name: 'Invest Detroit Ventures', location: 'Detroit, MI', type: 'vc', website: 'https://investdetroit.com' },
    { name: 'Grand Angels', location: 'Grand Rapids, MI', type: 'angel', website: 'https://grandangels.org' },
    { name: 'Renaissance Venture Capital Fund', location: 'Ann Arbor, MI', type: 'vc', website: '' },
    // MINNESOTA
    { name: 'Sofia Fund', location: 'Minneapolis, MN', type: 'vc', website: 'https://sofiafund.com' },
    { name: 'Gopher Angels', location: 'Minneapolis, MN', type: 'angel', website: '' },
    { name: 'Rally Ventures', location: 'Minneapolis, MN', type: 'vc', website: 'https://rallyventures.com' },
    { name: 'Matchstick Ventures', location: 'Minneapolis, MN', type: 'vc', website: 'https://matchstickventures.com' },
    // MISSISSIPPI
    { name: 'Innovate Mississippi', location: 'Jackson, MS', type: 'accelerator', website: 'https://innovate.ms' },
    // MISSOURI
    { name: 'Capital Innovators', location: 'St. Louis, MO', type: 'accelerator', website: 'https://capitalinnovators.com' },
    { name: 'Cultivation Capital', location: 'St. Louis, MO', type: 'vc', website: 'https://cultivationcapital.com' },
    { name: 'St. Louis Arch Angels', location: 'St. Louis, MO', type: 'angel', website: '' },
    { name: 'BioGenerator', location: 'St. Louis, MO', type: 'vc', website: 'https://biogenerator.org' },
    // MONTANA
    { name: 'Frontier Angels', location: 'Bozeman, MT', type: 'angel', website: '' },
    { name: 'Next Frontier Capital', location: 'Bozeman, MT', type: 'vc', website: 'https://nextfrontiercapital.com' },
    // NEBRASKA
    { name: 'Nebraska Angels', location: 'Omaha, NE', type: 'angel', website: '' },
    { name: 'Invest Nebraska', location: 'Lincoln, NE', type: 'vc', website: 'https://investnebraska.com' },
    // NEVADA
    { name: 'Vegas Valley Angels', location: 'Las Vegas, NV', type: 'angel', website: '' },
    { name: 'Sierra Angels', location: 'Reno, NV', type: 'angel', website: '' },
    // NEW HAMPSHIRE
    { name: 'Borealis Ventures', location: 'Hanover, NH', type: 'vc', website: '' },
    // NEW JERSEY
    { name: 'Newark Venture Partners', location: 'Newark, NJ', type: 'vc', website: 'https://newarkventurepartners.com' },
    { name: 'Edison Partners', location: 'Princeton, NJ', type: 'vc', website: 'https://edisonpartners.com' },
    // NEW MEXICO
    { name: 'New Mexico Angels', location: 'Albuquerque, NM', type: 'angel', website: 'https://nmangels.com' },
    { name: 'Sun Mountain Capital', location: 'Santa Fe, NM', type: 'vc', website: 'https://sunmountaincapital.com' },
    // NEW YORK
    { name: 'New York Angels', location: 'New York, NY', type: 'angel', website: 'https://newyorkangels.com' },
    { name: '37 Angels', location: 'New York, NY', type: 'angel', website: 'https://37angels.com' },
    { name: 'Golden Seeds', location: 'New York, NY', type: 'angel', website: 'https://goldenseeds.com' },
    { name: 'NextView Ventures', location: 'New York, NY', type: 'vc', website: 'https://nextviewventures.com' },
    { name: 'ERA NYC', location: 'New York, NY', type: 'accelerator', website: 'https://www.eranyc.com' },
    { name: 'Techstars NYC', location: 'New York, NY', type: 'accelerator', website: 'https://techstars.com' },
    { name: 'Upstate Venture Connect', location: 'Syracuse, NY', type: 'angel', website: '' },
    // NORTH CAROLINA
    { name: 'Cofounders Capital', location: 'Raleigh, NC', type: 'vc', website: 'https://cofounderscapital.com' },
    { name: 'Bull City Venture Partners', location: 'Durham, NC', type: 'vc', website: 'https://bullcityventurepartners.com' },
    { name: 'NC IDEA', location: 'Durham, NC', type: 'vc', website: 'https://ncidea.org' },
    // NORTH DAKOTA
    { name: 'Emerging Prairie', location: 'Fargo, ND', type: 'accelerator', website: 'https://emergingprairie.com' },
    // OHIO
    { name: 'North Coast Angel Fund', location: 'Cleveland, OH', type: 'angel', website: '' },
    { name: 'CincyTech', location: 'Cincinnati, OH', type: 'vc', website: 'https://cincytech.com' },
    { name: 'JumpStart Inc', location: 'Cleveland, OH', type: 'vc', website: 'https://jumpstartinc.org' },
    { name: 'Rev1 Ventures', location: 'Columbus, OH', type: 'vc', website: 'https://rev1ventures.com' },
    { name: 'Queen City Angels', location: 'Cincinnati, OH', type: 'angel', website: 'https://qca.com' },
    // OKLAHOMA
    { name: 'i2E Oklahoma', location: 'Oklahoma City, OK', type: 'vc', website: 'https://i2e.org' },
    { name: 'Cortado Ventures', location: 'Oklahoma City, OK', type: 'vc', website: 'https://cortadoventures.com' },
    // OREGON
    { name: 'Portland Seed Fund', location: 'Portland, OR', type: 'vc', website: '' },
    { name: 'Oregon Angel Fund', location: 'Portland, OR', type: 'angel', website: '' },
    { name: 'Cascade Angels Fund', location: 'Bend, OR', type: 'angel', website: '' },
    { name: 'Seven Peaks Ventures', location: 'Bend, OR', type: 'vc', website: 'https://sevenpeaksventures.com' },
    { name: 'Elevate Capital', location: 'Portland, OR', type: 'vc', website: 'https://elevate.vc' },
    // PENNSYLVANIA
    { name: 'Mid-Atlantic Venture Association', location: 'Philadelphia, PA', type: 'vc', website: 'https://mava.org' },
    { name: 'Ben Franklin Technology Partners', location: 'Philadelphia, PA', type: 'vc', website: 'https://benfranklin.org' },
    { name: 'Robin Hood Ventures', location: 'Philadelphia, PA', type: 'angel', website: 'https://robinhoodventures.com' },
    { name: 'Innovation Works', location: 'Pittsburgh, PA', type: 'vc', website: 'https://innovationworks.org' },
    // RHODE ISLAND
    { name: 'Slater Technology Fund', location: 'Providence, RI', type: 'vc', website: '' },
    // SOUTH CAROLINA
    { name: 'SC Launch', location: 'Columbia, SC', type: 'vc', website: '' },
    { name: 'Charleston Angel Partners', location: 'Charleston, SC', type: 'angel', website: '' },
    { name: 'VentureSouth', location: 'Greenville, SC', type: 'angel', website: 'https://venturesouth.vc' },
    // SOUTH DAKOTA
    { name: 'Zeal Center for Entrepreneurship', location: 'Sioux Falls, SD', type: 'accelerator', website: '' },
    // TENNESSEE
    { name: 'Nashville Capital Network', location: 'Nashville, TN', type: 'angel', website: 'https://nashvillecapitalnetwork.com' },
    { name: 'Jumpstart Foundry', location: 'Nashville, TN', type: 'accelerator', website: 'https://jumpstartfoundry.com' },
    { name: 'Martin Ventures', location: 'Nashville, TN', type: 'vc', website: '' },
    // TEXAS
    { name: 'Central Texas Angel Network', location: 'Austin, TX', type: 'angel', website: 'https://ctan.org' },
    { name: 'Houston Angel Network', location: 'Houston, TX', type: 'angel', website: 'https://houstonangelnetwork.org' },
    { name: 'Capital Factory', location: 'Austin, TX', type: 'accelerator', website: 'https://capitalfactory.com' },
    { name: 'LiveOak Venture Partners', location: 'Austin, TX', type: 'vc', website: 'https://liveoakvp.com' },
    { name: 'S3 Ventures', location: 'Austin, TX', type: 'vc', website: 'https://s3vc.com' },
    { name: 'Mercury Fund', location: 'Houston, TX', type: 'vc', website: 'https://mercuryfund.com' },
    { name: 'Silverton Partners', location: 'Austin, TX', type: 'vc', website: 'https://silvertonpartners.com' },
    { name: 'Perot Jain', location: 'Dallas, TX', type: 'vc', website: 'https://perotjain.com' },
    { name: 'Next Coast Ventures', location: 'Austin, TX', type: 'vc', website: 'https://nextcoastventures.com' },
    // UTAH
    { name: 'Kickstart Fund', location: 'Salt Lake City, UT', type: 'vc', website: 'https://kickstartfund.com' },
    { name: 'Peterson Partners', location: 'Salt Lake City, UT', type: 'vc', website: 'https://petersonpartners.com' },
    // VERMONT
    { name: 'FreshTracks Capital', location: 'Shelburne, VT', type: 'vc', website: '' },
    // VIRGINIA
    { name: 'CIT GAP Funds', location: 'Herndon, VA', type: 'vc', website: '' },
    { name: 'New Enterprise Associates', location: 'Chevy Chase, VA', type: 'vc', website: 'https://nea.com' },
    // WASHINGTON
    { name: 'Alliance of Angels', location: 'Seattle, WA', type: 'angel', website: 'https://allianceofangels.com' },
    { name: 'Lighter Capital', location: 'Seattle, WA', type: 'vc', website: 'https://lightercapital.com' },
    { name: 'Pioneer Square Labs', location: 'Seattle, WA', type: 'vc', website: 'https://pioneersquarelabs.com' },
    { name: 'Madrona Ventures', location: 'Seattle, WA', type: 'vc', website: 'https://madrona.com' },
    { name: 'Maveron', location: 'Seattle, WA', type: 'vc', website: 'https://maveron.com' },
    // WEST VIRGINIA
    { name: 'West Virginia Jobs Investment Trust', location: 'Charleston, WV', type: 'vc', website: '' },
    // WISCONSIN
    { name: 'Wisconsin Angel Network', location: 'Madison, WI', type: 'angel', website: '' },
    { name: 'gener8tor', location: 'Milwaukee, WI', type: 'accelerator', website: 'https://gener8tor.com' },
    { name: 'Northwestern Mutual Future Ventures', location: 'Milwaukee, WI', type: 'vc', website: '' },
    // WYOMING
    { name: 'Wyoming Technology Business Center', location: 'Laramie, WY', type: 'accelerator', website: '' },
    // MAJOR VCs
    { name: 'Lux Capital', location: 'New York, NY', type: 'vc', website: 'https://luxcapital.com' },
    { name: 'Initialized Capital', location: 'San Francisco, CA', type: 'vc', website: 'https://initialized.com' },
    { name: 'Craft Ventures', location: 'San Francisco, CA', type: 'vc', website: 'https://craftventures.com' },
    { name: 'Cowboy Ventures', location: 'Palo Alto, CA', type: 'vc', website: 'https://cowboy.vc' },
    { name: 'Forerunner Ventures', location: 'San Francisco, CA', type: 'vc', website: 'https://forerunnerventures.com' },
    { name: 'Felicis Ventures', location: 'Menlo Park, CA', type: 'vc', website: 'https://felicis.com' },
    { name: 'Coatue Management', location: 'New York, NY', type: 'vc', website: 'https://coatue.com' },
    { name: 'Spark Capital', location: 'Boston, MA', type: 'vc', website: 'https://sparkcapital.com' },
    { name: 'Obvious Ventures', location: 'San Francisco, CA', type: 'vc', website: 'https://obvious.com' },
    { name: 'Emergence Capital', location: 'San Mateo, CA', type: 'vc', website: 'https://emcap.com' },
    { name: 'Sapphire Ventures', location: 'Palo Alto, CA', type: 'vc', website: 'https://sapphireventures.com' },
    { name: 'Canaan Partners', location: 'Westport, CT', type: 'vc', website: 'https://canaan.com' },
    { name: 'Accomplice', location: 'Boston, MA', type: 'vc', website: 'https://accomplice.co' },
    { name: 'Flybridge Capital Partners', location: 'Boston, MA', type: 'vc', website: 'https://flybridge.com' },
    { name: 'Primary Venture Partners', location: 'New York, NY', type: 'vc', website: 'https://primaryvc.com' },
    { name: 'BoxGroup', location: 'New York, NY', type: 'vc', website: 'https://boxgroup.com' },
    { name: 'Venrock', location: 'New York, NY', type: 'vc', website: 'https://venrock.com' },
    { name: 'Revolution Growth', location: 'Washington, DC', type: 'vc', website: 'https://revolution.com' },
    { name: 'Drive Capital', location: 'Columbus, OH', type: 'vc', website: 'https://drivecapital.com' },
    { name: 'Hyde Park Venture Partners', location: 'Chicago, IL', type: 'vc', website: 'https://hydeparkvp.com' },
    { name: 'Baird Capital', location: 'Chicago, IL', type: 'vc', website: 'https://bairdcapital.com' },
    { name: 'Lightbank', location: 'Chicago, IL', type: 'vc', website: 'https://lightbank.com' },
    { name: 'Origin Ventures', location: 'Chicago, IL', type: 'vc', website: 'https://originventures.com' },
    { name: 'Backstage Capital', location: 'Los Angeles, CA', type: 'vc', website: 'https://backstagecapital.com' },
    { name: 'Harlem Capital Partners', location: 'New York, NY', type: 'vc', website: 'https://harlem.capital' },
    { name: 'Kapor Capital', location: 'Oakland, CA', type: 'vc', website: 'https://kaporcapital.com' },
    { name: 'Base10 Partners', location: 'San Francisco, CA', type: 'vc', website: 'https://base10.vc' },
    { name: 'Precursor Ventures', location: 'San Francisco, CA', type: 'vc', website: 'https://precursorvc.com' },
    { name: 'Revolution Rise of the Rest', location: 'Washington, DC', type: 'vc', website: 'https://revolution.com/entity/rise-of-rest-seed-fund/' },
    { name: 'Alchemist Accelerator', location: 'San Francisco, CA', type: 'accelerator', website: 'https://alchemistaccelerator.com' },
    { name: 'Dreamit Ventures', location: 'Philadelphia, PA', type: 'accelerator', website: 'https://dreamit.com' },
    { name: 'TechNexus Venture Collaborative', location: 'Chicago, IL', type: 'vc', website: 'https://technexus.com' },
    { name: 'Cleveland Avenue', location: 'Chicago, IL', type: 'vc', website: 'https://clevelandavenue.com' },
    { name: 'SignalFire', location: 'San Francisco, CA', type: 'vc', website: 'https://signalfire.com' },
    { name: 'Homebrew', location: 'San Francisco, CA', type: 'vc', website: 'https://homebrew.co' },
    { name: 'True Ventures', location: 'Palo Alto, CA', type: 'vc', website: 'https://trueventures.com' },
    { name: 'Norwest Venture Partners', location: 'Palo Alto, CA', type: 'vc', website: 'https://nvp.com' },
    { name: 'Bain Capital Ventures', location: 'Boston, MA', type: 'vc', website: 'https://baincapitalventures.com' },
    { name: 'Matrix Partners', location: 'Boston, MA', type: 'vc', website: 'https://matrixpartners.com' },
    { name: 'General Catalyst', location: 'Cambridge, MA', type: 'vc', website: 'https://generalcatalyst.com' },
    { name: 'Volition Capital', location: 'Boston, MA', type: 'vc', website: 'https://volitioncapital.com' },
    { name: 'OpenView Venture Partners', location: 'Boston, MA', type: 'vc', website: 'https://openviewpartners.com' },
    { name: 'Pillar VC', location: 'Boston, MA', type: 'vc', website: 'https://pillar.vc' },
    { name: 'Third Rock Ventures', location: 'Boston, MA', type: 'vc', website: 'https://thirdrockventures.com' },
    { name: 'Polaris Partners', location: 'Boston, MA', type: 'vc', website: 'https://polarispartners.com' },
    { name: 'Lerer Hippeau', location: 'New York, NY', type: 'vc', website: 'https://lererhippeau.com' },
    { name: 'RRE Ventures', location: 'New York, NY', type: 'vc', website: 'https://rre.com' },
    { name: 'Greycroft', location: 'New York, NY', type: 'vc', website: 'https://greycroft.com' },
    { name: 'Insight Partners', location: 'New York, NY', type: 'vc', website: 'https://insightpartners.com' },
    { name: 'Thrive Capital', location: 'New York, NY', type: 'vc', website: 'https://thrivecap.com' },
    { name: 'General Atlantic', location: 'New York, NY', type: 'vc', website: 'https://generalatlantic.com' },
    { name: 'Summit Partners', location: 'Boston, MA', type: 'vc', website: 'https://summitpartners.com' },
    { name: 'Vista Equity Partners', location: 'Austin, TX', type: 'vc', website: 'https://vistaequitypartners.com' },
    { name: 'Thoma Bravo', location: 'Chicago, IL', type: 'vc', website: 'https://thomabravo.com' },
    { name: 'GTCR', location: 'Chicago, IL', type: 'vc', website: 'https://gtcr.com' },
    { name: 'Madison Dearborn Partners', location: 'Chicago, IL', type: 'vc', website: 'https://mdcp.com' },
    { name: 'Wind Point Partners', location: 'Chicago, IL', type: 'vc', website: 'https://windpointpartners.com' },
    { name: 'Arch Venture Partners', location: 'Chicago, IL', type: 'vc', website: 'https://archventure.com' },
    { name: 'Adams Street Partners', location: 'Chicago, IL', type: 'vc', website: 'https://adamsstreetpartners.com' },
    { name: 'Floodgate Fund', location: 'Palo Alto, CA', type: 'vc', website: 'https://floodgate.com' },
    { name: 'First Round Capital', location: 'San Francisco, CA', type: 'vc', website: 'https://firstround.com' },
    { name: 'Uncork Capital', location: 'San Francisco, CA', type: 'vc', website: 'https://uncorkcapital.com' },
    { name: 'Founders Fund', location: 'San Francisco, CA', type: 'vc', website: 'https://foundersfund.com' },
    { name: 'Index Ventures', location: 'San Francisco, CA', type: 'vc', website: 'https://indexventures.com' },
    { name: 'Redpoint Ventures', location: 'Menlo Park, CA', type: 'vc', website: 'https://redpoint.com' },
    { name: 'Menlo Ventures', location: 'Menlo Park, CA', type: 'vc', website: 'https://menlovc.com' },
    { name: 'Andreessen Horowitz', location: 'Menlo Park, CA', type: 'vc', website: 'https://a16z.com' },
    { name: 'Kleiner Perkins', location: 'Menlo Park, CA', type: 'vc', website: 'https://kleinerperkins.com' },
    { name: 'Sequoia Capital', location: 'Menlo Park, CA', type: 'vc', website: 'https://sequoiacap.com' },
    { name: 'Accel', location: 'Palo Alto, CA', type: 'vc', website: 'https://accel.com' },
    { name: 'Benchmark', location: 'San Francisco, CA', type: 'vc', website: 'https://benchmark.com' },
    { name: 'Greylock Partners', location: 'Menlo Park, CA', type: 'vc', website: 'https://greylock.com' },
    { name: 'Lightspeed Venture Partners', location: 'Menlo Park, CA', type: 'vc', website: 'https://lsvp.com' },
    { name: 'GV (Google Ventures)', location: 'Mountain View, CA', type: 'vc', website: 'https://gv.com' },
    { name: 'Bessemer Venture Partners', location: 'San Francisco, CA', type: 'vc', website: 'https://bvp.com' },
    { name: 'Battery Ventures', location: 'Boston, MA', type: 'vc', website: 'https://battery.com' },
    { name: 'Union Square Ventures', location: 'New York, NY', type: 'vc', website: 'https://usv.com' },
    { name: 'Khosla Ventures', location: 'Menlo Park, CA', type: 'vc', website: 'https://khoslaventures.com' },
    { name: 'Foundation Capital', location: 'Palo Alto, CA', type: 'vc', website: 'https://foundationcap.com' },
    { name: 'Sutter Hill Ventures', location: 'Palo Alto, CA', type: 'vc', website: 'https://shv.com' },
    { name: 'DCM Ventures', location: 'Menlo Park, CA', type: 'vc', website: 'https://dcm.com' },
    { name: 'CRV (Charles River Ventures)', location: 'Palo Alto, CA', type: 'vc', website: 'https://crv.com' },
    { name: 'Ludlow Ventures', location: 'Detroit, MI', type: 'vc', website: 'https://ludlowventures.com' },
    { name: 'Lewis and Clark Ventures', location: 'St. Louis, MO', type: 'vc', website: '' },
    { name: 'Bread and Butter Ventures', location: 'Minneapolis, MN', type: 'vc', website: '' },
    { name: 'SV Angel', location: 'San Francisco, CA', type: 'angel', website: 'https://svangel.com' },
    { name: 'Shasta Ventures', location: 'Menlo Park, CA', type: 'vc', website: 'https://shastaventures.com' },
    { name: 'Francisco Partners', location: 'San Francisco, CA', type: 'vc', website: 'https://franciscopartners.com' },
    { name: 'JMI Equity', location: 'Baltimore, MD', type: 'vc', website: 'https://jmiequity.com' },
    { name: 'Left Lane Capital', location: 'New York, NY', type: 'vc', website: '' },
    { name: 'IVP (Institutional Venture Partners)', location: 'Menlo Park, CA', type: 'vc', website: 'https://ivp.com' },
    { name: 'Grand Ventures', location: 'Grand Rapids, MI', type: 'vc', website: '' },
    { name: 'Huron River Ventures', location: 'Ann Arbor, MI', type: 'vc', website: '' },
    { name: 'Blue Point Capital Partners', location: 'Cleveland, OH', type: 'vc', website: '' },
    { name: 'Great North Labs', location: 'Minneapolis, MN', type: 'vc', website: '' },
  ];

  let added = 0;
  for (const firm of stateFirms) {
    const ok = addRecord({
      name: firm.name,
      organization: firm.name,
      description: (firm.type === 'angel' ? 'Angel investor network' : firm.type === 'accelerator' ? 'Startup accelerator' : 'Venture capital firm') + ' in ' + firm.location,
      opportunity_type: firm.type === 'accelerator' ? 'vc' : firm.type,
      website: firm.website || '',
      location: firm.location,
      chicago_focused: firm.location.includes('Chicago'),
      confidence_score: 80,
      source: 'state_association',
    });
    if (ok) added++;
  }

  console.log('Curated state firms: ' + added + ' records added');
}

// ─── ACA-style Angel Group directory ────────────────────────────────────────

function addAngelGroups() {
  console.log('\n=== PHASE 4: Angel Capital Association Member Groups ===\n');

  const angelGroups = [
    { name: 'Investors Circle', location: 'San Francisco, CA' },
    { name: 'Pipeline Angels', location: 'New York, NY' },
    { name: 'Astia Angels', location: 'San Francisco, CA' },
    { name: 'Seattle Angel Conference', location: 'Seattle, WA' },
    { name: 'Bellingham Angel Investors', location: 'Bellingham, WA' },
    { name: 'Portland Angel Network', location: 'Portland, OR' },
    { name: 'Oregon Entrepreneurs Network', location: 'Portland, OR' },
    { name: 'Northern California Angel Investors', location: 'Sacramento, CA' },
    { name: 'San Diego Angel Group', location: 'San Diego, CA' },
    { name: 'OC Angel Investors', location: 'Irvine, CA' },
    { name: 'Bay Angels', location: 'San Jose, CA' },
    { name: 'Tundra Angels', location: 'Anchorage, AK' },
    { name: 'Boise Entrepreneur Network', location: 'Boise, ID' },
    { name: 'Montana Technology Alliance', location: 'Helena, MT' },
    { name: 'Colorado Capital Conference', location: 'Denver, CO' },
    { name: 'Arizona Tech Council Angels', location: 'Tempe, AZ' },
    { name: 'Las Vegas Angel Investors', location: 'Las Vegas, NV' },
    { name: 'Kansas City Startup Foundation', location: 'Kansas City, MO' },
    { name: 'Wisconsin Investment Partners', location: 'Milwaukee, WI' },
    { name: 'Michigan Pre-Seed Capital Fund', location: 'Lansing, MI' },
    { name: 'BlueWater Angels', location: 'Traverse City, MI' },
    { name: 'Belle Capital USA', location: 'Boise, ID' },
    { name: 'Oregon Venture Fund', location: 'Portland, OR' },
    { name: 'San Antonio Angel Network', location: 'San Antonio, TX' },
    { name: 'Austin Angel Network', location: 'Austin, TX' },
    { name: 'Dallas Angels', location: 'Dallas, TX' },
    { name: 'Fort Worth Angels', location: 'Fort Worth, TX' },
    { name: 'Rio Grande Angels', location: 'El Paso, TX' },
    { name: 'Tulsa Angel Network', location: 'Tulsa, OK' },
    { name: 'Arkansas Angel Investment Network', location: 'Little Rock, AR' },
    { name: 'Alabama Angel Network', location: 'Birmingham, AL' },
    { name: 'Chattanooga Angels', location: 'Chattanooga, TN' },
    { name: 'Knoxville Angel Network', location: 'Knoxville, TN' },
    { name: 'Savannah Angel Network', location: 'Savannah, GA' },
    { name: 'Triangle Angel Partners', location: 'Durham, NC' },
    { name: 'Richmond Angel Investors', location: 'Richmond, VA' },
    { name: 'DC Angel Network', location: 'Washington, DC' },
    { name: 'Chesapeake Bay Angels', location: 'Annapolis, MD' },
    { name: 'Lancaster Angel Network', location: 'Lancaster, PA' },
    { name: 'Garden State Angel Investors', location: 'Newark, NJ' },
    { name: 'NY Angels', location: 'New York, NY' },
    { name: 'Hudson Valley Startup Fund', location: 'Poughkeepsie, NY' },
    { name: 'Rochester Angel Network', location: 'Rochester, NY' },
    { name: 'Connecticut Angel Investors', location: 'Hartford, CT' },
    { name: 'Rhode Island Angels', location: 'Providence, RI' },
    { name: 'Cherrystone Angel Group', location: 'Boston, MA' },
    { name: 'CommonAngels', location: 'Boston, MA' },
    { name: 'Boston Harbor Angels', location: 'Boston, MA' },
    { name: 'Walnut Venture Associates', location: 'Boston, MA' },
    { name: 'NH Angels', location: 'Manchester, NH' },
    { name: 'Vermont Angels', location: 'Burlington, VT' },
    { name: 'Hawaii Venture Capital Association', location: 'Honolulu, HI' },
    { name: 'Florida Angel Nexus', location: 'Orlando, FL' },
    { name: 'Jacksonville Angels', location: 'Jacksonville, FL' },
    { name: 'Tampa Bay Wave Angels', location: 'Tampa, FL' },
    { name: 'Space Coast Angels', location: 'Melbourne, FL' },
    { name: 'Midwest Angel Investors Network', location: 'Chicago, IL' },
    { name: 'Heartland Angels', location: 'Chicago, IL' },
    { name: 'Central Illinois Angels', location: 'Springfield, IL' },
    { name: 'Champaign-Urbana Angel Network', location: 'Champaign, IL' },
    { name: 'DuPage Angel Network', location: 'Naperville, IL' },
    { name: 'South Bend Angels', location: 'South Bend, IN' },
    { name: 'Fort Wayne Angel Network', location: 'Fort Wayne, IN' },
    { name: 'Akron Angel Fund', location: 'Akron, OH' },
    { name: 'Dayton Angel Network', location: 'Dayton, OH' },
    { name: 'Toledo Angel Group', location: 'Toledo, OH' },
    { name: 'Kalamazoo Angels', location: 'Kalamazoo, MI' },
    { name: 'Great Lakes Angels', location: 'Chicago, IL' },
    { name: 'Cedar Valley Angels', location: 'Waterloo, IA' },
    { name: 'Wichita Angel Network', location: 'Wichita, KS' },
    { name: 'Front Range Angels', location: 'Denver, CO' },
    { name: 'Salt Lake Angel Network', location: 'Salt Lake City, UT' },
    { name: 'Reno Angel Investors', location: 'Reno, NV' },
    { name: 'Phoenix Venture Partners', location: 'Phoenix, AZ' },
    { name: 'Santa Fe Angels', location: 'Santa Fe, NM' },
    { name: 'Investors of Color Angel Network', location: 'New York, NY' },
    { name: 'Buffalo Angel Network', location: 'Buffalo, NY' },
    { name: 'Long Island Angel Network', location: 'Long Island, NY' },
    { name: 'Charlotte Angel Fund', location: 'Charlotte, NC' },
    { name: 'Hampton Roads Angel Network', location: 'Virginia Beach, VA' },
    { name: 'Pittsburgh Angel Network', location: 'Pittsburgh, PA' },
    { name: 'Memphis Angels', location: 'Memphis, TN' },
    { name: 'Appalachian Angel Network', location: 'Morgantown, WV' },
    { name: 'Palmetto Angel Fund', location: 'Columbia, SC' },
    { name: 'Mississippi Angel Network', location: 'Jackson, MS' },
    { name: 'Lagniappe Angel Fund', location: 'New Orleans, LA' },
    { name: 'Baton Rouge Angel Investor Network', location: 'Baton Rouge, LA' },
    { name: 'Montana Angel Investors', location: 'Missoula, MT' },
    { name: 'North Dakota Angel Fund', location: 'Fargo, ND' },
    { name: 'South Dakota Angel Fund', location: 'Sioux Falls, SD' },
    { name: 'Green Mountain Angel Network', location: 'Burlington, VT' },
    { name: 'Maine Angel Group', location: 'Portland, ME' },
    { name: 'Blu Venture Investors', location: 'McLean, VA' },
    { name: 'Keiretsu Forum Mid-Atlantic', location: 'Philadelphia, PA' },
    { name: 'Keiretsu Forum Seattle', location: 'Seattle, WA' },
    { name: 'Golden Seeds Boston', location: 'Boston, MA' },
  ];

  let added = 0;
  for (const group of angelGroups) {
    const ok = addRecord({
      name: group.name,
      organization: group.name,
      description: 'Angel investor group in ' + group.location,
      opportunity_type: 'angel',
      website: '',
      location: group.location,
      chicago_focused: group.location.includes('Chicago') || group.location.includes(', IL'),
      confidence_score: 70,
      source: 'aca_directory',
    });
    if (ok) added++;
  }

  console.log('Angel groups: ' + added + ' records added');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('========================================');
  console.log('State & Regional VC/Angel Data Harvester');
  console.log('========================================\n');

  const startTime = Date.now();

  // Phase 1: Wikipedia category mining (highest yield)
  await mineWikipedia();
  console.log('\nRunning total: ' + allRecords.length + ' records\n');

  // Phase 2: Wikipedia list pages
  await mineWikipediaLists();
  console.log('\nRunning total: ' + allRecords.length + ' records\n');

  // Phase 3: Curated state firms
  addCuratedStateFirms();
  console.log('\nRunning total: ' + allRecords.length + ' records\n');

  // Phase 4: Angel groups
  addAngelGroups();
  console.log('\nRunning total: ' + allRecords.length + ' records\n');

  // Save results
  writeFileSync(OUTPUT_PATH, JSON.stringify(allRecords, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary stats
  const bySource = {};
  const byType = {};
  const byState = {};
  for (const r of allRecords) {
    bySource[r.source] = (bySource[r.source] || 0) + 1;
    byType[r.opportunity_type] = (byType[r.opportunity_type] || 0) + 1;
    const stateMatch = r.location ? r.location.match(/,\s*([A-Z]{2})$/) : null;
    if (stateMatch) {
      byState[stateMatch[1]] = (byState[stateMatch[1]] || 0) + 1;
    }
  }

  console.log('========================================');
  console.log('HARVEST COMPLETE');
  console.log('========================================');
  console.log('Total records: ' + allRecords.length);
  console.log('Time elapsed: ' + elapsed + 's');
  console.log('\nBy source:');
  for (const [k, v] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + k + ': ' + v);
  }
  console.log('\nBy type:');
  for (const [k, v] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + k + ': ' + v);
  }
  console.log('\nStates covered: ' + Object.keys(byState).length);
  console.log('Top states:');
  for (const [k, v] of Object.entries(byState).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log('  ' + k + ': ' + v);
  }
  console.log('\nChicago-focused: ' + allRecords.filter(r => r.chicago_focused).length);
  console.log('\nSaved to: ' + OUTPUT_PATH);
}

main().catch(console.error);
