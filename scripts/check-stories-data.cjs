/**
 * Check Stories Data in Supabase
 * Run with: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/check-stories-data.cjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

async function main() {
  console.log('Checking stories data...\n');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=*&limit=5`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });

  if (!response.ok) {
    console.error('Error fetching stories:', await response.text());
    return;
  }

  const stories = await response.json();

  console.log(`Found ${stories.length} sample stories:\n`);

  stories.forEach((story, i) => {
    console.log(`--- Story ${i + 1}: ${story.company_name || 'NO NAME'} ---`);
    console.log('Fields present:');
    Object.keys(story).forEach(key => {
      const value = story[key];
      const hasValue = value !== null && value !== undefined && value !== '';
      console.log(`  ${key}: ${hasValue ? (typeof value === 'string' ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : JSON.stringify(value)) : '(empty)'}`);
    });
    console.log('');
  });

  // Count total
  const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=id`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  const allStories = await countResponse.json();
  console.log(`Total stories in database: ${allStories.length}`);

  // Check which have descriptions
  const withDescResponse = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=id&description=neq.`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });
  const withDesc = await withDescResponse.json();
  console.log(`Stories with description: ${withDesc.length}`);
}

main().catch(console.error);
