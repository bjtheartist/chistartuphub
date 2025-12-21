import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTIyNjIsImV4cCI6MjA4MTkyODI2Mn0.k6yRcQ60OONig97VQZ-UJdmC49ijEm7kskP_2qtaW1E';

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_DIR = '/Users/billyndizeye/Downloads/Chistartuphub exported data';

// Parse CSV with proper handling of quoted fields
function parseCSV(content) {
  const lines = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

function parseBoolean(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    return val.toLowerCase() === 'true';
  }
  return false;
}

function parseArray(val) {
  if (!val || val === '[]') return [];
  try {
    // Handle JSON array format
    if (val.startsWith('[')) {
      return JSON.parse(val.replace(/'/g, '"'));
    }
    return [val];
  } catch {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
}

function parseDate(val) {
  if (!val) return null;
  try {
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
}

async function importCommunities() {
  console.log('Importing communities...');
  const content = fs.readFileSync(path.join(DATA_DIR, 'Community_export.csv'), 'utf-8');
  const rows = parseCSV(content);

  const data = rows.map(row => ({
    name: row.name,
    description: row.description,
    website: row.website,
    featured: parseBoolean(row.featured),
    created_date: parseDate(row.created_date),
  }));

  const { error } = await supabase.from('communities').insert(data);
  if (error) console.error('Communities error:', error.message);
  else console.log(`  Imported ${data.length} communities`);
}

async function importStories() {
  console.log('Importing stories...');
  const content = fs.readFileSync(path.join(DATA_DIR, 'Story_export.csv'), 'utf-8');
  const rows = parseCSV(content);

  const data = rows.map(row => ({
    company_name: row.company_name,
    logo_url: row.image_url,
    tagline: row.category,
    description: row.journey_summary,
    founders: row.founder_name ? [row.founder_name] : [],
    founded_year: row.founded ? parseInt(row.founded) : null,
    sector: row.category,
    funding_raised: row.exit_value,
    is_unicorn: false,
    competitive_moat: row.primary_power,
    moat_description: row.power_analysis,
    key_insights: [],
    website: row.website,
    featured: parseBoolean(row.featured),
    created_date: parseDate(row.created_date),
  }));

  const { error } = await supabase.from('stories').insert(data);
  if (error) console.error('Stories error:', error.message);
  else console.log(`  Imported ${data.length} stories`);
}

async function importAccelerators() {
  console.log('Importing accelerators...');
  const content = fs.readFileSync(path.join(DATA_DIR, 'Accelerator_export.csv'), 'utf-8');
  const rows = parseCSV(content);

  const data = rows.map(row => ({
    name: row.name,
    description: row.description,
    website: row.link,
    focus_areas: parseArray(row.category),
    featured: parseBoolean(row.featured),
    created_date: parseDate(row.created_date),
  }));

  const { error } = await supabase.from('accelerators').insert(data);
  if (error) console.error('Accelerators error:', error.message);
  else console.log(`  Imported ${data.length} accelerators`);
}

async function importEvents() {
  console.log('Importing events...');
  const content = fs.readFileSync(path.join(DATA_DIR, 'EventHub_export.csv'), 'utf-8');
  const rows = parseCSV(content);

  const data = rows.map(row => ({
    name: row.name,
    description: row.description,
    registration_link: row.link,
    featured: parseBoolean(row.featured),
    created_date: parseDate(row.created_date),
  }));

  const { error } = await supabase.from('events').insert(data);
  if (error) console.error('Events error:', error.message);
  else console.log(`  Imported ${data.length} events`);
}

async function importWorkspaces() {
  console.log('Importing workspaces...');
  const content = fs.readFileSync(path.join(DATA_DIR, 'Workspace_export.csv'), 'utf-8');
  const rows = parseCSV(content);

  const data = rows.map(row => ({
    name: row.name,
    description: row.description,
    website: row.website,
    address: row.address,
    latitude: row.latitude ? parseFloat(row.latitude) : null,
    longitude: row.longitude ? parseFloat(row.longitude) : null,
    amenities: parseArray(row.ideal_for),
    featured: parseBoolean(row.featured),
    created_date: parseDate(row.created_date),
  }));

  const { error } = await supabase.from('workspaces').insert(data);
  if (error) console.error('Workspaces error:', error.message);
  else console.log(`  Imported ${data.length} workspaces`);
}

async function importFundingOpportunities() {
  console.log('Importing funding opportunities...');
  const content = fs.readFileSync(path.join(DATA_DIR, 'FundingOpportunity_export (7).csv'), 'utf-8');
  const rows = parseCSV(content);

  const data = rows.map(row => ({
    name: row.name,
    description: row.note,
    opportunity_type: row.category || 'VC',
    stage: parseArray(row.stage),
    sectors: parseArray(row.focus_areas),
    website: row.link,
    featured: parseBoolean(row.featured),
    created_date: parseDate(row.created_date),
  }));

  const { error } = await supabase.from('funding_opportunities').insert(data);
  if (error) console.error('Funding opportunities error:', error.message);
  else console.log(`  Imported ${data.length} funding opportunities`);
}

async function importFundingNews() {
  console.log('Importing funding news...');
  const content = fs.readFileSync(path.join(DATA_DIR, 'FundingNews_export (1).csv'), 'utf-8');
  const rows = parseCSV(content);

  const data = rows.map(row => {
    let dateVal = null;
    if (row.date) {
      try {
        // Try parsing "Month Year" format like "September 2025"
        const parsed = new Date(row.date + ' 1');
        if (!isNaN(parsed.getTime())) {
          dateVal = parsed.toISOString().split('T')[0];
        }
      } catch {}
    }
    return {
      title: row.title,
      summary: row.description,
      company_name: row.company_or_fund,
      amount: row.amount,
      round_type: row.stage,
      source_url: row.link,
      date: dateVal,
      created_date: parseDate(row.created_date),
    };
  });

  const { error } = await supabase.from('funding_news').insert(data);
  if (error) console.error('Funding news error:', error.message);
  else console.log(`  Imported ${data.length} funding news`);
}

async function importUpcomingOpportunities() {
  console.log('Importing upcoming opportunities...');
  const content = fs.readFileSync(path.join(DATA_DIR, 'UpcomingOpportunity_export.csv'), 'utf-8');
  const rows = parseCSV(content);

  const data = rows.map(row => ({
    name: row.name || row.title,
    description: row.description,
    opportunity_type: row.category || row.type,
    application_link: row.link || row.application_link,
    prize_amount: row.prize || row.amount,
    created_date: parseDate(row.created_date),
  }));

  const { error } = await supabase.from('upcoming_opportunities').insert(data);
  if (error) console.error('Upcoming opportunities error:', error.message);
  else console.log(`  Imported ${data.length} upcoming opportunities`);
}

async function importEmailSignups() {
  console.log('Importing email signups...');
  const content = fs.readFileSync(path.join(DATA_DIR, 'EmailSignup_export.csv'), 'utf-8');
  const rows = parseCSV(content);

  if (rows.length === 0) {
    console.log('  No email signups to import');
    return;
  }

  const data = rows.map(row => ({
    email: row.email,
    name: row.name,
    subscribed_at: parseDate(row.created_date),
  }));

  const { error } = await supabase.from('email_signups').insert(data);
  if (error) console.error('Email signups error:', error.message);
  else console.log(`  Imported ${data.length} email signups`);
}

async function main() {
  console.log('Starting data import to Supabase...\n');

  try {
    await importCommunities();
    await importStories();
    await importAccelerators();
    await importEvents();
    await importWorkspaces();
    await importFundingOpportunities();
    await importFundingNews();
    await importUpcomingOpportunities();
    await importEmailSignups();

    console.log('\n✅ Data import complete!');
  } catch (error) {
    console.error('Import failed:', error);
  }
}

main();
