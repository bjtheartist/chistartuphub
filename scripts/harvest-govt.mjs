#!/usr/bin/env node
/**
 * Government Data Source Harvester
 * Targets: SEC EDGAR (Form ADV), ProPublica IRS 990, SBA SBIC, FINRA BrokerCheck
 * Goal: 2,000+ unique investor/fund records
 */
import { insertToStaging, fetchWithRetry, sleep, normalizeName } from './harvester-utils.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_PATH = join(__dirname, '..', 'data', 'harvest-govt-sources.json');

// Ensure data dir exists
mkdirSync(join(__dirname, '..', 'data'), { recursive: true });

const allRecords = [];
const seen = new Set();

function addRecord(rec) {
  const key = normalizeName(rec.name);
  if (!key || seen.has(key)) return false;
  seen.add(key);
  allRecords.push(rec);
  return true;
}

// ─── 1. SEC EDGAR Full-Text Search for Investment Advisers (Form ADV) ────────
async function harvestSECEdgar() {
  console.log('\n═══ SEC EDGAR Full-Text Search (Form ADV) ═══');
  const searchTerms = [
    'venture capital', 'private equity', 'growth equity', 'seed fund',
    'angel fund', 'startup fund', 'early stage', 'technology fund',
    'innovation fund', 'emerging growth', 'small business investment',
    'impact fund', 'climate fund', 'fintech fund', 'healthcare fund',
    'biotech fund', 'real estate fund', 'infrastructure fund',
    'opportunity fund', 'mezzanine', 'buyout fund',
  ];
  let total = 0;

  for (const term of searchTerms) {
    try {
      // SEC EFTS (full-text search) API
      const url = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(term)}%22&dateRange=custom&startdt=2020-01-01&enddt=2026-12-31&forms=ADV&hits.hits.total=true&hits.hits._source=file_date,display_names,entity_name,file_num,period_of_report,biz_locations`;
      const res = await fetchWithRetry(
        `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(term)}%22&forms=ADV`,
        {}, 2, 500
      );
      if (res?.ok) {
        const data = await res.json();
        console.log(`  [SEC EFTS] "${term}": got response`);
      }
    } catch (e) {
      // Expected — EFTS may not work directly, fall through to IAPD
    }
    await sleep(200);
  }

  // IAPD — Investment Adviser Public Disclosure API
  console.log('\n  --- SEC IAPD API ---');
  const iapdTerms = [
    'venture', 'capital', 'equity', 'fund', 'angel', 'seed', 'growth',
    'innovation', 'technology', 'startup', 'emerging', 'partners',
    'investment', 'management', 'advisors', 'holdings',
  ];

  for (const term of iapdTerms) {
    for (let start = 0; start < 500; start += 50) {
      try {
        const url = `https://api.adviserinfo.sec.gov/IAPD/Content/Search/Genericsearch/Firm?SearchValue=${encodeURIComponent(term)}&PageNumber=${Math.floor(start / 50) + 1}&PageSize=50`;
        const res = await fetchWithRetry(url, {
          headers: {
            'Accept': 'application/json',
            'Referer': 'https://adviserinfo.sec.gov/',
          }
        }, 2, 300);
        if (!res?.ok) break;
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { break; }

        const hits = data?.Results || data?.results || data?.Hits || data?.hits || data?.Data || data?.data || [];
        const items = Array.isArray(hits) ? hits : (hits?.Results || hits?.Items || []);
        if (!items.length && start > 0) break;

        for (const firm of items) {
          const name = firm.FirmName || firm.firmName || firm.Name || firm.name || firm.bc_firm_name;
          if (!name) continue;
          const city = firm.City || firm.city || firm.FirmCity || '';
          const state = firm.State || firm.state || firm.FirmState || '';
          const location = city && state ? `${city}, ${state}` : (state || '');

          addRecord({
            name,
            organization: name,
            description: `SEC-registered investment adviser. CRD# ${firm.CRDNumber || firm.crdNumber || firm.FirmCRDNumber || 'N/A'}`,
            opportunity_type: 'vc',
            website: firm.Website || firm.website || null,
            location,
            chicago_focused: (state === 'IL' || city?.toLowerCase()?.includes('chicago')),
            confidence_score: 80,
            source: 'sec_iapd',
          });
        }
        total += items.length;
        if (items.length < 50) break;
      } catch (e) {
        break;
      }
      await sleep(150);
    }
    console.log(`  [SEC IAPD] "${term}": running total = ${allRecords.length}`);
  }

  // Also try the SEC EDGAR company search for investment companies
  console.log('\n  --- SEC EDGAR Company Search ---');
  const edgarTypes = ['N-1A', 'N-2', 'N-14', 'ADV'];
  const edgarTerms = ['venture', 'capital', 'equity', 'fund', 'growth', 'innovation', 'seed', 'angel', 'technology', 'partners'];

  for (const searchTerm of edgarTerms) {
    try {
      const url = `https://www.sec.gov/cgi-bin/browse-company?company=${encodeURIComponent(searchTerm)}&CIK=&type=ADV&dateb=&owner=include&count=100&search_text=&action=getcompany&output=atom`;
      const res = await fetchWithRetry(url, {}, 2, 500);
      if (res?.ok) {
        const text = await res.text();
        // Parse Atom XML for company entries
        const entries = text.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        for (const entry of entries) {
          const nameMatch = entry.match(/<title[^>]*>([^<]+)<\/title>/);
          const cikMatch = entry.match(/<CIK[^>]*>([^<]+)/i) || entry.match(/CIK=(\d+)/);
          const stateMatch = entry.match(/<state[^>]*>([^<]+)/i);
          if (nameMatch) {
            const name = nameMatch[1].replace(/\s+/g, ' ').trim();
            if (name.length > 3) {
              addRecord({
                name,
                organization: name,
                description: `SEC-registered investment company/adviser. ${cikMatch ? 'CIK: ' + cikMatch[1] : ''}`,
                opportunity_type: 'vc',
                website: null,
                location: stateMatch ? stateMatch[1] : '',
                chicago_focused: false,
                confidence_score: 75,
                source: 'sec_edgar',
              });
            }
          }
        }
        console.log(`  [SEC EDGAR] "${searchTerm}": found ${entries.length} entries, total unique = ${allRecords.length}`);
      }
    } catch (e) {
      console.log(`  [SEC EDGAR] "${searchTerm}": error - ${e.message}`);
    }
    await sleep(300);
  }

  // SEC full-text search (EFTS) — proper endpoint
  console.log('\n  --- SEC EFTS Full-Text Search ---');
  const eftsTerms = ['venture capital fund', 'private equity fund', 'seed stage', 'early stage venture', 'growth equity', 'angel investor'];
  for (const term of eftsTerms) {
    try {
      const url = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(term)}%22&forms=ADV&from=0&size=100`;
      const res = await fetchWithRetry(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'ChiStartupHub Research/1.0 (educational)' }
      }, 2, 500);
      if (res?.ok) {
        const data = await res.json();
        const hits = data?.hits?.hits || [];
        for (const hit of hits) {
          const src = hit._source || {};
          const name = src.entity_name || src.display_names?.[0];
          if (name) {
            addRecord({
              name,
              organization: name,
              description: `SEC filing entity (Form ADV). ${term}`,
              opportunity_type: 'vc',
              website: null,
              location: (src.biz_locations || [])[0] || '',
              chicago_focused: false,
              confidence_score: 75,
              source: 'sec_efts',
            });
          }
        }
        console.log(`  [SEC EFTS] "${term}": ${hits.length} hits, total = ${allRecords.length}`);
      }
    } catch (e) {}
    await sleep(300);
  }

  console.log(`\n  SEC total unique records: ${allRecords.length}`);
}

// ─── 2. ProPublica IRS 990 API (Foundations & Funds) ─────────────────────────
async function harvestProPublica() {
  console.log('\n═══ ProPublica IRS 990 API ═══');
  const terms = [
    'venture fund', 'venture capital', 'innovation fund', 'startup fund',
    'investment fund', 'program related investment', 'angel fund',
    'seed fund', 'growth fund', 'technology fund', 'impact fund',
    'equity fund', 'capital partners', 'venture partners',
    'emerging fund', 'opportunity fund', 'enterprise fund',
    'private equity', 'small business fund', 'entrepreneurship fund',
    'foundation venture', 'social enterprise fund', 'catalyst fund',
    'accelerator fund', 'incubator fund', 'development fund',
    'community development', 'economic development fund',
    'micro fund', 'mezzanine fund', 'bridge fund',
    'biotech fund', 'healthcare fund', 'cleantech fund',
    'fintech fund', 'edtech fund', 'proptech fund',
    'capital management', 'asset management venture',
    'family office', 'endowment fund', 'pension fund venture',
    'corporate venture', 'strategic investment', 'innovation capital',
    'founders fund', 'partners fund', 'growth capital',
  ];
  let total = 0;
  const beforeCount = allRecords.length;

  for (const term of terms) {
    for (let page = 0; page < 10; page++) {
      try {
        const url = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encodeURIComponent(term)}&page=${page}`;
        const res = await fetchWithRetry(url, {}, 2, 500);
        if (!res?.ok) break;
        const data = await res.json();
        const orgs = data?.organizations || data?.results || [];
        if (!orgs.length) break;

        for (const org of orgs) {
          const name = org.name || org.organization?.name;
          if (!name) continue;
          // Filter for investment-relevant entities
          const nameLower = name.toLowerCase();
          const isRelevant = /fund|capital|venture|invest|equity|partner|angel|seed|growth|innovation|enterprise|accelerat|incubat|development|foundation|endowment|asset|manage/i.test(nameLower);
          if (!isRelevant) continue;

          const state = org.state || org.organization?.state || '';
          const city = org.city || org.organization?.city || '';
          const ein = org.ein || org.organization?.ein || '';

          addRecord({
            name,
            organization: name,
            description: `IRS 990 nonprofit/foundation. EIN: ${ein}. ${org.ntee_code ? 'NTEE: ' + org.ntee_code : ''}`,
            opportunity_type: 'grant',
            website: null,
            location: city && state ? `${city}, ${state}` : (state || ''),
            chicago_focused: (state === 'IL' || city?.toLowerCase()?.includes('chicago')),
            confidence_score: 70,
            source: 'irs_990',
          });
          total++;
        }
        if (orgs.length < 25) break;
      } catch (e) {
        break;
      }
      await sleep(200);
    }
    console.log(`  [IRS 990] "${term}": total unique = ${allRecords.length - beforeCount} from this source`);
  }

  console.log(`\n  ProPublica IRS 990 added: ${allRecords.length - beforeCount}`);
}

// ─── 3. FINRA BrokerCheck API ────────────────────────────────────────────────
async function harvestFINRA() {
  console.log('\n═══ FINRA BrokerCheck API ═══');
  const terms = [
    'venture', 'capital', 'equity', 'fund', 'angel', 'seed', 'growth',
    'innovation', 'technology', 'startup', 'partners', 'investment',
    'management', 'advisors', 'securities', 'holdings', 'asset',
    'wealth', 'private', 'emerging', 'strategic',
  ];
  let total = 0;
  const beforeCount = allRecords.length;

  for (const term of terms) {
    for (let start = 0; start < 1000; start += 100) {
      try {
        const url = `https://api.brokercheck.finra.org/search/firm?query=${encodeURIComponent(term)}&hl=true&nrows=100&start=${start}&r=25&sort=score+desc&wt=json`;
        const res = await fetchWithRetry(url, {
          headers: {
            'Accept': 'application/json',
            'Referer': 'https://brokercheck.finra.org/',
            'Origin': 'https://brokercheck.finra.org',
          }
        }, 2, 500);
        if (!res?.ok) {
          // Try alternate endpoint
          const altUrl = `https://api.brokercheck.finra.org/search/firm?query=${encodeURIComponent(term)}&filter=active=true&hl=true&nrows=100&start=${start}&wt=json`;
          const altRes = await fetchWithRetry(altUrl, {
            headers: { 'Accept': 'application/json' }
          }, 1, 500);
          if (!altRes?.ok) break;
          const text = await altRes.text();
          let data;
          try { data = JSON.parse(text); } catch { break; }
          const hits = data?.results?.results || data?.hits?.hits || [];
          if (!hits.length) break;
          for (const hit of hits) {
            const src = hit._source || hit.fields || hit;
            const name = src.bc_firm_name || src.firm_name || src.name;
            if (!name) continue;
            addRecord({
              name,
              organization: name,
              description: `FINRA-registered firm. CRD# ${src.firm_source_id || src.bc_firm_source_id || 'N/A'}`,
              opportunity_type: 'vc',
              website: null,
              location: src.bc_firm_bc_scope_state || src.state || '',
              chicago_focused: false,
              confidence_score: 75,
              source: 'finra',
            });
          }
          if (hits.length < 100) break;
          continue;
        }

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { break; }

        // FINRA has nested result structure
        const hits = data?.results?.results || data?.hits || [];
        const items = Array.isArray(hits) ? hits : [];
        if (!items.length && start > 0) break;

        for (const hit of items) {
          const src = hit._source || hit.fields || hit;
          const name = src.bc_firm_name || src.firm_name || src.name;
          if (!name) continue;
          const nameLower = name.toLowerCase();
          // Filter for investment-relevant firms
          const isRelevant = /venture|capital|equity|fund|angel|seed|growth|invest|partner|manage|asset|wealth|securities|private|strateg|innovat|technolog/i.test(nameLower);
          if (!isRelevant && start > 200) continue; // Be more selective on later pages

          addRecord({
            name,
            organization: name,
            description: `FINRA-registered broker-dealer/firm. CRD# ${src.firm_source_id || src.bc_firm_source_id || 'N/A'}`,
            opportunity_type: 'vc',
            website: null,
            location: src.bc_firm_bc_scope_state || src.state || '',
            chicago_focused: false,
            confidence_score: 75,
            source: 'finra',
          });
          total++;
        }
        if (items.length < 100) break;
      } catch (e) {
        break;
      }
      await sleep(200);
    }
    console.log(`  [FINRA] "${term}": total from source = ${allRecords.length - beforeCount}`);
  }

  console.log(`\n  FINRA BrokerCheck added: ${allRecords.length - beforeCount}`);
}

// ─── 4. SBA SBIC Data ───────────────────────────────────────────────────────
async function harvestSBA() {
  console.log('\n═══ SBA SBIC Directory ═══');
  const beforeCount = allRecords.length;

  // Try multiple SBA data endpoints
  const sbaUrls = [
    'https://data.sba.gov/dataset/sbic-directory/resource/resource.json',
    'https://data.sba.gov/api/3/action/package_show?id=sbic-directory',
    'https://data.sba.gov/api/3/action/package_show?id=sbic-program',
    'https://data.sba.gov/api/3/action/package_search?q=sbic',
    'https://data.sba.gov/api/3/action/package_search?q=small+business+investment+company',
  ];

  for (const url of sbaUrls) {
    try {
      const res = await fetchWithRetry(url, {}, 2, 1000);
      if (res?.ok) {
        const data = await res.json();
        console.log(`  [SBA] ${url}: got response`);

        // Try to find downloadable resources
        const result = data?.result || data;
        const resources = result?.resources || [];
        for (const resource of resources) {
          if (resource.url && (resource.format === 'CSV' || resource.format === 'JSON' || resource.url.endsWith('.csv') || resource.url.endsWith('.json'))) {
            console.log(`  [SBA] Found resource: ${resource.url} (${resource.format})`);
            try {
              const dataRes = await fetchWithRetry(resource.url, {}, 2, 2000);
              if (dataRes?.ok) {
                const text = await dataRes.text();
                if (resource.format === 'JSON' || resource.url.endsWith('.json')) {
                  const records = JSON.parse(text);
                  for (const rec of (Array.isArray(records) ? records : [records])) {
                    const name = rec.name || rec.company_name || rec.licensee_name || rec.firm_name;
                    if (name) {
                      addRecord({
                        name,
                        organization: name,
                        description: 'SBA SBIC licensee. Licensed Small Business Investment Company.',
                        opportunity_type: 'vc',
                        website: rec.website || null,
                        location: rec.city && rec.state ? `${rec.city}, ${rec.state}` : (rec.state || rec.location || ''),
                        chicago_focused: (rec.state === 'IL'),
                        confidence_score: 85,
                        source: 'sba_sbic',
                      });
                    }
                  }
                } else {
                  // CSV
                  const lines = text.split('\n');
                  const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, ''));
                  for (let i = 1; i < lines.length; i++) {
                    const vals = lines[i]?.split(',').map(v => v.trim().replace(/"/g, ''));
                    if (!vals || vals.length < 2) continue;
                    const obj = {};
                    headers?.forEach((h, idx) => { obj[h] = vals[idx]; });
                    const name = obj['Licensee Name'] || obj['Company Name'] || obj['Name'] || obj['name'] || vals[0];
                    if (name && name.length > 3) {
                      addRecord({
                        name,
                        organization: name,
                        description: 'SBA SBIC licensee.',
                        opportunity_type: 'vc',
                        website: null,
                        location: obj['City'] && obj['State'] ? `${obj['City']}, ${obj['State']}` : (obj['State'] || ''),
                        chicago_focused: (obj['State'] === 'IL'),
                        confidence_score: 85,
                        source: 'sba_sbic',
                      });
                    }
                  }
                }
                console.log(`  [SBA] Parsed resource, total unique = ${allRecords.length}`);
              }
            } catch (e) {
              console.log(`  [SBA] Resource parse error: ${e.message}`);
            }
          }
        }
      }
    } catch (e) {
      console.log(`  [SBA] ${url}: ${e.message}`);
    }
    await sleep(300);
  }

  // Try SBA API directly
  try {
    const res = await fetchWithRetry('https://api.sba.gov/sba_search_api/search?term=sbic&start=0&end=100', {}, 2, 1000);
    if (res?.ok) {
      const data = await res.json();
      console.log(`  [SBA API] Got ${Array.isArray(data) ? data.length : 'non-array'} results`);
    }
  } catch (e) {}

  console.log(`\n  SBA added: ${allRecords.length - beforeCount}`);
}

// ─── 5. SEC EDGAR Company Search (broader search) ───────────────────────────
async function harvestSECEdgarBroad() {
  console.log('\n═══ SEC EDGAR Broad Company Search ═══');
  const beforeCount = allRecords.length;

  // Search for investment companies using the full-text search API
  const searchTerms = [
    'venture capital', 'private equity', 'angel investment', 'seed capital',
    'growth equity', 'technology ventures', 'biotech ventures',
    'innovation capital', 'startup investment', 'emerging companies',
    'impact investment', 'social venture', 'clean energy fund',
    'real estate venture', 'healthcare ventures', 'fintech ventures',
    'capital partners', 'venture partners', 'investment partners',
    'capital management', 'fund management', 'asset management',
    'family office', 'strategic investment', 'corporate ventures',
  ];

  for (const term of searchTerms) {
    try {
      // Use EDGAR full-text search API
      const url = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(term)}%22&dateRange=custom&startdt=2020-01-01&forms=ADV&from=0&size=200`;
      const res = await fetchWithRetry(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ChiStartupHub billy@chistartuphub.com',
        }
      }, 2, 500);
      if (res?.ok) {
        const data = await res.json();
        const hits = data?.hits?.hits || [];
        for (const hit of hits) {
          const src = hit._source || {};
          const names = src.display_names || [];
          const entityName = src.entity_name || names[0];
          if (entityName) {
            addRecord({
              name: entityName,
              organization: entityName,
              description: `SEC filing entity. Filed: ${src.file_date || 'N/A'}. ${term}`,
              opportunity_type: 'vc',
              website: null,
              location: (src.biz_locations || [])[0] || '',
              chicago_focused: false,
              confidence_score: 75,
              source: 'sec_edgar_broad',
            });
          }
        }
        if (hits.length > 0) {
          console.log(`  [SEC EDGAR broad] "${term}": ${hits.length} hits`);
        }
      }
    } catch (e) {}
    await sleep(250);
  }

  // Also search by company name prefix for common VC naming patterns
  const prefixes = [
    'venture', 'capital', 'equity', 'growth', 'innovation',
    'partners', 'fund', 'holdings', 'group', 'management',
  ];

  for (const prefix of prefixes) {
    try {
      const url = `https://www.sec.gov/cgi-bin/browse-company?company=${encodeURIComponent(prefix)}&CIK=&type=ADV&dateb=&owner=include&count=100&search_text=&action=getcompany&output=atom`;
      const res = await fetchWithRetry(url, {}, 2, 500);
      if (res?.ok) {
        const text = await res.text();
        const entries = text.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        for (const entry of entries) {
          const nameMatch = entry.match(/<title[^>]*>([^<]+)<\/title>/);
          const cikMatch = entry.match(/CIK=(\d+)/);
          if (nameMatch) {
            const name = nameMatch[1].replace(/\s+/g, ' ').trim();
            if (name.length > 3 && !/^\d+$/.test(name)) {
              addRecord({
                name,
                organization: name,
                description: `SEC-registered entity. ${cikMatch ? 'CIK: ' + cikMatch[1] : ''}`,
                opportunity_type: 'vc',
                website: null,
                location: '',
                chicago_focused: false,
                confidence_score: 70,
                source: 'sec_edgar_broad',
              });
            }
          }
        }
        console.log(`  [SEC EDGAR prefix] "${prefix}": ${entries.length} entries, total = ${allRecords.length}`);
      }
    } catch (e) {}
    await sleep(300);
  }

  console.log(`\n  SEC EDGAR Broad added: ${allRecords.length - beforeCount}`);
}

// ─── 6. SEC EDGAR XBRL Company Facts (registered investment companies) ──────
async function harvestSECXBRL() {
  console.log('\n═══ SEC EDGAR Company Tickers ═══');
  const beforeCount = allRecords.length;

  try {
    // Get the full company tickers file from SEC
    const url = 'https://www.sec.gov/files/company_tickers.json';
    const res = await fetchWithRetry(url, {
      headers: { 'User-Agent': 'ChiStartupHub billy@chistartuphub.com' }
    }, 2, 2000);
    if (res?.ok) {
      const data = await res.json();
      const entries = Object.values(data);
      console.log(`  [SEC Tickers] Got ${entries.length} total companies`);

      // Filter for investment-relevant companies
      const investmentKeywords = /venture|capital fund|equity fund|investment fund|growth fund|angel|seed fund|innovation fund|startup|emerging|private equity|buyout|mezzanine|opportunity fund/i;
      for (const entry of entries) {
        const name = entry.title || entry.name;
        if (name && investmentKeywords.test(name)) {
          addRecord({
            name,
            organization: name,
            description: `SEC-registered company. Ticker: ${entry.ticker || 'N/A'}, CIK: ${entry.cik_str || 'N/A'}`,
            opportunity_type: 'vc',
            website: null,
            location: '',
            chicago_focused: false,
            confidence_score: 75,
            source: 'sec_tickers',
          });
        }
      }
      console.log(`  [SEC Tickers] Investment-relevant: ${allRecords.length - beforeCount}`);
    }
  } catch (e) {
    console.log(`  [SEC Tickers] Error: ${e.message}`);
  }

  // Also try investment company tickers
  try {
    const url = 'https://www.sec.gov/files/company_tickers_exchange.json';
    const res = await fetchWithRetry(url, {
      headers: { 'User-Agent': 'ChiStartupHub billy@chistartuphub.com' }
    }, 2, 2000);
    if (res?.ok) {
      const data = await res.json();
      const fields = data?.fields || [];
      const entries = data?.data || [];
      const nameIdx = fields.indexOf('name');
      const tickerIdx = fields.indexOf('ticker');
      const cikIdx = fields.indexOf('cik');
      const exchangeIdx = fields.indexOf('exchange');

      const investmentKeywords = /venture|capital|equity|fund|invest|growth|angel|seed|innovation|private|emerging|partner|manage|asset|wealth|strategic/i;
      let added = 0;
      for (const entry of entries) {
        const name = entry[nameIdx];
        if (name && investmentKeywords.test(name)) {
          addRecord({
            name,
            organization: name,
            description: `SEC-registered. Ticker: ${entry[tickerIdx] || 'N/A'}, Exchange: ${entry[exchangeIdx] || 'N/A'}`,
            opportunity_type: 'vc',
            website: null,
            location: '',
            chicago_focused: false,
            confidence_score: 75,
            source: 'sec_tickers',
          });
          added++;
        }
      }
      console.log(`  [SEC Tickers Exchange] Added ${added}, total = ${allRecords.length}`);
    }
  } catch (e) {}

  console.log(`\n  SEC Tickers added: ${allRecords.length - beforeCount}`);
}

// ─── 7. SEC Investment Adviser Registration Depository (bulk) ────────────────
async function harvestSECAdvisersBulk() {
  console.log('\n═══ SEC Investment Adviser Bulk Data ═══');
  const beforeCount = allRecords.length;

  // Try to get the IA firms list from SEC
  const urls = [
    'https://www.sec.gov/divisions/investment/iard/ia_advisers.csv',
    'https://www.sec.gov/files/data/investment-adviser-data/ia_firms.csv',
    'https://www.sec.gov/files/investment-adviser-data.csv',
  ];

  for (const url of urls) {
    try {
      const res = await fetchWithRetry(url, {
        headers: { 'User-Agent': 'ChiStartupHub billy@chistartuphub.com' }
      }, 2, 3000);
      if (res?.ok) {
        const text = await res.text();
        console.log(`  [SEC IA bulk] Got ${text.length} bytes from ${url}`);
        const lines = text.split('\n');
        const headers = lines[0]?.toLowerCase();
        console.log(`  [SEC IA bulk] Headers: ${headers?.substring(0, 200)}`);

        // Parse based on what we find
        if (lines.length > 1) {
          const investmentKeywords = /venture|capital|equity|fund|angel|seed|growth|innovation|technology|startup|emerging|private|partner|manage|asset|strategic/i;
          let added = 0;
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            // Try to extract firm name (usually first or second column)
            const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
            const name = parts[0] || parts[1];
            if (name && name.length > 3 && investmentKeywords.test(name)) {
              addRecord({
                name,
                organization: name,
                description: 'SEC-registered investment adviser (bulk data).',
                opportunity_type: 'vc',
                website: null,
                location: '',
                chicago_focused: false,
                confidence_score: 75,
                source: 'sec_ia_bulk',
              });
              added++;
            }
          }
          console.log(`  [SEC IA bulk] Added ${added} from ${url}`);
        }
      }
    } catch (e) {
      console.log(`  [SEC IA bulk] ${url}: ${e.message}`);
    }
    await sleep(500);
  }

  console.log(`\n  SEC IA Bulk added: ${allRecords.length - beforeCount}`);
}

// ─── 8. Additional ProPublica searches (more terms) ─────────────────────────
async function harvestProPublicaExpanded() {
  console.log('\n═══ ProPublica Expanded Search ═══');
  const beforeCount = allRecords.length;

  // More specific search terms for state-level funds
  const stateTerms = [
    'illinois venture', 'new york venture', 'california venture',
    'texas venture', 'massachusetts venture', 'chicago fund',
    'boston fund', 'silicon valley fund', 'bay area fund',
    'midwest fund', 'southeast fund', 'northwest fund',
    'community investment', 'economic development venture',
    'small business investment', 'minority business fund',
    'women fund investment', 'diversity fund',
    'university endowment', 'pension investment',
    'philanthropic venture', 'social impact investment',
  ];

  for (const term of stateTerms) {
    for (let page = 0; page < 5; page++) {
      try {
        const url = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encodeURIComponent(term)}&page=${page}`;
        const res = await fetchWithRetry(url, {}, 2, 500);
        if (!res?.ok) break;
        const data = await res.json();
        const orgs = data?.organizations || [];
        if (!orgs.length) break;

        for (const org of orgs) {
          const name = org.name;
          if (!name) continue;
          const isRelevant = /fund|capital|venture|invest|equity|partner|angel|seed|growth|innovation|enterprise|accelerat|incubat|development|foundation|endow|asset|manage/i.test(name);
          if (!isRelevant) continue;

          addRecord({
            name,
            organization: name,
            description: `IRS 990 organization. EIN: ${org.ein || 'N/A'}`,
            opportunity_type: 'grant',
            website: null,
            location: org.city && org.state ? `${org.city}, ${org.state}` : (org.state || ''),
            chicago_focused: (org.state === 'IL'),
            confidence_score: 70,
            source: 'irs_990',
          });
        }
        if (orgs.length < 25) break;
      } catch (e) { break; }
      await sleep(200);
    }
  }

  console.log(`\n  ProPublica Expanded added: ${allRecords.length - beforeCount}`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Government Data Source Harvester — ChiStartup Hub       ║');
  console.log('║  Target: 2,000+ unique investor/fund records             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Run all harvesters
  await harvestSECEdgar();
  await harvestProPublica();
  await harvestFINRA();
  await harvestSBA();
  await harvestSECEdgarBroad();
  await harvestSECXBRL();
  await harvestSECAdvisersBulk();
  await harvestProPublicaExpanded();

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  HARVEST COMPLETE                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\n  Total unique records: ${allRecords.length}`);

  // Source breakdown
  const sources = {};
  for (const r of allRecords) {
    sources[r.source] = (sources[r.source] || 0) + 1;
  }
  console.log('\n  By source:');
  for (const [src, count] of Object.entries(sources).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${src}: ${count}`);
  }

  // Chicago-focused count
  const chicagoCount = allRecords.filter(r => r.chicago_focused).length;
  console.log(`\n  Chicago-focused: ${chicagoCount}`);

  // Save to file
  writeFileSync(OUTPUT_PATH, JSON.stringify(allRecords, null, 2));
  console.log(`\n  Saved to: ${OUTPUT_PATH}`);

  // Also insert to staging
  console.log('\n  Inserting to staging table...');
  const result = await insertToStaging(allRecords, 'govt_sources');
  console.log(`\n  Staging result: ${JSON.stringify(result)}`);

  console.log('\n  Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  // Save whatever we have
  if (allRecords.length > 0) {
    writeFileSync(OUTPUT_PATH, JSON.stringify(allRecords, null, 2));
    console.log(`  Saved ${allRecords.length} records before crash to ${OUTPUT_PATH}`);
  }
  process.exit(1);
});
