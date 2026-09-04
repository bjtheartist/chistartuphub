/**
 * Apply the Instance B bulk import migration to Supabase
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/apply-migration.mjs
 *
 * Or paste the SQL chunks manually in the Supabase SQL Editor:
 *   supabase/migrations/chunks/chunk_1.sql through chunk_5.sql
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required');
  console.error('');
  console.error('Option 1: Set the key and run this script:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/apply-migration.mjs');
  console.error('');
  console.error('Option 2: Paste SQL chunks into the Supabase SQL Editor:');
  console.error('  https://supabase.com/dashboard/project/fbgxeinarhbrqatrsuoj/sql/new');
  console.error('  Files: supabase/migrations/chunks/chunk_1.sql through chunk_5.sql');
  process.exit(1);
}

async function runSQL(sql, label) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    // Try the pg endpoint instead
    const pgRes = await fetch(`${SUPABASE_URL}/pg`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!pgRes.ok) {
      console.error(`  ${label} failed:`, await pgRes.text().catch(() => pgRes.status));
      return false;
    }
  }

  console.log(`  ${label} applied successfully`);
  return true;
}

async function main() {
  console.log('Applying Instance B bulk import migration...\n');

  // Read and apply chunks
  const chunksDir = join(__dirname, '..', 'supabase', 'migrations', 'chunks');

  for (let i = 1; i <= 5; i++) {
    const chunkPath = join(chunksDir, `chunk_${i}.sql`);
    try {
      const sql = readFileSync(chunkPath, 'utf-8');
      console.log(`Applying chunk ${i} (${(sql.length / 1024).toFixed(0)} KB)...`);
      const ok = await runSQL(sql, `Chunk ${i}`);
      if (!ok) {
        console.error(`\nChunk ${i} failed. You may need to paste it manually in the SQL Editor.`);
      }
    } catch (err) {
      console.error(`Error reading chunk ${i}:`, err.message);
    }
  }

  // Verify
  console.log('\nVerifying...');
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { count } = await sb.from('funding_opportunities').select('*', { count: 'exact', head: true });
  console.log(`\nTotal funding_opportunities records: ${count}`);
  console.log(`Expected: ~${499 + 29716} (499 existing + 29,716 new)`);
}

main().catch(console.error);
