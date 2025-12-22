/**
 * Generate SQL for Funding Data Import
 *
 * This script reads the master CSV files and generates SQL statements
 * that can be run in the Supabase SQL Editor.
 *
 * Run with: node scripts/generate-funding-sql.js > funding-import.sql
 */

const fs = require('fs');
const path = require('path');

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index]?.trim() || null;
      });
      records.push(record);
    }
  }
  return records;
}

// Handle CSV lines with quoted fields containing commas
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Escape single quotes for SQL
function escapeSql(str) {
  if (!str) return null;
  return str.replace(/'/g, "''");
}

// Convert focus areas string to PostgreSQL array format
function toArrayLiteral(str) {
  if (!str) return 'ARRAY[]::text[]';
  const items = str.split(',').map(s => `'${escapeSql(s.trim())}'`).join(',');
  return `ARRAY[${items}]`;
}

// Map non-dilutive type to opportunity_type
function mapNonDilutiveType(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('grant')) return 'Grant';
  if (t.includes('accelerator')) return 'Accelerator';
  if (t.includes('competition')) return 'Competition';
  if (t.includes('credits')) return 'Credits';
  if (t.includes('fellowship')) return 'Fellowship';
  if (t.includes('incubator')) return 'Accelerator';
  if (t.includes('program')) return 'Accelerator';
  if (t.includes('award')) return 'Grant';
  if (t.includes('voucher')) return 'Grant';
  return 'Grant';
}

// Map equity stage to opportunity_type
function mapEquityType(stage) {
  const s = (stage || '').toLowerCase();
  if (s === 'accelerator') return 'Accelerator';
  return 'VC';
}

// Generate SQL for non-dilutive record
function nonDilutiveToSQL(record) {
  const opportunityType = mapNonDilutiveType(record.type);
  const featured = record.featured?.toLowerCase() === 'true';

  return `(
    '${escapeSql(record.name)}',
    '${opportunityType}',
    ${record.award_amount ? `'${escapeSql(record.award_amount)}'` : 'NULL'},
    ${record.location_requirement ? `'${escapeSql(record.location_requirement)}'` : 'NULL'},
    ${record.application_deadline ? `'${escapeSql(record.application_deadline)}'` : 'NULL'},
    ${record.eligibility ? `'${escapeSql(record.eligibility)}'` : 'NULL'},
    ${toArrayLiteral(record.focus_areas)},
    ${record.notes ? `'${escapeSql(record.notes)}'` : 'NULL'},
    ${record.website ? `'${escapeSql(record.website)}'` : 'NULL'},
    ${record.application_url ? `'${escapeSql(record.application_url)}'` : 'NULL'},
    ${featured},
    ${record.frequency ? `'${escapeSql(record.frequency)}'` : 'NULL'}
  )`;
}

// Generate SQL for equity record
function equityToSQL(record) {
  const opportunityType = mapEquityType(record.primary_stage);
  const featured = record.featured?.toLowerCase() === 'true';

  // Build stage array
  let stageArray = 'ARRAY[]::text[]';
  if (record.all_stages) {
    const stages = record.all_stages.split(',').map(s => `'${escapeSql(s.trim())}'`).join(',');
    stageArray = `ARRAY[${stages}]`;
  }

  return `(
    '${escapeSql(record.name)}',
    '${opportunityType}',
    ${record.check_size_range ? `'${escapeSql(record.check_size_range)}'` : 'NULL'},
    ${record.location_primary ? `'${escapeSql(record.location_primary)}'` : 'NULL'},
    'Rolling',
    ${record.category === 'underrepresented' ? `'Underrepresented founders'` : 'NULL'},
    ${toArrayLiteral(record.focus_areas)},
    ${record.description ? `'${escapeSql(record.description)}'` : 'NULL'},
    ${record.website ? `'${escapeSql(record.website)}'` : 'NULL'},
    ${record.application_url ? `'${escapeSql(record.application_url)}'` : 'NULL'},
    ${featured},
    'Rolling',
    ${stageArray},
    ${record.portfolio_size ? `'${escapeSql(record.portfolio_size)}'` : 'NULL'},
    ${record.notable_investments ? `'${escapeSql(record.notable_investments)}'` : 'NULL'}
  )`;
}

function main() {
  const nonDilutivePath = path.join(process.env.HOME, 'Downloads', 'non_dilutive_capital_MASTER.csv');
  const equityPath = path.join(process.env.HOME, 'Downloads', 'equity_funding_MASTER.csv');

  const nonDilutiveRecords = parseCSV(nonDilutivePath);
  const equityRecords = parseCSV(equityPath);

  console.log(`-- =========================================`);
  console.log(`-- FUNDING DATA IMPORT SQL`);
  console.log(`-- Generated: ${new Date().toISOString()}`);
  console.log(`-- Non-dilutive records: ${nonDilutiveRecords.length}`);
  console.log(`-- Equity records: ${equityRecords.length}`);
  console.log(`-- Total: ${nonDilutiveRecords.length + equityRecords.length}`);
  console.log(`-- =========================================`);
  console.log();

  // Step 1: Delete existing data
  console.log(`-- STEP 1: Delete existing data`);
  console.log(`DELETE FROM funding_opportunities;`);
  console.log(`DELETE FROM upcoming_opportunities;`);
  console.log();

  // Step 2: Insert non-dilutive records (using core columns only)
  console.log(`-- STEP 2: Insert non-dilutive funding (${nonDilutiveRecords.length} records)`);
  console.log(`INSERT INTO funding_opportunities (`);
  console.log(`  name, opportunity_type, check_size, location, deadline,`);
  console.log(`  focus_areas, description, website, link, featured`);
  console.log(`) VALUES`);

  const nonDilutiveValues = nonDilutiveRecords.map((record, idx) => {
    const opportunityType = mapNonDilutiveType(record.type);
    const featured = record.featured?.toLowerCase() === 'true';

    // Combine eligibility and notes into description
    const descParts = [];
    if (record.eligibility) descParts.push(record.eligibility);
    if (record.notes) descParts.push(record.notes);
    const description = descParts.join(' | ');

    return `(
    '${escapeSql(record.name)}',
    '${opportunityType}',
    ${record.award_amount ? `'${escapeSql(record.award_amount)}'` : 'NULL'},
    ${record.location_requirement ? `'${escapeSql(record.location_requirement)}'` : 'NULL'},
    ${record.application_deadline ? `'${escapeSql(record.application_deadline)}'` : 'NULL'},
    ${toArrayLiteral(record.focus_areas)},
    ${description ? `'${escapeSql(description)}'` : 'NULL'},
    ${record.website ? `'${escapeSql(record.website)}'` : 'NULL'},
    ${record.application_url ? `'${escapeSql(record.application_url)}'` : 'NULL'},
    ${featured}
  )${idx < nonDilutiveRecords.length - 1 ? ',' : ';'}`;
  });

  console.log(nonDilutiveValues.join('\n'));
  console.log();

  // Step 3: Insert equity records
  console.log(`-- STEP 3: Insert equity funding (${equityRecords.length} records)`);
  console.log(`INSERT INTO funding_opportunities (`);
  console.log(`  name, opportunity_type, check_size, location, deadline,`);
  console.log(`  focus_areas, description, website, link, featured`);
  console.log(`) VALUES`);

  const equityValues = equityRecords.map((record, idx) => {
    const opportunityType = mapEquityType(record.primary_stage);
    const featured = record.featured?.toLowerCase() === 'true';

    // Build description
    const descParts = [];
    if (record.description) descParts.push(record.description);
    if (record.category === 'underrepresented') descParts.push('Focus on underrepresented founders');
    const description = descParts.join(' | ');

    return `(
    '${escapeSql(record.name)}',
    '${opportunityType}',
    ${record.check_size_range ? `'${escapeSql(record.check_size_range)}'` : 'NULL'},
    ${record.location_primary ? `'${escapeSql(record.location_primary)}'` : 'NULL'},
    'Rolling',
    ${toArrayLiteral(record.focus_areas)},
    ${description ? `'${escapeSql(description)}'` : 'NULL'},
    ${record.website ? `'${escapeSql(record.website)}'` : 'NULL'},
    ${record.application_url ? `'${escapeSql(record.application_url)}'` : 'NULL'},
    ${featured}
  )${idx < equityRecords.length - 1 ? ',' : ';'}`;
  });

  console.log(equityValues.join('\n'));
  console.log();

  // Step 4: Verify
  console.log(`-- STEP 5: Verify import`);
  console.log(`SELECT opportunity_type, COUNT(*) FROM funding_opportunities GROUP BY opportunity_type ORDER BY opportunity_type;`);
  console.log(`SELECT COUNT(*) as total FROM funding_opportunities;`);
}

main();
