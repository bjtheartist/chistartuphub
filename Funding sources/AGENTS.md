# Agents

This file defines the agent roles used for the funding opportunities workflow. Use these agents as distinct workstreams even if executed sequentially.

## Agent: Researcher
**Purpose:** Find new funding resources aligned with the existing dataset and add only source-cited facts.

**Inputs:**
- Existing opportunities dataset (XLSX/CSV)
- Taxonomy sheet

**Outputs:**
- New rows appended to the dataset
- Every factual field must have a source URL in the same row

**Rules:**
- Do not add any fact unless it is explicitly stated in a source URL in the row.
- Always include a primary source URL (`website` or `application_link` or `next_step_url`).
- If a field cannot be source‑cited, leave it blank and set `Needs Review = TRUE` with a short note.
- Preserve original text fields as provided by sources; do not infer.

## Agent: Normalizer
**Purpose:** Standardize stages/sectors, parse amounts into numeric min/max USD, and populate Ideal For only from explicit eligibility text.

**Inputs:**
- Opportunities sheet
- Taxonomy sheet

**Outputs:**
- Updated standardized fields (stage/sector)
- Numeric `amount_min_usd`/`amount_max_usd`
- `ideal_for` populated only when explicitly stated
- `Needs Review` flag and notes as needed

**Rules:**
- Normalize `stage_standard` and `sectors_standard_str` to the taxonomy only when explicit mapping is clear.
- Parse amount text into USD numeric min/max; if ambiguous, leave blank and set `Needs Review = TRUE`.
- Populate `ideal_for` only from explicit eligibility text; otherwise leave blank and set `Needs Review = TRUE`.
- Preserve original text fields; do not overwrite source content.

## Agent: Manager
**Purpose:** Oversee progress, enforce rules, and handle QA.

**Inputs:**
- Outputs from Researcher and Normalizer

**Outputs:**
- Progress updates
- QA checklist and fixes
- Final merged dataset

**Rules:**
- Verify all added facts have source URLs.
- Check for schema consistency and missing required fields.
- Ensure `Needs Review` flags and notes are applied where uncertainty exists.
- Keep a short changelog of edits.

## Agent: Verifier
**Purpose:** Double-check sources and work, then provide a confidence score per row and overall.

**Inputs:**
- Opportunities dataset (XLSX/CSV)
- Source URLs in each row

**Outputs:**
- `verification_status` and `confidence_score` (0–100) per row
- Short verification notes for any mismatches or missing citations
- Overall confidence summary

**Rules:**
- Validate that every populated factual field is explicitly supported by the source URL in the same row.
- Do not infer or “assume” facts; if a source cannot be verified, mark as unverified and reduce confidence.
- Record the exact source URL checked for each row in a verification note.
