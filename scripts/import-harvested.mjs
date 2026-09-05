#!/usr/bin/env node
/**
 * Import harvested JSON data into Supabase investor_pipeline table.
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable.
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/import-harvested.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/import-harvested.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BATCH_SIZE = 50;
const dataDir = join(__dirname, '..', 'data', 'harvested');

async function main() {
  console.log('=== Importing harvested data to investor_pipeline ===\n');

  const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No JSON files found in data/harvested/');
    return;
  }

  let totalInserted = 0;
  let totalErrors = 0;

  for (const file of files) {
    const source = file.replace('.json', '');
    const records = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'));
    console.log(`[${source}] ${records.length} records`);

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('investor_pipeline').insert(batch);
      if (error) {
        console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
        totalErrors += batch.length;
      } else {
        totalInserted += batch.length;
      }
    }
  }

  console.log(`\nDone: ${totalInserted} inserted, ${totalErrors} errors`);
}

main().catch(err => { console.error(err); process.exit(1); });
