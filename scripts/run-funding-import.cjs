/**
 * Run Funding Import via Supabase REST API
 * Uses service role key to bypass RLS
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/run-funding-import.cjs');
  process.exit(1);
}

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]).map(h => h.trim());

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length >= headers.length - 1) {
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

// Parse focus areas string to array
function parseFocusAreas(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(s => s);
}

async function makeRequest(endpoint, method, body = null) {
  const options = {
    method,
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error: ${response.status} - ${text}`);
  }

  return response.json();
}

async function main() {
  console.log('Starting funding data import...\n');

  // Step 1: Delete existing data
  console.log('Step 1: Deleting existing data...');

  try {
    // Delete ALL records using name is not null (which is always true)
    const deleteResp = await fetch(`${SUPABASE_URL}/rest/v1/funding_opportunities?name=neq.`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    });
    if (deleteResp.ok) {
      console.log('  ✓ Deleted funding_opportunities');
    } else {
      const text = await deleteResp.text();
      console.log('  Delete failed:', text);
    }
  } catch (e) {
    console.log('  Error deleting funding_opportunities:', e.message);
  }

  try {
    const deleteResp2 = await fetch(`${SUPABASE_URL}/rest/v1/upcoming_opportunities?name=neq.`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    });
    if (deleteResp2.ok) {
      console.log('  ✓ Deleted upcoming_opportunities');
    }
  } catch (e) {
    console.log('  Note: upcoming_opportunities may already be empty');
  }

  // Step 2: Load and parse CSV files
  console.log('\nStep 2: Loading CSV files...');
  const nonDilutivePath = path.join(process.env.HOME, 'Downloads', 'non_dilutive_capital_MASTER.csv');
  const equityPath = path.join(process.env.HOME, 'Downloads', 'equity_funding_MASTER.csv');

  const nonDilutiveRecords = parseCSV(nonDilutivePath);
  const equityRecords = parseCSV(equityPath);
  console.log(`  ✓ Loaded ${nonDilutiveRecords.length} non-dilutive records`);
  console.log(`  ✓ Loaded ${equityRecords.length} equity records`);

  // Step 3: Transform and insert non-dilutive records
  console.log('\nStep 3: Inserting non-dilutive funding...');

  const nonDilutiveData = nonDilutiveRecords.map(record => {
    const descParts = [];
    if (record.eligibility) descParts.push(record.eligibility);
    if (record.notes) descParts.push(record.notes);
    if (record.award_amount) descParts.push(`Award: ${record.award_amount}`);
    if (record.location_requirement) descParts.push(`Location: ${record.location_requirement}`);
    // Include frequency/deadline info in description if not a valid date
    if (record.application_deadline && !/^\d{4}-\d{2}-\d{2}$/.test(record.application_deadline)) {
      descParts.push(`Deadline: ${record.application_deadline}`);
    }

    // Only use deadline if it's a valid date format (YYYY-MM-DD)
    let deadline = null;
    if (record.application_deadline && /^\d{4}-\d{2}-\d{2}$/.test(record.application_deadline)) {
      deadline = record.application_deadline;
    }

    return {
      name: record.name,
      opportunity_type: mapNonDilutiveType(record.type),
      description: descParts.join(' | ') || null,
      organization: record.organization || null,
      stage: parseFocusAreas(record.stage || record.focus_areas),
      sectors: parseFocusAreas(record.focus_areas),
      website: record.website || record.application_url || null,
      featured: record.featured?.toLowerCase() === 'true',
      deadline: deadline
    };
  });

  // Insert in batches
  const batchSize = 50;
  let insertedNonDilutive = 0;

  for (let i = 0; i < nonDilutiveData.length; i += batchSize) {
    const batch = nonDilutiveData.slice(i, i + batchSize);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/funding_opportunities`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(batch)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`  Error inserting batch: ${text}`);
    } else {
      insertedNonDilutive += batch.length;
    }
  }
  console.log(`  ✓ Inserted ${insertedNonDilutive} non-dilutive records`);

  // Step 4: Transform and insert equity records
  console.log('\nStep 4: Inserting equity funding...');

  const equityData = equityRecords.map(record => {
    const descParts = [];
    if (record.description) descParts.push(record.description);
    if (record.category === 'underrepresented') descParts.push('Focus on underrepresented founders');
    if (record.check_size_range) descParts.push(`Check size: ${record.check_size_range}`);

    // Parse stages from all_stages column
    const stages = record.all_stages ? parseFocusAreas(record.all_stages) : [record.primary_stage].filter(Boolean);

    return {
      name: record.name,
      opportunity_type: mapEquityType(record.primary_stage),
      description: descParts.join(' | ') || null,
      organization: record.organization || null,
      stage: stages,
      sectors: parseFocusAreas(record.focus_areas),
      website: record.website || record.application_url || null,
      featured: record.featured?.toLowerCase() === 'true',
      deadline: null  // VCs have rolling applications
    };
  });

  let insertedEquity = 0;

  for (let i = 0; i < equityData.length; i += batchSize) {
    const batch = equityData.slice(i, i + batchSize);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/funding_opportunities`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(batch)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`  Error inserting batch: ${text}`);
    } else {
      insertedEquity += batch.length;
    }
  }
  console.log(`  ✓ Inserted ${insertedEquity} equity records`);

  // Step 5: Verify
  console.log('\nStep 5: Verifying import...');

  const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/funding_opportunities?select=id`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  const allRecords = await countResponse.json();
  console.log(`  ✓ Total records in database: ${allRecords.length}`);

  // Get counts by type
  const typesResponse = await fetch(`${SUPABASE_URL}/rest/v1/funding_opportunities?select=opportunity_type`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  const typeRecords = await typesResponse.json();

  const typeCounts = {};
  typeRecords.forEach(r => {
    const type = r.opportunity_type || 'Unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  console.log('\n  Records by type:');
  Object.entries(typeCounts).sort().forEach(([type, count]) => {
    console.log(`    ${type}: ${count}`);
  });

  console.log('\n✅ Import complete!');
}

main().catch(console.error);
