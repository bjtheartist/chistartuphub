/**
 * Funding Data Import Script
 *
 * This script:
 * 1. Deletes all existing funding_opportunities and upcoming_opportunities data
 * 2. Imports data from both master CSV files into funding_opportunities table
 *
 * Run with: node scripts/import-funding-data.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const supabaseUrl = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('ERROR: SUPABASE_SERVICE_KEY environment variable is required');
  console.error('Get it from: Supabase Dashboard > Settings > API > service_role key');
  console.error('Run with: SUPABASE_SERVICE_KEY=your_key node scripts/import-funding-data.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Transform non-dilutive capital record to unified schema
function transformNonDilutive(record) {
  // Map type to opportunity_type
  const typeMap = {
    'grant': 'Grant',
    'grant program': 'Grant',
    'grant + resources': 'Grant',
    'grant/prize': 'Grant',
    'grant + program': 'Grant',
    'grant/loan': 'Grant',
    'accelerator': 'Accelerator',
    'accelerator + grant': 'Accelerator',
    'accelerator + investment': 'Accelerator',
    'accelerator + resources': 'Accelerator',
    'competition': 'Competition',
    'competition + accelerator': 'Competition',
    'credits': 'Credits',
    'credits + program': 'Credits',
    'fellowship': 'Fellowship',
    'fellowship + grant': 'Fellowship',
    'incubator (non-equity)': 'Accelerator',
    'program (non-equity)': 'Accelerator',
    'program + prizes': 'Accelerator',
    'award': 'Grant',
    'microloan + grant': 'Grant',
    'voucher': 'Grant',
  };

  const rawType = (record.type || '').toLowerCase();
  const opportunityType = typeMap[rawType] || 'Grant';

  return {
    name: record.name,
    opportunity_type: opportunityType,
    funding_category: 'non_dilutive',
    award_amount: record.award_amount,
    primary_stage: null,
    all_stages: null,
    location_primary: record.location_requirement,
    location_all: record.location_requirement,
    location_requirement: record.location_requirement,
    deadline: record.application_deadline,
    frequency: record.frequency,
    eligibility: record.eligibility,
    focus_areas: record.focus_areas,
    description: record.notes,
    website: record.website,
    application_url: record.application_url,
    portfolio_size: null,
    notable_investments: null,
    notes: record.notes,
    featured: record.featured?.toLowerCase() === 'true',
  };
}

// Transform equity funding record to unified schema
function transformEquity(record) {
  // Map primary_stage to opportunity_type
  const stageTypeMap = {
    'accelerator': 'Accelerator',
    'preseed': 'VC',
    'pre-seed': 'VC',
    'seed': 'VC',
    'series a': 'VC',
    'series a+': 'VC',
    'series b': 'VC',
    'growth': 'VC',
    'studio': 'VC',
    'studio/seed': 'VC',
  };

  const rawStage = (record.primary_stage || '').toLowerCase();
  const opportunityType = stageTypeMap[rawStage] || 'VC';

  return {
    name: record.name,
    opportunity_type: opportunityType,
    funding_category: 'equity',
    award_amount: record.check_size_range,
    primary_stage: record.primary_stage,
    all_stages: record.all_stages,
    location_primary: record.location_primary,
    location_all: record.location_all,
    location_requirement: null,
    deadline: 'Rolling', // VCs generally have rolling applications
    frequency: 'Rolling',
    eligibility: record.category === 'underrepresented' ? 'Underrepresented founders' : null,
    focus_areas: record.focus_areas,
    description: record.description,
    website: record.website,
    application_url: record.application_url,
    portfolio_size: record.portfolio_size,
    notable_investments: record.notable_investments,
    notes: record.notes,
    featured: record.featured?.toLowerCase() === 'true',
  };
}

async function main() {
  console.log('='.repeat(60));
  console.log('FUNDING DATA IMPORT SCRIPT');
  console.log('='.repeat(60));

  // Step 1: Delete existing data
  console.log('\n[1/4] Deleting existing data...');

  const { error: deleteOppsError } = await supabase
    .from('funding_opportunities')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteOppsError) {
    console.error('Error deleting funding_opportunities:', deleteOppsError);
  } else {
    console.log('✓ Deleted all funding_opportunities');
  }

  const { error: deleteUpcomingError } = await supabase
    .from('upcoming_opportunities')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteUpcomingError) {
    console.error('Error deleting upcoming_opportunities:', deleteUpcomingError);
  } else {
    console.log('✓ Deleted all upcoming_opportunities');
  }

  // Step 2: Read and parse CSV files
  console.log('\n[2/4] Reading CSV files...');

  const nonDilutivePath = path.join(process.env.HOME, 'Downloads', 'non_dilutive_capital_MASTER.csv');
  const equityPath = path.join(process.env.HOME, 'Downloads', 'equity_funding_MASTER.csv');

  const nonDilutiveRecords = parseCSV(nonDilutivePath);
  const equityRecords = parseCSV(equityPath);

  console.log(`✓ Parsed ${nonDilutiveRecords.length} non-dilutive records`);
  console.log(`✓ Parsed ${equityRecords.length} equity records`);

  // Step 3: Transform records
  console.log('\n[3/4] Transforming records...');

  const transformedNonDilutive = nonDilutiveRecords.map(transformNonDilutive);
  const transformedEquity = equityRecords.map(transformEquity);

  const allRecords = [...transformedNonDilutive, ...transformedEquity];
  console.log(`✓ Total records to import: ${allRecords.length}`);

  // Step 4: Insert records
  console.log('\n[4/4] Inserting records into database...');

  // Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < allRecords.length; i += batchSize) {
    const batch = allRecords.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('funding_opportunities')
      .insert(batch);

    if (error) {
      console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      process.stdout.write(`\r  Inserted: ${inserted}/${allRecords.length}`);
    }
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(60));
  console.log(`✓ Successfully inserted: ${inserted} records`);
  if (errors > 0) {
    console.log(`✗ Errors: ${errors} records`);
  }

  // Verify counts
  const { count: finalCount } = await supabase
    .from('funding_opportunities')
    .select('*', { count: 'exact', head: true });

  console.log(`\nFinal database count: ${finalCount} records`);
}

main().catch(console.error);
