#!/usr/bin/env node
/**
 * Populate the co-investment graph from Form D data.
 *
 * Reads the already-extracted Form D TSV files and:
 * 1. Inserts deals (Form D filings) into form_d_deals
 * 2. Matches related persons to existing investors
 * 3. Inserts deal_participants linking investors to deals
 * 4. Refreshes the coinvestment_pairs materialized view
 *
 * Prerequisites:
 *   - Run the coinvestment_graph migration first (20260311210000_coinvestment_graph.sql)
 *   - Form D data must be extracted in data/form-d/
 *
 * Usage:
 *   node scripts/populate-coinvestment-graph.mjs --dry-run
 *   node scripts/populate-coinvestment-graph.mjs
 */

import { config } from 'dotenv';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'fs';

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
const DATA_DIR = resolve(__dirname, '..', 'data', 'form-d');

function parseTSV(content) {
  const lines = content.split('\n');
  if (lines.length < 2) return [];
  const cols = lines[0].replace(/\r$/, '').split('\t');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '');
    if (!line.trim()) continue;
    const values = line.split('\t');
    const row = {};
    for (let j = 0; j < cols.length; j++) row[cols[j]] = (values[j] || '').trim();
    rows.push(row);
  }
  return rows;
}

function normalize(name) {
  return (name || '').toLowerCase()
    .replace(/[,.'"\-()]/g, '')
    .replace(/\b(llc|lp|inc|corp|ltd|co|group|fund|i{1,4}|iv|v)\b/g, '')
    .replace(/\s+/g, ' ').trim();
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Co-Investment Graph Builder                               ║');
  console.log(`║  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}                                                    ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Step 1: Load all investor names for matching
  console.log('Step 1: Loading investor index...');
  const investorIndex = new Map(); // normName → id
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?select=id,canonical_name&limit=1000&offset=${offset}`,
      { headers }
    );
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const inv of batch) {
      investorIndex.set(normalize(inv.canonical_name), inv.id);
    }
    offset += 1000;
  }
  console.log(`  Loaded ${investorIndex.size.toLocaleString()} investors\n`);

  // Step 2: Parse all Form D quarters
  console.log('Step 2: Parsing Form D filings...');
  const quarters = readdirSync(DATA_DIR).filter(f => f.endsWith('.zip')).sort();

  const deals = [];     // { accession, issuerName, cik, filingDate, totalOffering, totalSold, industry, fundType, city, state }
  const personsByDeal = new Map(); // accession → [{ name, relationship }]

  for (const zipFile of quarters) {
    const extractDir = join(DATA_DIR, zipFile.replace('.zip', ''));
    if (!existsSync(extractDir)) continue;

    // Find nested data dir
    let dataDir = extractDir;
    const entries = readdirSync(extractDir);
    for (const entry of entries) {
      if (statSync(join(extractDir, entry)).isDirectory()) {
        dataDir = join(extractDir, entry);
        break;
      }
    }

    const issuersPath = join(dataDir, 'ISSUERS.tsv');
    const offeringPath = join(dataDir, 'OFFERING.tsv');
    const submissionPath = join(dataDir, 'FORMDSUBMISSION.tsv');
    const personsPath = join(dataDir, 'RELATEDPERSONS.tsv');

    if (!existsSync(issuersPath)) continue;

    const issuers = parseTSV(readFileSync(issuersPath, 'utf-8'));
    const offerings = parseTSV(existsSync(offeringPath) ? readFileSync(offeringPath, 'utf-8') : '');
    const submissions = parseTSV(existsSync(submissionPath) ? readFileSync(submissionPath, 'utf-8') : '');
    const persons = parseTSV(existsSync(personsPath) ? readFileSync(personsPath, 'utf-8') : '');

    const offeringMap = new Map(offerings.map(o => [o.ACCESSIONNUMBER, o]));
    const submissionMap = new Map(submissions.map(s => [s.ACCESSIONNUMBER, s]));

    // Group persons by accession
    for (const p of persons) {
      if (!personsByDeal.has(p.ACCESSIONNUMBER)) personsByDeal.set(p.ACCESSIONNUMBER, []);
      const fullName = `${p.FIRSTNAME || ''} ${p.LASTNAME || ''}`.trim();
      if (fullName) {
        personsByDeal.get(p.ACCESSIONNUMBER).push({
          name: fullName,
          relationship: p.RELATIONSHIP || '',
        });
      }
    }

    // Build deal records from issuers (one per accession)
    const seenAccessions = new Set();
    for (const issuer of issuers) {
      const acc = issuer.ACCESSIONNUMBER;
      if (!acc || seenAccessions.has(acc)) continue;
      seenAccessions.add(acc);

      const offering = offeringMap.get(acc) || {};
      const submission = submissionMap.get(acc) || {};

      const totalOffering = offering.TOTALOFFERINGAMOUNT || null;
      const totalSold = parseFloat(offering.TOTALAMOUNTSOLD) || null;
      const filingDate = submission.FILEDDATE || null;

      deals.push({
        accession: acc,
        issuerName: (issuer.ENTITYNAME || '').trim(),
        cik: issuer.CIK || null,
        filingDate,
        totalOffering: totalOffering && totalOffering !== 'Indefinite' ? parseFloat(totalOffering) || null : null,
        totalSold,
        industry: offering.INDUSTRYGROUPTYPE || null,
        fundType: offering.INVESTMENTFUNDTYPE || null,
        city: issuer.CITY || null,
        state: issuer.STATEORCOUNTRYDESCRIPTION || issuer.STATEORCOUNTRY || null,
      });
    }

    process.stdout.write('.');
  }

  console.log(`\n  Parsed ${deals.length.toLocaleString()} deals`);
  console.log(`  Deals with related persons: ${personsByDeal.size.toLocaleString()}\n`);

  // Step 3: Find deals with multiple matchable investors (co-investments)
  console.log('Step 3: Finding co-investment deals...');

  let dealsWithMultipleInvestors = 0;
  let totalParticipantLinks = 0;
  const dealRecords = [];      // for form_d_deals insert
  const participantRecords = []; // for deal_participants insert (keyed by accession temporarily)

  for (const deal of deals) {
    const persons = personsByDeal.get(deal.accession) || [];
    if (persons.length === 0) continue;

    // Try to match each person's name to an investor
    const matchedInvestors = [];
    for (const person of persons) {
      // Match person names against investor names — crude but catches firms named after people
      const normPerson = normalize(person.name);
      const investorId = investorIndex.get(normPerson);
      if (investorId) {
        matchedInvestors.push({ investorId, personName: person.name, relationship: person.relationship });
      }
    }

    // Also try matching the issuer entity name itself (in case it's a fund raising for a VC)
    // But for co-investment, we care about deals where 2+ known investors appear

    if (matchedInvestors.length >= 1) {
      dealRecords.push({
        accession_number: deal.accession,
        issuer_name: deal.issuerName,
        issuer_cik: deal.cik,
        filing_date: deal.filingDate || null,
        total_offering_amount: deal.totalOffering,
        total_amount_sold: deal.totalSold,
        industry_group: deal.industry,
        fund_type: deal.fundType,
        hq_city: deal.city,
        hq_state: deal.state,
      });

      for (const m of matchedInvestors) {
        participantRecords.push({
          accession: deal.accession, // temporary, replaced with deal_id after insert
          investor_id: m.investorId,
          person_name: m.personName,
          relationship: m.relationship,
        });
        totalParticipantLinks++;
      }

      if (matchedInvestors.length >= 2) dealsWithMultipleInvestors++;
    }
  }

  console.log(`  Deals with 1+ matched investor: ${dealRecords.length.toLocaleString()}`);
  console.log(`  Deals with 2+ matched investors (co-investments): ${dealsWithMultipleInvestors.toLocaleString()}`);
  console.log(`  Total participant links: ${totalParticipantLinks.toLocaleString()}\n`);

  if (DRY_RUN) {
    console.log('[DRY RUN] No changes applied.\n');
    const analysisPath = resolve(__dirname, '..', 'data', 'coinvestment-analysis.json');
    writeFileSync(analysisPath, JSON.stringify({
      totalDeals: deals.length,
      dealsWithMatchedInvestors: dealRecords.length,
      dealsWithCoInvestors: dealsWithMultipleInvestors,
      totalParticipantLinks,
      sampleDeals: dealRecords.slice(0, 20),
      sampleParticipants: participantRecords.slice(0, 50),
    }, null, 2));
    console.log(`  Analysis saved to ${analysisPath}`);
    return;
  }

  // Step 4: Insert deals
  console.log('Step 4: Inserting deals...');
  const accessionToId = new Map(); // accession → deal_id
  let insertedDeals = 0;
  let dealErrors = 0;

  for (let i = 0; i < dealRecords.length; i += 500) {
    const batch = dealRecords.slice(i, i + 500);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/form_d_deals`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation,resolution=ignore-duplicates' },
      body: JSON.stringify(batch),
    });

    if (res.ok) {
      const inserted = await res.json();
      for (const row of inserted) {
        accessionToId.set(row.accession_number, row.id);
      }
      insertedDeals += inserted.length;
    } else {
      const err = await res.text();
      console.error(`  Deal insert error at ${i}: ${err.slice(0, 200)}`);
      dealErrors++;
    }

    if ((i + 500) % 5000 === 0) {
      console.log(`  Progress: ${Math.min(i + 500, dealRecords.length)}/${dealRecords.length}`);
    }
  }

  console.log(`  Inserted ${insertedDeals.toLocaleString()} deals (${dealErrors} errors)\n`);

  // Step 5: Insert participants
  console.log('Step 5: Inserting deal participants...');
  let insertedParticipants = 0;
  let participantErrors = 0;

  // Map accession to deal_id and build final records
  const finalParticipants = participantRecords
    .map(p => {
      const dealId = accessionToId.get(p.accession);
      if (!dealId) return null;
      return {
        deal_id: dealId,
        investor_id: p.investor_id,
        person_name: p.person_name,
        relationship: p.relationship,
      };
    })
    .filter(Boolean);

  for (let i = 0; i < finalParticipants.length; i += 500) {
    const batch = finalParticipants.slice(i, i + 500);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/deal_participants`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal,resolution=ignore-duplicates' },
      body: JSON.stringify(batch),
    });

    if (res.ok) {
      insertedParticipants += batch.length;
    } else {
      const err = await res.text();
      if (!err.includes('duplicate')) {
        console.error(`  Participant insert error at ${i}: ${err.slice(0, 200)}`);
        participantErrors++;
      }
    }

    if ((i + 500) % 5000 === 0) {
      console.log(`  Progress: ${Math.min(i + 500, finalParticipants.length)}/${finalParticipants.length}`);
    }
  }

  console.log(`  Inserted ${insertedParticipants.toLocaleString()} participants (${participantErrors} errors)\n`);

  // Note: Materialized view refresh requires direct SQL — user will need to run:
  // REFRESH MATERIALIZED VIEW coinvestment_pairs;

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  CO-INVESTMENT GRAPH SUMMARY                               ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Form D filings:    ${String(deals.length).padStart(8)}                          ║`);
  console.log(`║  Deals inserted:          ${String(insertedDeals).padStart(8)}                          ║`);
  console.log(`║  Participant links:       ${String(insertedParticipants).padStart(8)}                          ║`);
  console.log(`║  Co-investment deals:     ${String(dealsWithMultipleInvestors).padStart(8)}                          ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  NEXT: Run in Supabase SQL Editor:                         ║');
  console.log('║  REFRESH MATERIALIZED VIEW coinvestment_pairs;             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
