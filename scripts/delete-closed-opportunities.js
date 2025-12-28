import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file manually
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteClosedOpportunities() {
  console.log('Checking for closed/expired funding opportunities...\n');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Get all opportunities
  const { data: opportunities, error: fetchError } = await supabase
    .from('funding_opportunities')
    .select('id, name, deadline, is_active');

  if (fetchError) {
    console.error('Error fetching opportunities:', fetchError);
    process.exit(1);
  }

  console.log(`Total opportunities in database: ${opportunities.length}\n`);

  // Find closed opportunities (deadline has passed)
  const closedOpportunities = opportunities.filter(opp => {
    if (!opp.deadline) return false;
    const deadline = new Date(opp.deadline);
    deadline.setHours(0, 0, 0, 0);
    return deadline < today;
  });

  // Find inactive opportunities
  const inactiveOpportunities = opportunities.filter(opp => opp.is_active === false);

  // Combine and dedupe
  const toDelete = new Map();

  closedOpportunities.forEach(opp => {
    toDelete.set(opp.id, { ...opp, reason: 'Deadline passed' });
  });

  inactiveOpportunities.forEach(opp => {
    if (!toDelete.has(opp.id)) {
      toDelete.set(opp.id, { ...opp, reason: 'Marked inactive' });
    }
  });

  const deleteList = Array.from(toDelete.values());

  if (deleteList.length === 0) {
    console.log('No closed or expired opportunities found.');
    return;
  }

  console.log(`Found ${deleteList.length} opportunities to delete:\n`);

  deleteList.forEach(opp => {
    const deadlineStr = opp.deadline ? new Date(opp.deadline).toLocaleDateString() : 'N/A';
    console.log(`  - ${opp.name}`);
    console.log(`    Deadline: ${deadlineStr} | Reason: ${opp.reason}`);
  });

  console.log('\nDeleting...\n');

  const idsToDelete = deleteList.map(opp => opp.id);

  const { error: deleteError } = await supabase
    .from('funding_opportunities')
    .delete()
    .in('id', idsToDelete);

  if (deleteError) {
    console.error('Error deleting opportunities:', deleteError);
    process.exit(1);
  }

  console.log(`✅ Successfully deleted ${deleteList.length} closed/expired opportunities.`);

  // Get remaining count
  const { count } = await supabase
    .from('funding_opportunities')
    .select('*', { count: 'exact', head: true });

  console.log(`\nRemaining active opportunities: ${count}`);
}

deleteClosedOpportunities();
