/**
 * Add Q1 2026 Funding Opportunities
 * Uses service role key to bypass RLS
 */

const XLSX = require('xlsx');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/add-q1-2026-opportunities.cjs');
  process.exit(1);
}

// Map opportunity type
function mapOpportunityType(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('grant') && t.includes('competition')) return 'Competition';
  if (t.includes('grant')) return 'Grant';
  if (t.includes('accelerator')) return 'Accelerator';
  if (t.includes('competition') || t.includes('pitch')) return 'Competition';
  if (t.includes('venture') || t.includes('investment')) return 'VC';
  if (t.includes('fellowship')) return 'Fellowship';
  return 'Grant';
}

// Parse focus areas to array
function parseFocusAreas(str) {
  if (!str) return [];
  return str.split(/[,\/]/).map(s => s.trim()).filter(s => s);
}

// Parse deadline to date or null
function parseDeadline(str) {
  if (!str) return null;

  // Check if it's a rolling/quarterly/varies deadline
  const lowerStr = str.toLowerCase();
  if (lowerStr.includes('rolling') || lowerStr.includes('quarterly') ||
      lowerStr.includes('check') || lowerStr.includes('varies') ||
      lowerStr.includes('monthly')) {
    return null;
  }

  // Try to extract date pattern like "January 1, 2026"
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                      'july', 'august', 'september', 'october', 'november', 'december'];

  for (let i = 0; i < monthNames.length; i++) {
    if (lowerStr.includes(monthNames[i])) {
      const match = str.match(/(\d{1,2})[,\s]+(\d{4})/);
      if (match) {
        const day = match[1].padStart(2, '0');
        const year = match[2];
        const month = String(i + 1).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
  }

  return null;
}

async function main() {
  console.log('Adding Q1 2026 funding opportunities...\n');

  // Read Excel file
  const filePath = path.join(process.env.HOME, 'Downloads', 'q1_2026_funding_opportunities.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json(sheet);

  console.log(`Found ${records.length} opportunities to add\n`);

  // Get existing opportunity names to avoid duplicates
  const existingResp = await fetch(`${SUPABASE_URL}/rest/v1/funding_opportunities?select=name`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  const existing = await existingResp.json();
  const existingNames = new Set((existing || []).map(o => o.name.toLowerCase()));

  // Transform records
  const opportunities = records.map(record => {
    const descParts = [];
    if (record.Eligibility) descParts.push(record.Eligibility);
    if (record.Notes) descParts.push(record.Notes);
    if (record.Amount) descParts.push(`Amount: ${record.Amount}`);

    const deadline = parseDeadline(record.Deadline);
    if (!deadline && record.Deadline) {
      descParts.push(`Deadline: ${record.Deadline}`);
    }

    return {
      name: record['Opportunity Name'],
      opportunity_type: mapOpportunityType(record.Type),
      description: descParts.join(' | ') || null,
      organization: null,
      stage: [],
      sectors: parseFocusAreas(record['Focus Area']),
      website: record.Website ? (record.Website.startsWith('http') ? record.Website : `https://${record.Website}`) : null,
      featured: false,
      deadline: deadline
    };
  });

  // Filter out duplicates
  const newOpportunities = opportunities.filter(opp => !existingNames.has(opp.name.toLowerCase()));
  const skipped = opportunities.length - newOpportunities.length;

  console.log(`Inserting ${newOpportunities.length} new opportunities (${skipped} duplicates skipped)\n`);

  if (newOpportunities.length === 0) {
    console.log('No new opportunities to add.');
    return;
  }

  // Insert in batches
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < newOpportunities.length; i += batchSize) {
    const batch = newOpportunities.slice(i, i + batchSize);
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
      console.error(`Error inserting batch: ${text}`);
    } else {
      inserted += batch.length;
      batch.forEach(opp => console.log(`  ✓ ${opp.name}`));
    }
  }

  console.log(`\n✅ Added ${inserted} new Q1 2026 opportunities!`);

  // Verify total count
  const countResp = await fetch(`${SUPABASE_URL}/rest/v1/funding_opportunities?select=id`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  const allRecords = await countResp.json();
  console.log(`\nTotal opportunities in database: ${allRecords.length}`);
}

main().catch(console.error);
