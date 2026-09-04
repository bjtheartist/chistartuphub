#!/usr/bin/env node
/**
 * Wikidata SPARQL Enrichment — $0 cost
 *
 * Queries Wikidata for all venture capital / private equity / investment firms
 * with structured data: HQ location, website, founding year, description.
 * Then cross-matches against our DB by normalized name.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

function normalize(name) {
  return (name || '').toLowerCase()
    .replace(/[,.'"\-()]/g, '')
    .replace(/\b(llc|lp|inc|corp|ltd|co|group|partners|capital|management|advisors|advisory|fund|holdings)\b/g, '')
    .replace(/\s+/g, ' ').trim();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// --- SPARQL queries for different entity types ---
const SPARQL_QUERIES = [
  {
    label: 'Venture Capital firms',
    query: `
SELECT ?item ?itemLabel ?website ?hqLabel ?countryLabel ?inception ?itemDescription WHERE {
  ?item wdt:P31/wdt:P279* wd:Q219577.  # instance of venture capital firm
  OPTIONAL { ?item wdt:P856 ?website. }
  OPTIONAL { ?item wdt:P159 ?hq. ?hq rdfs:label ?hqLabel. FILTER(LANG(?hqLabel) = "en") }
  OPTIONAL { ?item wdt:P17 ?country. ?country rdfs:label ?countryLabel. FILTER(LANG(?countryLabel) = "en") }
  OPTIONAL { ?item wdt:P571 ?inception. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 5000`
  },
  {
    label: 'Private equity firms',
    query: `
SELECT ?item ?itemLabel ?website ?hqLabel ?countryLabel ?inception ?itemDescription WHERE {
  ?item wdt:P31/wdt:P279* wd:Q1144888.  # private equity firm
  OPTIONAL { ?item wdt:P856 ?website. }
  OPTIONAL { ?item wdt:P159 ?hq. ?hq rdfs:label ?hqLabel. FILTER(LANG(?hqLabel) = "en") }
  OPTIONAL { ?item wdt:P17 ?country. ?country rdfs:label ?countryLabel. FILTER(LANG(?countryLabel) = "en") }
  OPTIONAL { ?item wdt:P571 ?inception. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 5000`
  },
  {
    label: 'Investment companies',
    query: `
SELECT ?item ?itemLabel ?website ?hqLabel ?countryLabel ?inception ?itemDescription WHERE {
  ?item wdt:P31/wdt:P279* wd:Q4830453.  # business enterprise subclass: investment company
  ?item wdt:P452 wd:Q1148747.  # industry: financial services
  OPTIONAL { ?item wdt:P856 ?website. }
  OPTIONAL { ?item wdt:P159 ?hq. ?hq rdfs:label ?hqLabel. FILTER(LANG(?hqLabel) = "en") }
  OPTIONAL { ?item wdt:P17 ?country. ?country rdfs:label ?countryLabel. FILTER(LANG(?countryLabel) = "en") }
  OPTIONAL { ?item wdt:P571 ?inception. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 5000`
  },
  {
    label: 'Angel investor organizations',
    query: `
SELECT ?item ?itemLabel ?website ?hqLabel ?countryLabel ?inception ?itemDescription WHERE {
  ?item wdt:P31/wdt:P279* wd:Q2137890.  # angel investor network
  OPTIONAL { ?item wdt:P856 ?website. }
  OPTIONAL { ?item wdt:P159 ?hq. ?hq rdfs:label ?hqLabel. FILTER(LANG(?hqLabel) = "en") }
  OPTIONAL { ?item wdt:P17 ?country. ?country rdfs:label ?countryLabel. FILTER(LANG(?countryLabel) = "en") }
  OPTIONAL { ?item wdt:P571 ?inception. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 2000`
  },
];

async function runSparql(query) {
  const url = 'https://query.wikidata.org/sparql';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'ChiStartupHub/1.0 (billyjoseph243@gmail.com)',
    },
    body: 'query=' + encodeURIComponent(query),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SPARQL ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.results.bindings;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Wikidata SPARQL Enrichment — $0 cost               ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Step 1: Run all SPARQL queries
  const allWikiEntities = new Map(); // normalized name → data

  for (const q of SPARQL_QUERIES) {
    console.log(`Querying: ${q.label}...`);
    try {
      const results = await runSparql(q.query);
      console.log(`  Got ${results.length} results`);

      for (const r of results) {
        const name = r.itemLabel?.value;
        if (!name) continue;
        const key = normalize(name);
        if (!key || key.length < 3) continue;

        const entity = allWikiEntities.get(key) || {};
        entity.name = name;
        if (r.website?.value) entity.website = r.website.value;
        if (r.hqLabel?.value) entity.location = r.hqLabel.value;
        if (r.countryLabel?.value) entity.country = r.countryLabel.value;
        if (r.itemDescription?.value && r.itemDescription.value.length > 10) {
          entity.description = r.itemDescription.value;
        }
        allWikiEntities.set(key, entity);
      }
      await sleep(2000); // Be polite to Wikidata
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }

  console.log(`\nTotal unique Wikidata entities: ${allWikiEntities.size}\n`);

  // Step 2: Fetch our DB records that are missing data
  console.log('Fetching DB records to match...');
  let offset = 0;
  let matched = 0, enrichedWebsite = 0, enrichedLocation = 0, enrichedDesc = 0;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/funding_opportunities?select=id,name,organization,website,location,description,completeness_score&or=(website.is.null,location.is.null)&limit=1000&offset=${offset}`,
      { headers }
    );
    const records = await res.json();
    if (records.length === 0) break;

    for (const rec of records) {
      const nameKey = normalize(rec.name);
      const orgKey = normalize(rec.organization);
      const wiki = allWikiEntities.get(nameKey) || allWikiEntities.get(orgKey);
      if (!wiki) continue;

      const patch = {};
      if (!rec.website && wiki.website) {
        patch.website = wiki.website;
        enrichedWebsite++;
      }
      if (!rec.location && wiki.location) {
        const loc = wiki.country ? `${wiki.location}, ${wiki.country}` : wiki.location;
        patch.location = loc;
        enrichedLocation++;
      }
      if ((!rec.description || rec.description.length < 30) && wiki.description) {
        // Only add if Wikidata description is meaningful (not just "company")
        if (wiki.description.length > 20) {
          patch.description = wiki.description;
          enrichedDesc++;
        }
      }

      if (Object.keys(patch).length > 0) {
        // Recalculate score
        const merged = { ...rec, ...patch };
        patch.completeness_score = calcScore(merged);

        await fetch(`${SUPABASE_URL}/rest/v1/funding_opportunities?id=eq.${rec.id}`, {
          method: 'PATCH', headers, body: JSON.stringify(patch),
        });
        matched++;
      }
    }

    offset += 1000;
    if (records.length < 1000) break;
    if (offset % 5000 === 0) console.log(`  Scanned ${offset} records, ${matched} matched so far`);
  }

  console.log(`\n✓ Wikidata enrichment complete:`);
  console.log(`  Matched: ${matched}`);
  console.log(`  Websites added: ${enrichedWebsite}`);
  console.log(`  Locations added: ${enrichedLocation}`);
  console.log(`  Descriptions added: ${enrichedDesc}`);
  console.log(`  Cost: $0.00`);
}

function calcScore(rec) {
  let s = 0;
  if (rec.name && rec.name.length > 2) s += 15;
  if (rec.organization && rec.organization.length > 0) s += 10;
  if (rec.description && rec.description.length >= 50) s += 20;
  else if (rec.description && rec.description.length >= 20) s += 10;
  if (rec.website && rec.website.startsWith('http')) s += 15;
  if (rec.check_size_min || rec.check_size_max) s += 15;
  if (rec.location && rec.location.length > 2) s += 10;
  if (rec.sectors && rec.sectors.length > 0) s += 5;
  if (rec.stage && rec.stage.length > 0) s += 5;
  if (rec.embedding) s += 5;
  return s;
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
