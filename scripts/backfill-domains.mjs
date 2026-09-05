#!/usr/bin/env node
/**
 * Backfill domain column from website for investors that have a website but no domain.
 * Skips social media, Wikipedia, and other non-company domains.
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

const EXCLUDED_DOMAINS = new Set([
  'en.wikipedia.org', 'wikipedia.org', 'linkedin.com', 'www.linkedin.com',
  'twitter.com', 'x.com', 'facebook.com', 'www.facebook.com',
  'crunchbase.com', 'www.crunchbase.com', 'pitchbook.com', 'www.pitchbook.com',
  'sec.gov', 'www.sec.gov', 'google.com', 'github.com', 'youtube.com',
  'www.youtube.com', 'bloomberg.com', 'www.bloomberg.com',
  'instagram.com', 'www.instagram.com', 'tiktok.com', 'www.tiktok.com',
]);

function extractDomain(website) {
  if (!website) return null;
  try {
    const url = new URL(website.startsWith('http') ? website : 'https://' + website);
    const domain = url.hostname.replace(/^www\./, '');
    if (EXCLUDED_DOMAINS.has(domain) || EXCLUDED_DOMAINS.has(url.hostname)) return null;
    return domain;
  } catch { return null; }
}

async function main() {
  console.log('\nBackfilling domains for investors with website but no domain...\n');

  let offset = 0;
  let updated = 0;
  let skipped = 0;
  const seenDomains = new Set();

  // First, collect all existing domains to avoid unique constraint violations
  let domainOffset = 0;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?select=domain&domain=not.is.null&limit=1000&offset=${domainOffset}`,
      { headers }
    );
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    rows.forEach(r => { if (r.domain) seenDomains.add(r.domain); });
    domainOffset += 1000;
  }
  console.log(`  Existing domains in DB: ${seenDomains.size}`);

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/investors?select=id,website&domain=is.null&website=not.is.null&limit=500&offset=${offset}`,
      { headers }
    );
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const row of rows) {
      const domain = extractDomain(row.website);
      if (!domain || seenDomains.has(domain)) {
        skipped++;
        continue;
      }

      seenDomains.add(domain);

      const updateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/investors?id=eq.${row.id}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ domain }),
        }
      );

      if (updateRes.ok) {
        updated++;
      } else {
        // Likely unique constraint — skip
        skipped++;
      }
    }

    offset += 500;
    if (offset % 5000 === 0) {
      console.log(`  Progress: ${offset} checked | ${updated} updated | ${skipped} skipped`);
    }
  }

  console.log(`\n  Updated: ${updated.toLocaleString()}`);
  console.log(`  Skipped: ${skipped.toLocaleString()}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
