#!/usr/bin/env node

/**
 * Sector Normalization Script
 *
 * Normalizes investor sector values to lowercase-hyphenated format.
 * Removes non-sector values (demographics, geography, stage descriptors).
 * Uses Supabase REST API with service role key for writes.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/normalize-sectors.js [--dry-run]
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://fbgxeinarhbrqatrsuoj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error(
    "Error: SUPABASE_SERVICE_KEY environment variable is required."
  );
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");

// ── Mapping table ──────────────────────────────────────────────────────────────
// Values that map to null will be removed from the array.

const SECTOR_MAP = {
  // Mixed-case → normalized
  AI: "ai-ml",
  "AI/ML": "ai-ml",
  Accessibility: "accessibility",
  AgriTech: "agtech",
  "All Sectors": null,
  "Automotive Tech": "automotive",
  B2B: "b2b",
  "B2B Platforms": "b2b",
  "B2B SaaS": "saas",
  B2C: "consumer",
  Biotech: "biotech",
  "Chicago suburban startups": null,
  CleanTech: "cleantech",
  "Climate Tech": "climate",
  "Climate tech": "climate",
  "Climate/Energy": "climate",
  Consumer: "consumer",
  "Consumer Tech": "consumer",
  Cybersecurity: "cybersecurity",
  DeepTech: "deeptech",
  Defense: "defense",
  "Digital Health": "healthcare",
  "Digital Media": "media",
  "Disability inclusion": "impact",
  "Diverse Founders": null,
  "E-commerce": "ecommerce",
  "Early-stage": null,
  "Early-stage tech": null,
  EdTech: "edtech",
  Energy: "energy",
  Enterprise: "enterprise",
  FinTech: "fintech",
  "Financial Services": "fintech",
  "Food/AgTech": "foodtech",
  FoodTech: "foodtech",
  "General Tech": "technology",
  GovTech: "govtech",
  Hardtech: "deeptech",
  HealthTech: "healthcare",
  Healthcare: "healthcare",
  Industrial: "industrial",
  "Industrial Tech": "industrial",
  "Industry transformation": null,
  Infrastructure: "infrastructure",
  InsurTech: "insurtech",
  "Latino communities": null,
  "Latino/Latina founders": null,
  "Latinx founders": null,
  "Life Sciences": "biotech",
  "Local Chicago startups": null,
  Logistics: "logistics",
  Manufacturing: "manufacturing",
  Marketplace: "marketplace",
  Marketplaces: "marketplace",
  Medical: "healthcare",
  "Medical Devices": "healthcare",
  "Midwest startups": null,
  "Midwest tech": null,
  Mobility: "mobility",
  "Physical Products": "hardware",
  PropTech: "proptech",
  Robotics: "robotics",
  SaaS: "saas",
  "Scalable business models": null,
  "Scalable services": null,
  "Search Funds": null,
  "Sector-agnostic": null,
  Software: "saas",
  Space: "space",
  Technology: "technology",
  "UIUC-connected startups": null,
  "Underrepresented founders": null,
  "Urban Innovation": "govtech",
  "Urban Tech": "govtech",
  "Women Founders": null,
  "Women-led startups": null,

  // Already normalized — identity mappings
  agtech: "agtech",
  "ai-ml": "ai-ml",
  b2b: "b2b",
  biotech: "biotech",
  blockchain: "blockchain",
  cleantech: "cleantech",
  climate: "climate",
  consumer: "consumer",
  crypto: "crypto",
  cybersecurity: "cybersecurity",
  deeptech: "deeptech",
  defense: "defense",
  edtech: "edtech",
  education: "edtech",
  energy: "energy",
  enterprise: "enterprise",
  financial: "fintech",
  fintech: "fintech",
  foodtech: "foodtech",
  gaming: "gaming",
  healthcare: "healthcare",
  impact: "impact",
  logistics: "logistics",
  manufacturing: "manufacturing",
  marketplace: "marketplace",
  media: "media",
  mobility: "mobility",
  proptech: "proptech",
  "real-estate": "real-estate",
  robotics: "robotics",
  saas: "saas",
  "supply-chain": "supply-chain",
  technology: "technology",
  web3: "web3",
};

// ── Helpers ─────────────────────────────────────────────────────────────────────

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
  });
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function supabasePatch(table, id, body) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    throw new Error(
      `PATCH ${table} id=${id} failed: ${res.status} ${await res.text()}`
    );
  }
}

/**
 * Normalize a single sector value.
 * Returns the mapped value, or null if it should be removed.
 * If the value is not in the map, it is lowercased and spaces replaced with hyphens.
 */
function normalizeSector(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;

  // Exact match in map
  if (trimmed in SECTOR_MAP) {
    return SECTOR_MAP[trimmed];
  }

  // Case-insensitive fallback: check map keys
  const lowerTrimmed = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(SECTOR_MAP)) {
    if (key.toLowerCase() === lowerTrimmed) {
      return value;
    }
  }

  // Unknown sector: convert to lowercase-hyphenated and keep
  console.warn(`  [WARN] Unknown sector "${trimmed}" — auto-normalizing`);
  return lowerTrimmed.replace(/\s+/g, "-");
}

/**
 * Normalize an entire sectors field (handles both array and string formats).
 * Returns a deduplicated, sorted array of normalized sector strings.
 */
function normalizeSectors(sectors) {
  if (!sectors) return [];

  // Handle string format (comma-separated or single value)
  let arr;
  if (typeof sectors === "string") {
    arr = sectors.split(",").map((s) => s.trim());
  } else if (Array.isArray(sectors)) {
    arr = sectors;
  } else {
    console.warn(`  [WARN] Unexpected sectors type: ${typeof sectors}`);
    return [];
  }

  const normalized = [];
  for (const raw of arr) {
    const mapped = normalizeSector(raw);
    if (mapped !== null) {
      normalized.push(mapped);
    }
  }

  // Deduplicate and sort for stable comparison
  return [...new Set(normalized)].sort();
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ── Main ────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Sector Normalization ${DRY_RUN ? "(DRY RUN)" : ""} ===\n`);

  // Fetch all investors (paginated — Supabase default limit is 1000)
  let allInvestors = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const page = await supabaseGet(
      `investors?select=id,canonical_name,sectors&offset=${offset}&limit=${pageSize}`
    );
    allInvestors = allInvestors.concat(page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`Fetched ${allInvestors.length} investor records.\n`);

  const updates = []; // { id, name, oldSectors, newSectors }
  const removedValues = {};
  const unknownValues = new Set();
  let skipped = 0;

  for (const investor of allInvestors) {
    const oldSectors = investor.sectors;

    // Skip null/empty
    if (!oldSectors || (Array.isArray(oldSectors) && oldSectors.length === 0)) {
      skipped++;
      continue;
    }

    const oldArr = Array.isArray(oldSectors)
      ? [...oldSectors].sort()
      : [oldSectors].sort();
    const newArr = normalizeSectors(oldSectors);

    // Track removed values
    const oldSet = new Set(
      Array.isArray(oldSectors) ? oldSectors : [oldSectors]
    );
    for (const raw of oldSet) {
      const trimmed = (raw || "").trim();
      const mapped = normalizeSector(trimmed);
      if (mapped === null && trimmed) {
        removedValues[trimmed] = (removedValues[trimmed] || 0) + 1;
      }
    }

    if (!arraysEqual(oldArr, newArr)) {
      updates.push({
        id: investor.id,
        name: investor.canonical_name || "(unnamed)",
        oldSectors: oldArr,
        newSectors: newArr,
      });
    } else {
      skipped++;
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("─── Changes Summary ───\n");
  console.log(`  Total investors:  ${allInvestors.length}`);
  console.log(`  Unchanged:        ${skipped}`);
  console.log(`  To update:        ${updates.length}`);
  console.log();

  if (Object.keys(removedValues).length > 0) {
    console.log("  Removed non-sector values:");
    for (const [val, count] of Object.entries(removedValues).sort(
      (a, b) => b[1] - a[1]
    )) {
      console.log(`    "${val}" — removed from ${count} investor(s)`);
    }
    console.log();
  }

  // Show first 20 changes as examples
  const preview = updates.slice(0, 20);
  if (preview.length > 0) {
    console.log(
      `  Sample changes (showing ${preview.length} of ${updates.length}):\n`
    );
    for (const u of preview) {
      console.log(`    ${u.name}`);
      console.log(`      old: [${u.oldSectors.join(", ")}]`);
      console.log(`      new: [${u.newSectors.join(", ")}]`);
    }
    console.log();
  }

  if (DRY_RUN) {
    console.log("Dry run — no changes written.\n");
    return;
  }

  // ── Apply updates in batches ──────────────────────────────────────────────
  const BATCH_SIZE = 25;
  let applied = 0;
  let errors = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((u) => supabasePatch("investors", u.id, { sectors: u.newSectors }))
    );

    for (let j = 0; j < results.length; j++) {
      if (results[j].status === "fulfilled") {
        applied++;
      } else {
        errors++;
        console.error(
          `  [ERROR] Failed to update "${batch[j].name}" (${batch[j].id}): ${results[j].reason}`
        );
      }
    }

    // Brief pause between batches to avoid rate limits
    if (i + BATCH_SIZE < updates.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Applied: ${applied}`);
  console.log(`  Errors:  ${errors}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
