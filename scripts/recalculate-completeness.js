#!/usr/bin/env node
/**
 * Recalculates completeness_score for all investors based on field coverage.
 *
 * Scoring: each field contributes a weight to the total score (0-100).
 */

const SUPABASE_URL = "https://fbgxeinarhbrqatrsuoj.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_KEY required"); process.exit(1); }

const DRY_RUN = process.argv.includes("--dry-run");

const FIELD_WEIGHTS = {
  canonical_name:  10,
  website:         5,
  domain:          5,
  description:     15,
  hq_state:        10,
  hq_city:         5,
  investor_type:   10,
  stage_focus:     10,
  sectors:         10,  // non-empty array
  check_size_min:  10,
  check_size_max:  5,
  contact_email:   3,
  linkedin_url:    2,
};
// Total possible = 100

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function fetchAll() {
  const all = [];
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/investors?select=id,canonical_name,website,domain,description,hq_state,hq_city,investor_type,stage_focus,sectors,check_size_min,check_size_max,contact_email,linkedin_url,completeness_score&order=id&offset=${offset}&limit=1000`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < 1000) break;
    offset += 1000;
  }
  return all;
}

function calcScore(inv) {
  let score = 0;
  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    const val = inv[field];
    if (field === "sectors") {
      if (Array.isArray(val) && val.length > 0) score += weight;
    } else if (val !== null && val !== undefined && val !== "") {
      score += weight;
    }
  }
  return score;
}

async function main() {
  console.log(`=== Recalculate Completeness ${DRY_RUN ? "(DRY RUN)" : ""} ===\n`);

  const investors = await fetchAll();
  console.log(`Fetched ${investors.length} investors\n`);

  const updates = [];
  let unchanged = 0;

  for (const inv of investors) {
    const newScore = calcScore(inv);
    const oldScore = inv.completeness_score || 0;

    if (Math.abs(newScore - oldScore) > 0.5) {
      updates.push({ id: inv.id, name: inv.canonical_name, oldScore, newScore });
    } else {
      unchanged++;
    }
  }

  // Stats
  const allScores = investors.map(inv => calcScore(inv));
  const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  const high = allScores.filter(s => s > 70).length;
  const med = allScores.filter(s => s >= 40 && s <= 70).length;
  const low = allScores.filter(s => s < 40).length;

  console.log(`New score distribution:`);
  console.log(`  Average: ${avg.toFixed(1)}`);
  console.log(`  High (>70): ${high}`);
  console.log(`  Medium (40-70): ${med}`);
  console.log(`  Low (<40): ${low}`);
  console.log(`\n  To update: ${updates.length}`);
  console.log(`  Unchanged: ${unchanged}\n`);

  if (DRY_RUN || updates.length === 0) {
    if (DRY_RUN) console.log("Dry run — no changes.\n");
    return;
  }

  // Apply
  let done = 0, errors = 0;
  const BATCH = 25;
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(u => {
        const url = `${SUPABASE_URL}/rest/v1/investors?id=eq.${u.id}`;
        return fetch(url, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ completeness_score: u.newScore }),
        }).then(r => { if (!r.ok) throw new Error(`${r.status}`); });
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") done++;
      else { errors++; console.error(`  ERROR: ${r.reason}`); }
    }
  }

  console.log(`\nDone: ${done} updated, ${errors} errors\n`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
