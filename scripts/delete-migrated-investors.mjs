#!/usr/bin/env node
/**
 * Delete vc/angel records from funding_opportunities that were already
 * migrated to the investors table.
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing env vars'); process.exit(1); }

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`\nDeleting vc/angel records from funding_opportunities${DRY_RUN ? ' [DRY RUN]' : ''}...\n`);

  // First count how many we're about to delete
  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/funding_opportunities?select=id&or=(opportunity_type.eq.vc,opportunity_type.eq.angel)&limit=1`,
    { headers: { ...headers, Prefer: 'count=exact' } }
  );
  const total = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0');
  console.log(`  Records to delete: ${total.toLocaleString()}`);

  if (DRY_RUN || total === 0) {
    console.log('  Done (no changes).');
    return;
  }

  // Fetch IDs in batches and delete
  let deleted = 0;
  let offset = 0;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/funding_opportunities?select=id&or=(opportunity_type.eq.vc,opportunity_type.eq.angel)&order=id&limit=500&offset=0`,
      { headers }
    );
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;

    const ids = rows.map(r => r.id);
    const idFilter = ids.map(id => `id.eq.${id}`).join(',');

    const delRes = await fetch(
      `${SUPABASE_URL}/rest/v1/funding_opportunities?or=(${idFilter})`,
      { method: 'DELETE', headers }
    );

    if (!delRes.ok) {
      console.error(`  DELETE error: ${delRes.status} ${await delRes.text()}`);
      break;
    }

    deleted += ids.length;
    if (deleted % 5000 === 0 || deleted === ids.length) {
      console.log(`  Deleted: ${deleted.toLocaleString()} / ${total.toLocaleString()}`);
    }
  }

  console.log(`\n  Total deleted: ${deleted.toLocaleString()}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
