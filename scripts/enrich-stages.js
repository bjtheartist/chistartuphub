#!/usr/bin/env node

/**
 * enrich-stages.js
 *
 * Fixes the stage_focus column for all investors in the database.
 * Currently everything is "early" — this script uses local data files,
 * check-size heuristics, and investor-type heuristics to set real values.
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=ey... node scripts/enrich-stages.js
 *   Add --dry-run to preview without writing.
 */

import { readFileSync } from "fs";

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://fbgxeinarhbrqatrsuoj.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTIyNjIsImV4cCI6MjA4MTkyODI2Mn0.k6yRcQ60OONig97VQZ-UJdmC49ijEm7kskP_2qtaW1E";

const DRY_RUN = process.argv.includes("--dry-run");

const VALID_STAGES = new Set([
  "seed",
  "early",
  "growth",
  "multi",
  "late",
]);

// Map our ideal stages to what the DB constraint allows
const STAGE_REMAP = {
  "pre-seed": "seed",
  "series-a": "early",
  "series-b": "late",
  "multi-stage": "multi",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalizeName(n) {
  if (!n) return "";
  return n
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDomain(url) {
  if (!url) return "";
  try {
    let d = url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    return d.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Map a raw stage string (from CSV or JSON) to one of our canonical values.
 */
function canonicalizeStage(raw) {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();

  if (s.includes("pre-seed") || s.includes("pre seed")) return "pre-seed";
  if (s.includes("seed") && !s.includes("series")) return "seed";
  if (s === "early" || s.includes("early stage") || s.includes("early-stage"))
    return "early";
  if (
    s.includes("series a") ||
    s.includes("series-a") ||
    s.includes("start-up")
  )
    return "series-a";
  if (s.includes("series b") || s.includes("series-b")) return "series-b";
  if (
    s.includes("growth") ||
    s.includes("late") ||
    s.includes("expansion") ||
    s.includes("buyout")
  )
    return "growth";
  if (s.includes("venture")) return "early"; // "Early Stage Venture"
  if (s.includes("multi")) return "multi-stage";

  return null;
}

/**
 * Given an array of stage strings, return a single canonical stage_focus.
 */
function resolveStages(stages) {
  if (!stages || stages.length === 0) return null;

  const canonical = [
    ...new Set(stages.map(canonicalizeStage).filter(Boolean)),
  ];
  if (canonical.length === 0) return null;
  if (canonical.length === 1) return canonical[0];
  // Multiple distinct stages → multi-stage
  return "multi-stage";
}

/**
 * Infer stage from check_size_max.
 */
function stageFromCheckSize(min, max) {
  const v = max || min;
  if (!v || v <= 0) return null;
  if (v <= 500_000) return "pre-seed";
  if (v <= 2_000_000) return "seed";
  if (v <= 10_000_000) return "series-a";
  if (v <= 50_000_000) return "series-b";
  return "growth";
}

/**
 * Infer stage from investor_type.
 */
function stageFromType(type) {
  if (!type) return null;
  const t = type.toLowerCase();
  if (t === "angel") return "pre-seed";
  if (t === "accelerator") return "pre-seed";
  if (t === "pe") return "growth";
  if (t === "cvc") return "series-a";
  return null;
}

// ── Parse CSV (minimal, no deps) ────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => (obj[h.trim()] = (vals[i] || "").trim()));
    return obj;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Build Lookup ────────────────────────────────────────────────────────────

function buildStageLookup() {
  const byName = new Map(); // normalizeName → stages[]
  const byDomain = new Map(); // domain → stages[]

  function add(name, domain, stages) {
    if (!stages || stages.length === 0) return;
    const nn = normalizeName(name);
    const dd = extractDomain(domain);
    if (nn) byName.set(nn, stages);
    if (dd) byDomain.set(dd, stages);
  }

  // 1. merged-vc-database.json  (stages is array of strings)
  try {
    const data = JSON.parse(
      readFileSync(
        "/Users/billyndizeye/chistartuphub/tools/investor-enrichment/data/merged-vc-database.json",
        "utf8"
      )
    );
    for (const r of data) {
      if (r.stages && r.stages.length > 0) {
        add(r.name, r.website || r.domain, r.stages);
      }
    }
    console.log(`  merged-vc-database.json: ${data.length} records`);
  } catch (e) {
    console.warn("  WARN: could not read merged-vc-database.json:", e.message);
  }

  // 2. new-firms-to-import.json  (stages is array of strings)
  try {
    const data = JSON.parse(
      readFileSync(
        "/Users/billyndizeye/chistartuphub/tools/investor-enrichment/data/new-firms-to-import.json",
        "utf8"
      )
    );
    for (const r of data) {
      if (r.stages && r.stages.length > 0) {
        add(r.name, r.website || r.domain, r.stages);
      }
    }
    console.log(`  new-firms-to-import.json: ${data.length} records`);
  } catch (e) {
    console.warn(
      "  WARN: could not read new-firms-to-import.json:",
      e.message
    );
  }

  // 3. investor_enrichment.json  (stage is array of strings, nested under enriched_investors)
  try {
    const raw = JSON.parse(
      readFileSync(
        "/Users/billyndizeye/chistartuphub/data/investor_enrichment.json",
        "utf8"
      )
    );
    const data = raw.enriched_investors || raw;
    const arr = Array.isArray(data) ? data : [];
    for (const r of arr) {
      if (r.stage && r.stage.length > 0) {
        add(r.name, r.website, r.stage);
      }
    }
    console.log(`  investor_enrichment.json: ${arr.length} records`);
  } catch (e) {
    console.warn(
      "  WARN: could not read investor_enrichment.json:",
      e.message
    );
  }

  // 4. sec-adv-harvest.json  (stage is array of strings)
  try {
    const data = JSON.parse(
      readFileSync(
        "/Users/billyndizeye/chistartuphub/data/sec-adv-harvest.json",
        "utf8"
      )
    );
    for (const r of data) {
      if (r.stage && r.stage.length > 0) {
        add(r.name, r.website, r.stage);
      }
    }
    console.log(`  sec-adv-harvest.json: ${data.length} records`);
  } catch (e) {
    console.warn("  WARN: could not read sec-adv-harvest.json:", e.message);
  }

  // 5. micro-vc-raw.csv  ("Investment Stage" column, comma-separated stages)
  try {
    const text = readFileSync(
      "/Users/billyndizeye/chistartuphub/tools/investor-enrichment/data/micro-vc-raw.csv",
      "utf8"
    );
    const rows = parseCSV(text);
    for (const r of rows) {
      const rawStages = (r["Investment Stage"] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (rawStages.length > 0) {
        add(r["Firm Name"], r["URL"], rawStages);
      }
    }
    console.log(`  micro-vc-raw.csv: ${rows.length} records`);
  } catch (e) {
    console.warn("  WARN: could not read micro-vc-raw.csv:", e.message);
  }

  return { byName, byDomain };
}

// ── Supabase REST helpers ───────────────────────────────────────────────────

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function fetchAllInvestors() {
  const all = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/investors?select=id,canonical_name,website,domain,stage_focus,check_size_min,check_size_max,investor_type&order=id&offset=${offset}&limit=${limit}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Fetch investors failed: ${res.status} ${await res.text()}`);
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return all;
}

async function updateInvestor(id, stage_focus) {
  const url = `${SUPABASE_URL}/rest/v1/investors?id=eq.${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ stage_focus }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update investor ${id} failed: ${res.status} ${text}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Enrich Stages ===");
  if (DRY_RUN) console.log("(DRY RUN — no database writes)\n");

  console.log("Loading local data files...");
  const { byName, byDomain } = buildStageLookup();
  console.log(
    `\nLookup built: ${byName.size} by-name entries, ${byDomain.size} by-domain entries\n`
  );

  console.log("Fetching all investors from database...");
  const investors = await fetchAllInvestors();
  console.log(`Found ${investors.length} investors\n`);

  const summary = {
    total: investors.length,
    changed: 0,
    unchanged: 0,
    setToNull: 0,
    byNewStage: {},
    byMethod: { local_data: 0, check_size: 0, investor_type: 0, null: 0 },
  };

  const updates = [];

  for (const inv of investors) {
    const nn = normalizeName(inv.canonical_name);
    const dd = inv.domain || extractDomain(inv.website);

    let newStage = null;
    let method = "null";

    // Priority 1: local data match (by domain first, then name)
    const localStages = (dd && byDomain.get(dd)) || byName.get(nn) || null;
    if (localStages) {
      newStage = resolveStages(localStages);
      if (newStage) method = "local_data";
    }

    // Priority 2: check_size heuristic
    if (!newStage) {
      newStage = stageFromCheckSize(inv.check_size_min, inv.check_size_max);
      if (newStage) method = "check_size";
    }

    // Priority 3: investor_type heuristic
    if (!newStage) {
      newStage = stageFromType(inv.investor_type);
      if (newStage) method = "investor_type";
    }

    // Remap to DB-allowed values
    if (newStage && STAGE_REMAP[newStage]) {
      newStage = STAGE_REMAP[newStage];
    }
    // Validate
    if (newStage && !VALID_STAGES.has(newStage)) {
      console.warn(`  WARN: invalid stage "${newStage}" for "${inv.canonical_name}", setting null`);
      newStage = null;
      method = "null";
    }

    // Check if changed
    if (newStage === inv.stage_focus) {
      summary.unchanged++;
      continue;
    }

    updates.push({ id: inv.id, name: inv.canonical_name, oldStage: inv.stage_focus, newStage, method });
    summary.changed++;
    if (!newStage) summary.setToNull++;
    summary.byNewStage[newStage || "null"] =
      (summary.byNewStage[newStage || "null"] || 0) + 1;
    summary.byMethod[method] = (summary.byMethod[method] || 0) + 1;
  }

  console.log(`\nChanges to apply: ${updates.length}`);
  console.log(`Unchanged: ${summary.unchanged}\n`);

  // Show a sample of changes
  const sample = updates.slice(0, 20);
  console.log("Sample changes:");
  for (const u of sample) {
    console.log(
      `  ${u.name}: "${u.oldStage}" → "${u.newStage}" (${u.method})`
    );
  }
  if (updates.length > 20) console.log(`  ... and ${updates.length - 20} more`);

  // Apply updates
  if (!DRY_RUN && updates.length > 0) {
    console.log("\nApplying updates...");
    let done = 0;
    let errors = 0;

    // Process in batches of 20 concurrent
    const BATCH = 20;
    for (let i = 0; i < updates.length; i += BATCH) {
      const batch = updates.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map((u) => updateInvestor(u.id, u.newStage))
      );
      for (const r of results) {
        if (r.status === "fulfilled") done++;
        else {
          errors++;
          console.error(`  ERROR: ${r.reason.message}`);
        }
      }
      if ((i + BATCH) % 100 === 0 || i + BATCH >= updates.length) {
        console.log(`  Progress: ${Math.min(i + BATCH, updates.length)}/${updates.length}`);
      }
    }
    console.log(`\nDone: ${done} updated, ${errors} errors`);
  }

  // Final summary
  console.log("\n=== Summary ===");
  console.log(`Total investors: ${summary.total}`);
  console.log(`Changed: ${summary.changed}`);
  console.log(`Unchanged: ${summary.unchanged}`);
  console.log(`Set to null: ${summary.setToNull}`);
  console.log("\nBy new stage:");
  for (const [stage, count] of Object.entries(summary.byNewStage).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${stage}: ${count}`);
  }
  console.log("\nBy method:");
  for (const [method, count] of Object.entries(summary.byMethod).sort(
    (a, b) => b[1] - a[1]
  )) {
    if (count > 0) console.log(`  ${method}: ${count}`);
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
