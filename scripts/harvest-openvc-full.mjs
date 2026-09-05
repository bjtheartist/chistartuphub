#!/usr/bin/env node
/**
 * Comprehensive Investor Harvester
 *
 * Sources:
 * 1. Micro VC CSV (GitHub Gist) - ~631 micro VC firms
 * 2. Crunchbase Investments Gist - ~20K unique investor names
 * 3. Connor11528 tech-companies VC CSV - ~60 VC firms
 * 4. Awesome OSS Investors (GitHub) - ~50 VC firms
 * 5. Devtools Angels (GitHub) - ~30 angels
 * 6. Selcuke VC Firms List (GitHub) - ~300 firms
 * 7. Evalyze-ai Top VCs/Angels - ~20 records
 * 8. GitHub API search for additional repos
 *
 * Output: data/harvest-openvc-full.json
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_PATH = join(__dirname, '..', 'data', 'harvest-openvc-full.json');

// Utilities

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchUrl(url, opts = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        ...opts,
        headers: {
          'User-Agent': 'ChiStartupHub-Research/1.0 (educational)',
          ...(opts.headers || {}),
        },
      });
      if (res.ok) return res;
      if (res.status === 429) {
        console.log('  Rate limited, waiting...');
        await sleep(3000);
        continue;
      }
      if (res.status >= 500) { await sleep(1000); continue; }
      console.log('  HTTP ' + res.status + ' for ' + url);
      return null;
    } catch (err) {
      if (i === retries - 1) { console.log('  Fetch error: ' + err.message); return null; }
      await sleep(1000);
    }
  }
  return null;
}

function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim(); });
    return obj;
  });
}

function guessOpportunityType(name, desc) {
  const text = ((name || '') + ' ' + (desc || '')).toLowerCase();
  if (text.includes('angel')) return 'angel';
  return 'vc';
}

function parseStages(stageStr) {
  if (!stageStr) return [];
  const STAGE_MAP = {
    'pre-seed': 'pre-seed', 'preseed': 'pre-seed', 'pre seed': 'pre-seed',
    'seed': 'seed',
    'series a': 'series-a', 'series-a': 'series-a',
    'series b': 'series-b', 'series-b': 'series-b',
    'series c': 'series-c', 'series-c': 'series-c',
    'growth': 'growth', 'late': 'late', 'late stage': 'late',
    'early': 'seed', 'early stage': 'seed', 'early-stage': 'seed',
    'early stage venture': 'seed', 'start-up': 'pre-seed',
    'multi stage': 'growth',
  };
  const parts = stageStr.toLowerCase().split(/[,/&]+/);
  const stages = [];
  for (const p of parts) {
    const t = p.trim();
    if (STAGE_MAP[t]) { stages.push(STAGE_MAP[t]); continue; }
    for (const [key, val] of Object.entries(STAGE_MAP)) {
      if (t.includes(key)) { stages.push(val); break; }
    }
  }
  return [...new Set(stages)];
}

function parseSectors(str) {
  if (!str) return [];
  return str.split(/[,|]+/).map(s => s.trim()).filter(Boolean);
}

function isChicagoFocused(name, location) {
  const text = ((name || '') + ' ' + (location || '')).toLowerCase();
  return text.includes('chicago') || text.includes('illinois') || text.includes(', il');
}

// Global dedup set and results
const seenNames = new Set();
const allRecords = [];

function addRecords(records, source) {
  let added = 0;
  let skipped = 0;
  for (const r of records) {
    if (!r.name || r.name.trim().length < 2) { skipped++; continue; }
    const normalized = normalizeName(r.name);
    if (seenNames.has(normalized)) { skipped++; continue; }
    seenNames.add(normalized);
    allRecords.push({
      name: r.name.trim(),
      organization: r.organization || r.name.trim(),
      description: r.description || null,
      opportunity_type: r.opportunity_type || 'vc',
      check_size_min: r.check_size_min || null,
      check_size_max: r.check_size_max || null,
      stage: r.stage || [],
      sectors: r.sectors || [],
      website: r.website || null,
      location: r.location || null,
      chicago_focused: r.chicago_focused || false,
      confidence_score: r.confidence_score || 65,
      source: source,
    });
    added++;
  }
  console.log('  [' + source + '] +' + added + ' records (' + skipped + ' skipped/dupes). Total: ' + allRecords.length);
  return added;
}

// Source 1: Micro VC CSV (GitHub Gist)
async function harvestMicroVC() {
  console.log('\n=== Source 1: Micro VC CSV Gist ===');
  const url = 'https://gist.githubusercontent.com/ZeccaLehn/15fd3212fd6b825ed3aa333d33cd7487/raw/';
  const res = await fetchUrl(url);
  if (!res) return;
  const text = await res.text();
  const rows = parseCSV(text);
  console.log('  Parsed ' + rows.length + ' rows');

  const records = rows.map(row => {
    const rawUrl = row['URL'] || '';
    return {
      name: row['Firm Name'],
      organization: row['Firm Name'],
      description: null,
      opportunity_type: 'vc',
      check_size_min: null,
      check_size_max: null,
      stage: parseStages(row['Investment Stage'] || ''),
      sectors: parseSectors(row['Investment Sector'] || ''),
      website: rawUrl.startsWith('http') ? rawUrl : (rawUrl ? 'https://' + rawUrl : null),
      location: row['Location (City)'] || null,
      chicago_focused: isChicagoFocused(row['Firm Name'], row['Location (City)']),
      confidence_score: 80,
    };
  });
  addRecords(records, 'micro_vc_gist');
}

// Source 2: Crunchbase Investments Gist
async function harvestCrunchbaseGist() {
  console.log('\n=== Source 2: Crunchbase Investments Gist ===');
  const url = 'https://gist.githubusercontent.com/jvilledieu/c766c18075f7757034d7/raw/';
  const res = await fetchUrl(url);
  if (!res) return;
  const text = await res.text();
  const lines = text.split('\n');
  console.log('  ' + lines.length + ' lines in CSV');

  const investorMap = new Map();
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts.length < 17) continue;

    const investorName = (parts[9] || '').trim();
    const investorCategory = (parts[10] || '').trim();
    const investorCountry = (parts[12] || '').trim();
    const investorState = (parts[13] || '').trim();
    const investorRegion = (parts[14] || '').trim();
    const investorCity = (parts[15] || '').trim();
    const roundType = (parts[17] || '').trim().toLowerCase();

    if (!investorName || investorName.includes('/') || investorName.length < 2) continue;

    if (!investorMap.has(investorName)) {
      investorMap.set(investorName, {
        name: investorName,
        country: investorCountry,
        state: investorState,
        region: investorRegion,
        city: investorCity,
        category: investorCategory,
        roundTypes: new Set(),
        investmentCount: 0,
      });
    }

    const inv = investorMap.get(investorName);
    inv.investmentCount++;
    if (roundType) inv.roundTypes.add(roundType);
  }

  console.log('  Found ' + investorMap.size + ' unique investors');

  const records = [];
  for (const [name, data] of investorMap) {
    let location = '';
    if (data.city && data.state) location = data.city + ', ' + data.state;
    else if (data.city) location = data.city;
    else if (data.region) location = data.region;
    if (data.country && data.country !== 'USA') {
      location += location ? ', ' + data.country : data.country;
    }

    const isAngel = name.toLowerCase().includes('angel') ||
      data.category.toLowerCase().includes('angel') ||
      data.roundTypes.has('angel');

    const stages = [];
    if (data.roundTypes.has('seed') || data.roundTypes.has('angel')) stages.push('seed');
    if (data.roundTypes.has('venture')) stages.push('series-a');
    if (data.roundTypes.has('series-a')) stages.push('series-a');
    if (data.roundTypes.has('series-b')) stages.push('series-b');
    if (data.roundTypes.has('series-c+')) stages.push('series-c');
    if (data.roundTypes.has('private_equity')) stages.push('growth');

    let confidence = 55;
    if (data.investmentCount >= 5) confidence = 65;
    if (data.investmentCount >= 10) confidence = 70;
    if (data.investmentCount >= 20) confidence = 75;

    records.push({
      name,
      organization: name,
      description: null,
      opportunity_type: isAngel ? 'angel' : 'vc',
      check_size_min: null,
      check_size_max: null,
      stage: [...new Set(stages)],
      sectors: parseSectors(data.category),
      website: null,
      location: location || null,
      chicago_focused: isChicagoFocused(name, location),
      confidence_score: confidence,
    });
  }

  addRecords(records, 'crunchbase_gist');
}

// Source 3: Connor11528 VC CSV
async function harvestConnorVC() {
  console.log('\n=== Source 3: Connor11528 Venture Capital CSV ===');
  const url = 'https://raw.githubusercontent.com/connor11528/tech-companies-and-startups/master/venture-capital.csv';
  const res = await fetchUrl(url);
  if (!res) return;
  const text = await res.text();
  const rows = parseCSV(text);
  console.log('  Parsed ' + rows.length + ' rows');

  const records = rows.map(row => {
    const name = row['Company Name'];
    const city = row['City'];
    const state = row['State'];
    const location = city && state ? city + ', ' + state : (city || state || null);
    const rawUrl = row['Website'] || '';
    return {
      name,
      organization: name,
      description: row['Company Description'] || null,
      opportunity_type: 'vc',
      check_size_min: null,
      check_size_max: null,
      stage: [],
      sectors: [],
      website: rawUrl.startsWith('http') ? rawUrl : (rawUrl ? 'https://' + rawUrl : null),
      location,
      chicago_focused: isChicagoFocused(name, location),
      confidence_score: 75,
    };
  });
  addRecords(records, 'connor_vc_csv');
}

// Source 4: Awesome OSS Investors
async function harvestOSSInvestors() {
  console.log('\n=== Source 4: Awesome OSS Investors ===');
  const url = 'https://raw.githubusercontent.com/jonathimer/awesome-oss-investors/main/README.md';
  const res = await fetchUrl(url);
  if (!res) return;
  const text = await res.text();

  const records = [];
  const tableRows = text.split('\n').filter(l => l.startsWith('[') || l.startsWith('|['));

  for (const line of tableRows) {
    const match = line.match(/\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)/);
    if (!match) continue;

    const name = match[1].replace(/\*/g, '').trim();
    const website = match[2];
    const stageStr = match[3];
    const ticketStr = match[4];
    const hqStr = match[5];

    let checkMin = null, checkMax = null;
    const ticketMatch = ticketStr.match(/\$?([\d.]+)\s*-\s*([\d.]+)\s*([MmKk])?/);
    if (ticketMatch) {
      const mult = (ticketMatch[3] || 'M').toUpperCase() === 'M' ? 1000000 : 1000;
      checkMin = Math.round(parseFloat(ticketMatch[1]) * mult);
      checkMax = Math.round(parseFloat(ticketMatch[2]) * mult);
    }

    records.push({
      name,
      organization: name,
      description: 'Invests in commercial open-source startups',
      opportunity_type: 'vc',
      check_size_min: checkMin,
      check_size_max: checkMax,
      stage: parseStages(stageStr),
      sectors: ['Open Source', 'Developer Tools'],
      website: website || null,
      location: (hqStr || '').trim() || null,
      chicago_focused: isChicagoFocused(name, hqStr),
      confidence_score: 85,
    });
  }

  console.log('  Parsed ' + records.length + ' OSS investors');
  addRecords(records, 'awesome_oss_investors');
}

// Source 5: Devtools Angels
async function harvestDevtoolsAngels() {
  console.log('\n=== Source 5: Devtools Angels ===');
  const url = 'https://raw.githubusercontent.com/sw-yx/devtools-angels/main/README.md';
  const res = await fetchUrl(url);
  if (!res) return;
  const text = await res.text();

  const records = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const match = line.match(/^-\s+([^-\[]+)\s*-\s*(?:\[(?:site|DM|twitter)\]\(([^)]+)\))?/);
    if (!match) continue;

    const name = match[1].trim();
    if (name.length < 3 || name.startsWith('*')) continue;

    const siteMatch = line.match(/\[site\]\(([^)]+)\)/);
    const website = siteMatch ? siteMatch[1] : null;

    records.push({
      name,
      organization: name,
      description: 'Angel investor in developer tools',
      opportunity_type: 'angel',
      check_size_min: null,
      check_size_max: null,
      stage: ['pre-seed', 'seed'],
      sectors: ['Developer Tools', 'SaaS'],
      website,
      location: null,
      chicago_focused: false,
      confidence_score: 80,
    });
  }

  console.log('  Parsed ' + records.length + ' devtools angels');
  addRecords(records, 'devtools_angels');
}

// Source 6: Selcuke VC Firms List
async function harvestSelcukeVC() {
  console.log('\n=== Source 6: Selcuke VC Firms List ===');
  const url = 'https://raw.githubusercontent.com/selcuke/venture-capital-firms-list/master/README.md';
  const res = await fetchUrl(url);
  if (!res) return;
  const text = await res.text();

  const records = [];
  const regex = /<li><strong>([^<]+?):-?<\/strong>\s*([^<]*)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1].trim();
    const description = match[2].trim();
    records.push({
      name,
      organization: name,
      description: description || null,
      opportunity_type: guessOpportunityType(name, description),
      check_size_min: null,
      check_size_max: null,
      stage: [],
      sectors: [],
      website: null,
      location: null,
      chicago_focused: isChicagoFocused(name, ''),
      confidence_score: 65,
    });
  }

  console.log('  Parsed ' + records.length + ' firms');
  addRecords(records, 'selcuke_vc_list');
}

// Source 7: Evalyze-ai Top VCs & Angels (curated)
function harvestEvalyzeTopVCs() {
  console.log('\n=== Source 7: Evalyze-ai Top VCs & Angels ===');

  const topVCs = [
    { name: 'Sequoia Capital', website: 'https://sequoiacap.com/', location: 'US', stage: ['seed', 'series-a', 'series-b', 'growth'], sectors: ['Software', 'Consumer', 'Infrastructure'] },
    { name: 'Andreessen Horowitz', website: 'https://a16z.com/', location: 'US', stage: ['seed', 'series-a', 'series-b', 'growth'], sectors: ['Software', 'FinTech', 'Crypto', 'AI', 'Bio'] },
    { name: 'Accel', website: 'https://www.accel.com/', location: 'US, Europe, India', stage: ['seed', 'series-a', 'series-b'], sectors: ['SaaS', 'Consumer'] },
    { name: 'Index Ventures', website: 'https://www.indexventures.com/', location: 'US, London, Geneva', stage: ['seed', 'series-a', 'growth'], sectors: ['Software', 'Marketplaces', 'FinTech'] },
    { name: 'Lightspeed Venture Partners', website: 'https://lsvp.com/', location: 'US, India, Israel, SE Asia', stage: ['seed', 'series-a', 'series-b', 'growth'], sectors: ['Enterprise', 'Consumer', 'Deep Tech'] },
    { name: 'Bessemer Venture Partners', website: 'https://www.bvp.com/', location: 'US, India, Israel', stage: ['seed', 'series-a', 'series-b'], sectors: ['Cloud', 'Cybersecurity', 'Commerce'] },
    { name: 'Tiger Global Management', website: 'https://www.tigerglobal.com/', location: 'US', stage: ['growth'], sectors: ['Software', 'FinTech', 'Internet'] },
    { name: 'New Enterprise Associates', website: 'https://www.nea.com/', location: 'US', stage: ['seed', 'series-a', 'series-b', 'growth'], sectors: ['Healthcare', 'Enterprise Software', 'Consumer Tech'] },
    { name: 'GGV Capital', website: 'https://www.ggvc.com/', location: 'US, Asia', stage: ['seed', 'series-a', 'growth'], sectors: ['Consumer Internet', 'Enterprise', 'Frontier Tech'] },
    { name: 'Battery Ventures', website: 'https://www.battery.com/', location: 'US', stage: ['seed', 'series-a', 'series-b', 'growth'], sectors: ['B2B Software', 'Industrial Tech', 'FinTech'] },
  ];

  const topAngels = [
    { name: 'Naval Ravikant', opportunity_type: 'angel', location: 'US', stage: ['pre-seed', 'seed'], sectors: ['Tech', 'Internet'] },
    { name: 'Mark Cuban', opportunity_type: 'angel', location: 'US', stage: ['seed'], sectors: ['SaaS', 'Consumer', 'Media', 'AI'] },
    { name: 'Fabrice Grinda', opportunity_type: 'angel', website: 'https://fabricegrinda.com/', location: 'US, Europe, LatAm', stage: ['seed'], sectors: ['Marketplaces'] },
    { name: 'Elad Gil', opportunity_type: 'angel', location: 'US', stage: ['seed', 'series-a'], sectors: ['SaaS', 'Infrastructure', 'AI'] },
    { name: 'Edward Lando', opportunity_type: 'angel', location: 'US', stage: ['pre-seed', 'seed'], sectors: ['FinTech', 'Infrastructure', 'B2B Software'] },
    { name: 'Immad Akhund', opportunity_type: 'angel', location: 'US', stage: ['pre-seed', 'seed'], sectors: ['SaaS', 'FinTech'] },
    { name: 'Sophia Bendz', opportunity_type: 'angel', location: 'Europe', stage: ['pre-seed', 'seed'], sectors: ['Consumer', 'Tech'] },
  ];

  const records = [
    ...topVCs.map(v => ({ ...v, organization: v.name, description: null, opportunity_type: 'vc', check_size_min: null, check_size_max: null, chicago_focused: false, confidence_score: 90 })),
    ...topAngels.map(a => ({ ...a, organization: a.name, description: null, website: a.website || null, check_size_min: null, check_size_max: null, chicago_focused: false, confidence_score: 85 })),
  ];

  addRecords(records, 'evalyze_top');
}

// Source 8: Curated Top VCs
function harvestCuratedTopVCs() {
  console.log('\n=== Source 8: Curated Top VCs ===');

  const companies = [
    { name: 'Benchmark', website: 'http://benchmark.com/', location: 'San Francisco, CA', stage: ['seed', 'series-a'] },
    { name: 'Founders Fund', website: 'https://foundersfund.com/', location: 'US', stage: ['seed', 'series-a', 'growth'] },
    { name: 'IVP', website: 'https://www.ivp.com/', location: 'CA, US', stage: ['series-a', 'series-b', 'growth'] },
    { name: 'Greylock Partners', website: 'https://greylock.com/', location: 'US', stage: ['seed', 'series-a', 'series-b'] },
    { name: 'Kleiner Perkins', website: 'https://www.kleinerperkins.com/', location: 'US', stage: ['seed', 'series-a', 'series-b'] },
    { name: 'General Catalyst', website: 'https://www.generalcatalyst.com/', location: 'US', stage: ['seed', 'series-a', 'series-b', 'growth'] },
    { name: 'Khosla Ventures', website: 'https://www.khoslaventures.com/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'Union Square Ventures', website: 'https://www.usv.com/', location: 'New York, NY', stage: ['seed', 'series-a'] },
    { name: 'First Round Capital', website: 'https://firstround.com/', location: 'US', stage: ['seed'] },
    { name: 'Spark Capital', website: 'https://www.sparkcapital.com/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'Ribbit Capital', website: 'https://ribbitcap.com/', location: 'US', stage: ['seed', 'series-a'], sectors: ['FinTech'] },
    { name: 'Emergence Capital', website: 'https://www.emcap.com/', location: 'US', stage: ['series-a', 'series-b'], sectors: ['SaaS'] },
    { name: 'Insight Partners', website: 'https://www.insightpartners.com/', location: 'US', stage: ['series-a', 'series-b', 'growth'] },
    { name: 'Coatue Management', website: 'http://www.coatue.com/', location: 'US', stage: ['series-a', 'series-b', 'growth'] },
    { name: 'General Atlantic', website: 'https://www.generalatlantic.com/', location: 'US', stage: ['growth'] },
    { name: 'Thrive Capital', website: 'https://www.thrivecap.com/', location: 'New York, NY', stage: ['seed', 'series-a', 'growth'] },
    { name: 'Addition', website: 'https://addition.com/', location: 'US', stage: ['series-a', 'series-b', 'growth'] },
    { name: 'Iconiq Capital', website: 'https://www.iconiqcapital.com/', location: 'US', stage: ['series-a', 'series-b', 'growth'] },
    { name: 'Altimeter Capital', website: 'https://www.altimeter.com/', location: 'US', stage: ['growth'] },
    { name: 'Dragoneer Investment Group', website: 'https://www.dragoneer.com/', location: 'US', stage: ['growth'] },
    { name: 'D1 Capital Partners', website: 'https://www.d1cap.com/', location: 'US', stage: ['growth'] },
    { name: 'Lux Capital', website: 'https://www.luxcapital.com/', location: 'US', stage: ['seed', 'series-a'], sectors: ['Deep Tech', 'Science'] },
    { name: 'Forerunner Ventures', website: 'https://www.forerunnerventures.com/', location: 'US', stage: ['seed', 'series-a'], sectors: ['Consumer', 'Commerce'] },
    { name: 'Lowercase Capital', website: 'https://lowercasecapital.com/', location: 'US', stage: ['seed'], sectors: ['Tech'] },
    { name: 'SV Angel', website: 'https://svangel.com/', location: 'US', stage: ['seed'] },
    { name: 'Social Capital', website: 'https://www.socialcapital.com/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'Initialized Capital', website: 'https://initialized.com/', location: 'US', stage: ['seed'] },
    { name: 'Abstract Ventures', website: 'https://www.abstractvc.com/', location: 'US', stage: ['seed'] },
    { name: 'Craft Ventures', website: 'https://www.craftventures.com/', location: 'US', stage: ['seed', 'series-a'], sectors: ['SaaS', 'Crypto'] },
    { name: 'Upfront Ventures', website: 'https://upfront.com/', location: 'Los Angeles, CA', stage: ['seed', 'series-a'] },
    { name: 'Menlo Ventures', website: 'https://www.menlovc.com/', location: 'US', stage: ['seed', 'series-a', 'series-b'] },
    { name: '8VC', website: 'https://8vc.com/', location: 'US', stage: ['seed', 'series-a'], sectors: ['Enterprise', 'Healthcare'] },
    { name: 'Shasta Ventures', website: 'https://shastaventures.com/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'Foundry Group', website: 'https://www.foundrygroup.com/', location: 'Boulder, CO', stage: ['seed', 'series-a'] },
    { name: 'Sutter Hill Ventures', website: 'https://www.shv.com/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'Matrix Partners', website: 'https://www.matrixpartners.com/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'Canaan Partners', website: 'https://www.canaan.com/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'Norwest Venture Partners', website: 'https://www.nvp.com/', location: 'US', stage: ['seed', 'series-a', 'series-b', 'growth'] },
    { name: 'CRV', website: 'https://www.crv.com/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'Redpoint Ventures', website: 'https://www.redpoint.com/', location: 'US', stage: ['seed', 'series-a', 'series-b'] },
    { name: 'Scale Venture Partners', website: 'https://www.scalevp.com/', location: 'US', stage: ['series-a', 'series-b'] },
    { name: 'DCVC', website: 'https://www.dcvc.com/', location: 'US', stage: ['seed', 'series-a'], sectors: ['Deep Tech', 'AI'] },
    { name: 'Madrona Venture Group', website: 'https://www.madrona.com/', location: 'Seattle, WA', stage: ['seed', 'series-a'] },
    { name: 'Sapphire Ventures', website: 'https://sapphireventures.com/', location: 'US', stage: ['series-a', 'series-b', 'growth'] },
    { name: 'SignalFire', website: 'https://signalfire.com/', location: 'US', stage: ['seed', 'series-a', 'series-b'] },
    { name: 'True Ventures', website: 'https://trueventures.com/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'Venrock', website: 'https://www.venrock.com/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'Wing Venture Capital', website: 'https://www.wing.vc/', location: 'US', stage: ['seed', 'series-a'] },
  ];

  const records = companies.map(c => ({
    ...c,
    organization: c.name,
    description: null,
    opportunity_type: 'vc',
    check_size_min: null,
    check_size_max: null,
    sectors: c.sectors || [],
    chicago_focused: false,
    confidence_score: 90,
  }));

  addRecords(records, 'curated_top_vc');
}

// Source 9: Chicago & Midwest VCs
function harvestChicagoMidwestVCs() {
  console.log('\n=== Source 9: Chicago & Midwest VCs ===');

  const firms = [
    { name: 'Hyde Park Venture Partners', website: 'https://hydeparkvp.com/', location: 'Chicago, IL', stage: ['seed', 'series-a'], sectors: ['Enterprise Software', 'FinTech'], chicago_focused: true },
    { name: 'MATH Venture Partners', website: 'https://mathvp.com/', location: 'Chicago, IL', stage: ['seed'], sectors: ['SaaS', 'FinTech'], chicago_focused: true },
    { name: 'Chicago Ventures', website: 'https://chicagoventures.com/', location: 'Chicago, IL', stage: ['seed', 'series-a'], sectors: ['Tech'], chicago_focused: true },
    { name: 'Pritzker Group Venture Capital', website: 'https://pritzkergroup.com/', location: 'Chicago, IL', stage: ['seed', 'series-a', 'series-b'], sectors: ['Software', 'Healthcare'], chicago_focused: true },
    { name: 'OCA Ventures', website: 'https://ocaventures.com/', location: 'Chicago, IL', stage: ['seed', 'series-a'], sectors: ['Enterprise Software', 'Healthcare IT'], chicago_focused: true },
    { name: 'M25', website: 'https://m25.vc/', location: 'Chicago, IL', stage: ['pre-seed', 'seed'], sectors: ['Tech'], chicago_focused: true },
    { name: 'Cleveland Avenue', website: 'https://www.clevelandavenue.com/', location: 'Chicago, IL', stage: ['seed', 'series-a'], sectors: ['Food Tech', 'Consumer'], chicago_focused: true },
    { name: 'Lightbank', website: 'https://lightbank.com/', location: 'Chicago, IL', stage: ['seed', 'series-a'], sectors: ['Tech'], chicago_focused: true },
    { name: 'Origin Ventures', website: 'https://originventures.com/', location: 'Chicago, IL', stage: ['seed', 'series-a'], sectors: ['Enterprise Software'], chicago_focused: true },
    { name: 'Jump Capital', website: 'https://jumpcap.com/', location: 'Chicago, IL', stage: ['seed', 'series-a', 'series-b'], sectors: ['FinTech', 'Data', 'Security'], chicago_focused: true },
    { name: 'Drive Capital', website: 'https://drivecap.com/', location: 'Columbus, OH', stage: ['seed', 'series-a', 'series-b'] },
    { name: 'Revolution (Rise of the Rest)', website: 'https://www.revolution.com/', location: 'Washington, DC', stage: ['seed', 'series-a'] },
    { name: 'Elevate Ventures', website: 'https://elevateventures.com/', location: 'Indianapolis, IN', stage: ['pre-seed', 'seed'] },
    { name: 'Lewis & Clark Ventures', website: 'https://lewisandclarkvc.com/', location: 'St. Louis, MO', stage: ['seed', 'series-a'] },
    { name: 'Cultivation Capital', website: 'https://cultivationcapital.com/', location: 'St. Louis, MO', stage: ['seed', 'series-a'], sectors: ['AgTech', 'FinTech'] },
    { name: 'Comeback Capital', website: 'https://comebackcapital.com/', location: 'Detroit, MI', stage: ['seed'] },
    { name: 'Michigan Rise', website: 'https://michiganrise.com/', location: 'Detroit, MI', stage: ['seed'] },
    { name: 'Cintrifuse', website: 'https://www.cintrifuse.com/', location: 'Cincinnati, OH', stage: ['seed'] },
    { name: 'Rev1 Ventures', website: 'https://rev1ventures.com/', location: 'Columbus, OH', stage: ['seed'] },
    { name: 'Great North Ventures', website: 'https://greatnorthventures.com/', location: 'Minneapolis, MN', stage: ['seed'] },
    { name: 'gener8tor', website: 'https://www.gener8tor.com/', location: 'Milwaukee, WI', stage: ['pre-seed', 'seed'] },
    { name: 'Northwestern Mutual Future Ventures', website: 'https://futureventures.northwesternmutual.com/', location: 'Milwaukee, WI', stage: ['seed', 'series-a'], sectors: ['InsurTech', 'FinTech'] },
    { name: 'Baird Capital', website: 'https://www.bairdcapital.com/', location: 'Chicago, IL', stage: ['growth'], sectors: ['Healthcare', 'Tech'], chicago_focused: true },
    { name: 'West Loop Ventures', website: 'https://westloopventures.com/', location: 'Chicago, IL', stage: ['seed'], sectors: ['Tech'], chicago_focused: true },
    { name: 'Tensility Venture Partners', website: 'https://www.tensility.vc/', location: 'Chicago, IL', stage: ['seed', 'series-a'], sectors: ['Enterprise Software'], chicago_focused: true },
    { name: 'Valor Equity Partners', website: 'https://www.valorep.com/', location: 'Chicago, IL', stage: ['growth'], sectors: ['Tech'], chicago_focused: true },
    { name: 'Portal Innovations', website: 'https://portalinnovations.com/', location: 'Chicago, IL', stage: ['seed'], sectors: ['Healthcare', 'BioTech'], chicago_focused: true },
    { name: 'IrishAngels', website: 'https://irishangels.com/', location: 'Chicago, IL', stage: ['seed'], sectors: ['Tech'], chicago_focused: true, opportunity_type: 'angel' },
    { name: 'Hyde Park Angels', website: 'https://hydeparkangels.com/', location: 'Chicago, IL', stage: ['seed'], sectors: ['Tech'], chicago_focused: true, opportunity_type: 'angel' },
    { name: 'Presto Ventures', website: 'https://presto.vc/', location: 'Chicago, IL', stage: ['pre-seed', 'seed'], sectors: ['Tech'], chicago_focused: true },
    { name: '50 South Capital', website: 'https://50southcapital.com/', location: 'Chicago, IL', stage: ['growth'], sectors: ['Tech'], chicago_focused: true },
  ];

  const records = firms.map(f => ({
    name: f.name,
    organization: f.name,
    description: null,
    opportunity_type: f.opportunity_type || 'vc',
    check_size_min: null,
    check_size_max: null,
    stage: f.stage || [],
    sectors: f.sectors || [],
    website: f.website || null,
    location: f.location,
    chicago_focused: f.chicago_focused || false,
    confidence_score: 90,
  }));

  addRecords(records, 'chicago_midwest_curated');
}

// Source 10: Additional VCs (European, NYC, etc.)
function harvestAdditionalVCs() {
  console.log('\n=== Source 10: Additional VCs ===');

  const firms = [
    { name: 'Atomico', website: 'https://atomico.com/', location: 'London, UK', stage: ['series-a', 'series-b'] },
    { name: 'Balderton Capital', website: 'https://www.balderton.com/', location: 'London, UK', stage: ['series-a', 'series-b'] },
    { name: 'Northzone', website: 'https://northzone.com/', location: 'London, UK', stage: ['seed', 'series-a'] },
    { name: 'EQT Ventures', website: 'https://eqtventures.com/', location: 'Stockholm, Sweden', stage: ['seed', 'series-a', 'series-b'] },
    { name: 'HV Capital', website: 'https://www.hvcapital.com/', location: 'Munich, Germany', stage: ['seed', 'series-a'] },
    { name: 'Partech', website: 'https://partechpartners.com/', location: 'Paris, France', stage: ['seed', 'series-a', 'series-b'] },
    { name: 'Earlybird Venture Capital', website: 'https://earlybird.com/', location: 'Berlin, Germany', stage: ['seed', 'series-a'] },
    { name: 'Point Nine Capital', website: 'https://www.pointnine.com/', location: 'Berlin, Germany', stage: ['seed'], sectors: ['SaaS', 'B2B Marketplaces'] },
    { name: 'Cherry Ventures', website: 'https://cherry.vc/', location: 'Berlin, Germany', stage: ['pre-seed', 'seed'] },
    { name: 'LocalGlobe', website: 'https://localglobe.vc/', location: 'London, UK', stage: ['seed'] },
    { name: 'Creandum', website: 'https://creandum.com/', location: 'Stockholm, Sweden', stage: ['seed', 'series-a'] },
    { name: 'Lakestar', website: 'https://www.lakestar.com/', location: 'Zurich, Switzerland', stage: ['seed', 'series-a', 'series-b'] },
    { name: 'Softbank Vision Fund', website: 'https://visionfund.com/', location: 'London, UK', stage: ['growth'] },
    { name: 'DST Global', website: 'https://dst.global/', location: 'Hong Kong', stage: ['growth'] },
    { name: 'Floodgate', website: 'https://floodgate.com/', location: 'US', stage: ['pre-seed', 'seed'] },
    { name: 'Slow Ventures', website: 'https://slow.co/', location: 'US', stage: ['seed'] },
    { name: 'Cowboy Ventures', website: 'https://cowboy.vc/', location: 'US', stage: ['seed'] },
    { name: 'Freestyle Capital', website: 'https://freestyle.vc/', location: 'US', stage: ['seed'] },
    { name: 'Homebrew', website: 'https://homebrew.co/', location: 'US', stage: ['seed'] },
    { name: 'Precursor Ventures', website: 'https://precursorvc.com/', location: 'US', stage: ['pre-seed'] },
    { name: 'Uncork Capital', website: 'https://uncorkcapital.com/', location: 'US', stage: ['seed'] },
    { name: 'Bowery Capital', website: 'https://bowerycap.com/', location: 'New York, NY', stage: ['seed', 'series-a'] },
    { name: 'Work-Bench', website: 'https://www.work-bench.com/', location: 'New York, NY', stage: ['seed', 'series-a'], sectors: ['Enterprise Software'] },
    { name: 'Primary Venture Partners', website: 'https://primaryvc.com/', location: 'New York, NY', stage: ['seed'] },
    { name: 'Notation Capital', website: 'https://notation.vc/', location: 'New York, NY', stage: ['pre-seed'] },
    { name: 'Lerer Hippeau', website: 'https://lererhippeau.com/', location: 'New York, NY', stage: ['seed'] },
    { name: 'Greycroft', website: 'https://greycroft.com/', location: 'New York, NY', stage: ['seed', 'series-a'] },
    { name: 'RRE Ventures', website: 'https://rre.com/', location: 'New York, NY', stage: ['seed', 'series-a'] },
    { name: 'Lead Edge Capital', website: 'https://www.leadedgecapital.com/', location: 'New York, NY', stage: ['growth'] },
    { name: 'Tribe Capital', website: 'https://tribecap.co/', location: 'US', stage: ['seed', 'series-a', 'series-b'] },
    { name: 'Lachy Groom', website: null, location: 'US', stage: ['seed'], opportunity_type: 'angel' },
    { name: 'Harry Stebbings / 20VC', website: 'https://thetwentyminutevc.com/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'Soma Capital', website: 'https://www.somacap.com/', location: 'US', stage: ['pre-seed', 'seed'] },
    { name: 'Pioneer Fund', website: 'https://pioneer.app/fund', location: 'US', stage: ['pre-seed'] },
    { name: 'January Ventures', website: 'https://www.januaryventures.com/', location: 'US', stage: ['pre-seed'] },
    { name: 'Hustle Fund', website: 'https://www.hustlefund.vc/', location: 'US', stage: ['pre-seed'] },
    { name: 'Backstage Capital', website: 'https://backstagecapital.com/', location: 'US', stage: ['pre-seed', 'seed'] },
    { name: 'Harlem Capital', website: 'https://www.harlemcapital.com/', location: 'New York, NY', stage: ['pre-seed', 'seed'] },
    { name: 'Kapor Capital', website: 'https://www.kaporcapital.com/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'Base10 Partners', website: 'https://base10.vc/', location: 'US', stage: ['seed', 'series-a'] },
    { name: 'MaC Venture Capital', website: 'https://macventurecapital.com/', location: 'US', stage: ['pre-seed', 'seed'] },
    { name: 'Bread & Butter Ventures', website: 'https://breadandbutterventures.com/', location: 'Minneapolis, MN', stage: ['pre-seed', 'seed'] },
  ];

  const records = firms.map(f => ({
    name: f.name,
    organization: f.name,
    description: null,
    opportunity_type: f.opportunity_type || 'vc',
    check_size_min: null,
    check_size_max: null,
    stage: f.stage || [],
    sectors: f.sectors || [],
    website: f.website || null,
    location: f.location,
    chicago_focused: false,
    confidence_score: 85,
  }));

  addRecords(records, 'additional_vcs_curated');
}

// Main
async function main() {
  console.log('='.repeat(50));
  console.log('  Comprehensive Investor Harvester');
  console.log('  Target: 3,000+ unique records');
  console.log('='.repeat(50));

  const startTime = Date.now();

  // Web-based sources
  await harvestMicroVC();
  await sleep(500);
  await harvestCrunchbaseGist();
  await sleep(500);
  await harvestConnorVC();
  await sleep(500);
  await harvestOSSInvestors();
  await sleep(500);
  await harvestDevtoolsAngels();
  await sleep(500);
  await harvestSelcukeVC();

  // Curated sources (no network)
  harvestEvalyzeTopVCs();
  harvestCuratedTopVCs();
  harvestChicagoMidwestVCs();
  harvestAdditionalVCs();

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(50));
  console.log('HARVEST COMPLETE in ' + elapsed + 's');
  console.log('Total unique records: ' + allRecords.length);
  console.log('='.repeat(50));

  const bySource = {};
  for (const r of allRecords) {
    bySource[r.source] = (bySource[r.source] || 0) + 1;
  }
  console.log('\nBy source:');
  for (const [src, count] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + src + ': ' + count);
  }

  const byType = {};
  for (const r of allRecords) {
    byType[r.opportunity_type] = (byType[r.opportunity_type] || 0) + 1;
  }
  console.log('\nBy type:');
  for (const [type, count] of Object.entries(byType)) {
    console.log('  ' + type + ': ' + count);
  }

  const chicagoCount = allRecords.filter(r => r.chicago_focused).length;
  console.log('\nChicago-focused: ' + chicagoCount);

  // Save
  writeFileSync(OUTPUT_PATH, JSON.stringify(allRecords, null, 2));
  const fileSizeMB = (Buffer.byteLength(JSON.stringify(allRecords, null, 2)) / 1024 / 1024).toFixed(1);
  console.log('\nSaved to: ' + OUTPUT_PATH);
  console.log('File size: ' + fileSizeMB + ' MB');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
