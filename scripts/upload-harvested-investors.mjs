/**
 * Upload harvested investor data from local JSON to Supabase staging table.
 *
 * Prerequisites:
 *   1. Run the migration SQL in Supabase SQL Editor:
 *      supabase/migrations/20260309000000_create_investor_enrichment_staging.sql
 *   2. Then run: node scripts/upload-harvested-investors.mjs
 *
 * Or re-run the harvester directly:
 *      node scripts/harvest-github-openvc.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { insertToStaging, supabase } from './harvester-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '..', 'data', 'harvested-investors.json');

async function main() {
  console.log('=== Upload Harvested Investors to Staging ===\n');

  // Check table exists
  const { error } = await supabase.from('investor_enrichment_staging').select('id').limit(0);
  if (error?.code === 'PGRST205') {
    console.error('ERROR: investor_enrichment_staging table does not exist.');
    console.error('Please run the migration SQL first:');
    console.error('  supabase/migrations/20260309000000_create_investor_enrichment_staging.sql');
    process.exit(1);
  }

  // Check JSON file exists
  if (!existsSync(JSON_PATH)) {
    console.error(`ERROR: No harvested data found at ${JSON_PATH}`);
    console.error('Run the harvester first: node scripts/harvest-github-openvc.mjs');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
  console.log(`Found ${data.total_records} records harvested at ${data.harvested_at}`);
  console.log('Sources:', JSON.stringify(data.sources, null, 2));

  // Group by source for proper attribution
  const bySource = { github_awesome_vc: [], openvc: [], crunchbase_open: [] };
  for (const r of data.records) {
    const srcUrl = r.field_sources?.source_url || '';
    if (srcUrl.includes('openvc')) {
      bySource.openvc.push(r);
    } else if (srcUrl.includes('crunchbase')) {
      bySource.crunchbase_open.push(r);
    } else {
      bySource.github_awesome_vc.push(r);
    }
  }

  const results = {};
  for (const [source, records] of Object.entries(bySource)) {
    if (records.length > 0) {
      console.log(`\nUploading ${records.length} records for source: ${source}`);
      results[source] = await insertToStaging(records, source);
    }
  }

  // Summary
  console.log('\n=== UPLOAD SUMMARY ===');
  let totalInserted = 0, totalSkipped = 0, totalErrors = 0;
  for (const [source, stats] of Object.entries(results)) {
    console.log(`  ${source}: ${stats.inserted} inserted, ${stats.skipped} skipped, ${stats.errors} errors`);
    totalInserted += stats.inserted;
    totalSkipped += stats.skipped;
    totalErrors += stats.errors;
  }
  console.log(`\n  TOTAL: ${totalInserted} inserted, ${totalSkipped} skipped, ${totalErrors} errors`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
