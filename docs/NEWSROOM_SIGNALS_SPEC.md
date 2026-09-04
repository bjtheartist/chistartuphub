# Newsroom: an auditable signal system for Chicago startup funding

Status: spec, not built. Companion canvas: "Newsroom" (Desk, Startup signal profile, Investor movement board, Watchlists, Audit trail).

Two principles govern everything below.

1. **No composite scores.** A weight is a judgment, and an argument about a formula replaces an argument about facts. The desk shows dated signals, counts over a stated window, categorical evidence classes, and named rules whose definition and satisfying rows are always visible. Every ranking states its sort key and window on screen.
2. **No single privileged source.** A Form D is the best-attested record in the system, but it only sees Reg D raises, it is indexed by filing address rather than where the team sits, and it is silent between raises. So facts are organized into categories, each category has its own best achievable evidence, and what leads a result is the most recent material event that clears the evidence bar for its own category.

## 1. What it is

An internal, admin-only research desk inside ChiStartup Hub. It continuously collects signals about two kinds of entities, keeps them in an append-only ledger with provenance, raises named flags from explicit rules, assigns tiers from conjunctive criteria, and maintains watchlists as stored queries. Any fact on screen can be traced back to the exact rows, sources, and rule version that produced it on any past date.

- **Investors moving.** Where capital is showing up in Chicago and who is bringing it.
- **Startups building.** Which companies are assembling the pieces of a raise before the raise is public, and which are growing without one.

It replaces the Sunday research package (the newsletter agent's seven stages) with a ledger that runs daily, and it turns the existing admin research tab (deal staging, field verifications, provenance view) into the general case.

## 2. What already exists and is reused

| Existing piece | Role in the new system |
|---|---|
| `deal_staging` + `deal_field_verifications` | Per-field provenance model. Generalized into `signals` and `signal_verifications`. The deal tables stay for the newsletter and become one signal producer. |
| `research_sources` (with `source_type`) | Source registry for every collector, extended with the columns in section 5. Its `reliability_score` is not used for ranking; evidence class replaces it. |
| `form_d_deals`, `deal_participants`, `coinvestment_pairs`, `get_coinvestors()` | The SEC backbone. First-time co-investor pairs are a diff of `coinvestment_pairs` between snapshots. |
| `fetch-sec-edgar` edge function, `scripts/harvest-form-d.mjs`, `scripts/harvest-form-adv.mjs` | Collectors. Wrapped so each run writes a `collector_runs` row and emits signals. |
| `aggregated_events` with `event_type`, `is_marquee` | Source of `event_role` and `demo_day` signals, and of the "where to watch" layer. |
| `investors` / `public_investors` | Investor entity table. Startups get a new `companies` table. |
| `newsletter-agent.mjs` verification stage (two sources or it does not ship) | Becomes the `two_sources` evidence class computed from the ledger. |
| Admin gating (`ADMIN_EMAILS`, `ProtectedRoute`) | The Newsroom lives under `/admin/newsroom`. Nothing new is public until section 9 says so. |

## 3. Categories, signal types, and evidence classes

Every signal belongs to one **category**. The category decides what "material" means and what the best achievable evidence is.

| Category | What is material | Best achievable evidence | May move a tier? |
|---|---|---|---|
| Capital | A priced round, a SAFE round, a grant award, a fund commitment | A filing (Form D, Form C, Form 1-A), a federal or state award record, or two independent sources one of which is the investor itself | Yes |
| Commercial | A partnership, a named customer, a government contract, a channel deal, a marketplace listing | Both parties announcing it, or a contract in a public procurement record | Yes, when two-sided or a public record |
| Traction | Users, downloads, ratings, usage, revenue | Third-party observable (store rank, marketplace listing, review counts, open-source download counts). Company-reported figures are single source however specific | Flags and annotations only. Company-reported numbers never move a tier |
| Team | Hiring by function, key hires, founders going full time, layoffs | Postings on the company's own domain, its ATS board, or a startup job board; a WARN notice; a named hire confirmed by the person's own public page | Yes, as a build signal |
| Product and programs | Patents, trademarks, FDA clearances, FCC authorizations, app store launches, accelerator cohorts, demo days, hub membership | A government or platform record, or a program's published roster | Yes, when filing class or program-published |

Chicago presence is not a category and not a signal stream. It is an entity attribute with its own evidence (section 6), set during entity resolution from SOS records, hub rosters, and Chicago-located postings. Office openings, leases, and moves are not tracked.

**Signal types** (closed enum; adding one is a migration):

Investor: `form_d_participation`, `fund_formation`, `form_adv_update`, `first_chicago_check`, `new_coinvestor_pair`, `partner_move`, `public_statement`, `event_role`, `portfolio_listing`.

Company, by category:
- Capital: `form_d_raise`, `reg_cf_offering`, `reg_a_offering`, `grant_award`, `raise_announced` (value carries the announcing party and platform: company or investor, on LinkedIn, X, own site, or wire), `investor_attested_raise`
- Commercial: `partnership`, `named_customer`, `gov_contract`, `marketplace_listing`
- Traction: `store_rank`, `review_count`, `oss_activity`, `metric_reported`
- Team: `job_posting` (value carries function, seniority, location, and board), `key_hire`, `warn_notice`
- Product and programs: `patent_grant`, `trademark_filing`, `fda_clearance`, `fcc_authorization`, `product_launch`, `demo_day`, `hub_membership`, `press`

Social announcements deserve their own note because LinkedIn and X are where most Chicago raises are first said out loud, often before any filing. A post by the investor's official account is `investor_attested`. A post by the company's official account is `single_source`. When both post about the same raise, the pair is `two_sources` with both parties among the sources, which is the two-sided confirmation the capital bar asks for. The row stores the post URL, the account handle, the post timestamp as `observed_at`, and the post text as the quote. Section 5 describes the intake paths, which are not scraping.

**Evidence class** is the only quality attribute, categorical, computed from the ledger, never typed by hand:

| Class | Definition |
|---|---|
| `filing` | The row's source is a government or regulator record (SEC, IL SOS, City of Chicago, USPTO, FDA, FCC, USAspending, SBIR). |
| `two_sources` | The same fact (same entity, type, normalized value, date) has rows from two sources with different `research_sources.id` and different domains, neither a wire republication of the other. A commercial fact is two-sided when both parties are among the sources. |
| `investor_attested` | The fact appears on the investor's own site or announcement. Sits between single source and two sources: it moves a capital tier only when paired with one more independent source. |
| `single_source` | One non-government source. |
| `inferred` | Produced by an LLM or heuristic extractor and not yet matched by another row. |

Separately, `verified` is true when a human has a `confirmed` row in `signal_verifications`. Verification never changes the evidence class; it is shown beside it.

There are no numeric weights, tiers of sources, or confidences. An extractor records what it observed as text.

## 4. Data model

All new tables are append-only except `companies` and `watchlists`, which hold current state and are versioned through history tables.

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  domain TEXT,
  il_sos_file_number TEXT,
  sec_cik TEXT,
  sam_uei TEXT,                    -- federal award identifier (USAspending, SBIR)
  linkedin_slug TEXT,              -- official company page, for attributing announcements
  x_handle TEXT,                   -- official account, for attributing announcements
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chicago presence is an entity attribute with evidence, not a signal category.
-- Append-only so a change of presence is itself dated and sourced.
CREATE TABLE entity_presence (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('investor','company')),
  entity_id UUID NOT NULL,
  presence TEXT NOT NULL CHECK (presence IN ('established','indicated','none')),
  basis TEXT NOT NULL,             -- 'il_sos_formation','il_sos_foreign_qualification','hub_roster','chicago_postings','chicago_event','human'
  source_url TEXT,
  determined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  determined_by TEXT NOT NULL      -- collector slug or user id
);
CREATE INDEX entity_presence_idx ON entity_presence (entity_type, entity_id, determined_at DESC);
CREATE UNIQUE INDEX companies_domain_idx ON companies (lower(domain)) WHERE domain IS NOT NULL;

CREATE TABLE entity_aliases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('investor','company')),
  entity_id UUID NOT NULL,
  alias TEXT NOT NULL,
  match_method TEXT NOT NULL,      -- 'exact','cik','domain','sos_file_number','uei','linkedin_slug','x_handle','human'
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (entity_type, lower(alias))
);

CREATE TABLE collector_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  collector TEXT NOT NULL,
  collector_version TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','partial','error')),
  items_seen INT DEFAULT 0, signals_written INT DEFAULT 0,
  error TEXT,
  request_log JSONB
);

CREATE TABLE signals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('investor','company')),
  entity_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('capital','commercial','traction','team','product_programs')),
  signal_type TEXT NOT NULL,       -- closed enum from section 3
  observed_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  value JSONB NOT NULL,
  value_normalized TEXT NOT NULL,
  counterparty_type TEXT CHECK (counterparty_type IN ('investor','company','agency','platform')),
  counterparty_id UUID,            -- the other side of a relational fact (investor on a raise, partner on a deal)
  source_id UUID NOT NULL REFERENCES research_sources(id),
  source_url TEXT NOT NULL,
  source_quote TEXT,
  attested_by TEXT CHECK (attested_by IN ('government','platform','investor','company','third_party','counterparty')),
  raw_payload_sha256 TEXT NOT NULL,
  raw_payload_path TEXT,
  extractor TEXT NOT NULL,
  extractor_notes TEXT,
  collector_run_id BIGINT NOT NULL REFERENCES collector_runs(id),
  dedup_key TEXT NOT NULL,         -- sha256(entity_id|signal_type|value_normalized|observed_at::date)
  supersedes_id BIGINT REFERENCES signals(id),
  UNIQUE (dedup_key, source_url)
);
CREATE INDEX signals_entity_idx ON signals (entity_type, entity_id, observed_at DESC);
CREATE INDEX signals_type_time_idx ON signals (signal_type, observed_at DESC);
CREATE INDEX signals_category_idx ON signals (entity_type, entity_id, category, observed_at DESC);
CREATE INDEX signals_dedup_idx ON signals (dedup_key);

CREATE VIEW signal_evidence AS
SELECT s.id AS signal_id,
  CASE
    WHEN s.attested_by IN ('government') THEN 'filing'
    WHEN EXISTS (
      SELECT 1 FROM signals o JOIN research_sources ors ON ors.id = o.source_id
      WHERE o.dedup_key = s.dedup_key AND o.id <> s.id
        AND o.source_id <> s.source_id
        AND ors.source_type <> 'wire' AND rs.source_type <> 'wire'
    ) THEN 'two_sources'
    WHEN s.attested_by = 'investor' THEN 'investor_attested'
    WHEN s.extractor LIKE 'llm:%' OR s.extractor LIKE 'heuristic:%' THEN 'inferred'
    ELSE 'single_source'
  END AS evidence_class,
  EXISTS (SELECT 1 FROM signal_verifications v WHERE v.signal_id = s.id AND v.decision = 'confirmed') AS verified
FROM signals s JOIN research_sources rs ON rs.id = s.source_id;

CREATE TABLE signal_verifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  signal_id BIGINT NOT NULL REFERENCES signals(id),
  verifier_id UUID NOT NULL REFERENCES auth.users(id),
  decision TEXT NOT NULL CHECK (decision IN ('confirmed','rejected','needs_more')),
  note TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signature_sha256 TEXT NOT NULL
);

CREATE TABLE rule_versions (
  version INT PRIMARY KEY,
  rules JSONB NOT NULL,            -- flags, tier criteria, presence rule (section 6)
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  note TEXT
);

CREATE TABLE entity_snapshots (
  as_of DATE NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  rule_version INT NOT NULL REFERENCES rule_versions(version),
  counts JSONB NOT NULL,           -- per window: by evidence class, by category, distinct types
  last_material_at TIMESTAMPTZ,    -- newest row that clears its category's evidence bar
  last_material_signal_id BIGINT,
  chicago_presence TEXT NOT NULL CHECK (chicago_presence IN ('established','indicated','none')),
  tier SMALLINT,                   -- companies only; NULL for investors until section 6 investor ladder exists
  modifiers TEXT[] NOT NULL DEFAULT '{}',
  flags JSONB NOT NULL,            -- [{rule, satisfied_by: [signal ids]}]
  PRIMARY KEY (as_of, entity_type, entity_id)
);

-- Tier changes are events with their cause rows.
CREATE TABLE tier_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_id UUID NOT NULL,
  as_of DATE NOT NULL,
  from_tier SMALLINT, to_tier SMALLINT NOT NULL,
  rule_version INT NOT NULL REFERENCES rule_versions(version),
  criteria JSONB NOT NULL          -- [{criterion, satisfied, signal_ids}]
);

CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  predicate JSONB NOT NULL,
  sort_key TEXT NOT NULL,
  window_days INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE watchlist_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  watchlist_id UUID NOT NULL REFERENCES watchlists(id),
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL,
  change TEXT NOT NULL CHECK (change IN ('entered','left')),
  as_of DATE NOT NULL,
  cause_signal_ids BIGINT[]
);
```

`research_sources` gains: `category TEXT[]`, `evidence_ceiling TEXT` (the best class rows from this source can reach), `access_method TEXT` ('api','bulk','crawl','rss'), `terms_posture TEXT`, `coverage_bias TEXT` (a sentence on who this source systematically misses), `is_active BOOLEAN`.

RLS: service role for writes; SELECT for authenticated admins via `is_admin()` in SQL. Raw payloads in a private bucket `newsroom-raw`.

## 5. Source registry, by category

Each source is one `research_sources` row and one collector under `scripts/newsroom/`. Each run opens a `collector_runs` row, fetches, extracts, resolves entities, writes signals idempotently by `dedup_key`, and closes with counts. A run that writes zero signals three times in a row raises an alert regardless of HTTP 200.

"Ceiling" is the best evidence class a row from that source can reach on its own. "Moves" says what the row is allowed to affect. "Misses" is the coverage bias, shown on the Desk next to the source so nobody mistakes a gap in our coverage for a gap in the world.

### Capital

| Source | Signals | Access | Cadence | Ceiling | Moves | Misses |
|---|---|---|---|---|---|---|
| SEC EDGAR Form D | `form_d_raise`, `form_d_participation`, `fund_formation` | Daily index + full text, free | 6h | filing | tier | SAFE rounds and any raise not relying on Reg D; issuer address is not location |
| SEC EDGAR Form C, Form 1-A | `reg_cf_offering`, `reg_a_offering` | Daily index, free | daily | filing | tier | Companies that never crowdfund (most) |
| SEC IAPD Form ADV bulk | `form_adv_update` | Bulk CSV, free | monthly | filing | flag | Exempt reporting advisers file less |
| SBIR.gov awards API | `grant_award` (federal R&D) | JSON API, free, terms permissive | weekly | filing | tier | Non-deep-tech companies |
| USAspending.gov awards API | `grant_award` (other federal grants) | JSON API, free | weekly | filing | tier | State and private grants |
| Illinois DCEO and Chicago program award pages | `grant_award` | crawl | weekly | filing (government page) | tier | Programs that do not publish awardees |
| Investor portfolio pages (every investor marked Midwest or with an Illinois participation on record) | `portfolio_listing` (investor side), `investor_attested_raise` (company side) | crawl of a few hundred pages, diffed | weekly | investor_attested | tier when paired with one independent source; otherwise the undisclosed-raise flag | Funds without a portfolio page; angels |
| X (formerly Twitter) official accounts of tracked investors and companies, plus a keyword rule for "raised", "led our", "excited to announce" scoped to Chicago | `raise_announced`, `portfolio_listing`, `public_statement` | X API, pay-per-use (as of February 2026 the only option for new developers): $0.005 per post read, credits bought upfront, capped at 2 million reads a month. A followed list of about 300 accounts producing 500 to 1,500 posts a day is roughly $75 to $225 a month; keyword search reads add to that. No scraping. | polling every 15 minutes | investor_attested when the investor's account posts; single_source when the company's account posts; two_sources when both do | tier when two-sided or paired with one independent source; otherwise the undisclosed-raise flag | Founders and funds not active on X; deleted posts (the stored quote and hash survive) |
| LinkedIn posts by tracked investors and companies, discovered through search engines | `raise_announced`, `key_hire`, `partner_move`, `public_statement` | LinkedIn is never crawled and no LinkedIn account is automated. Public posts are indexed by search engines, so discovery runs through the Brave Search API (about $5 per 1,000 queries): one query per tracked entity per day scoped to `site:linkedin.com/posts`, plus a handful of Chicago raise-language queries. Roughly 300 entities is about $45 a month. Each hit yields the post URL and the engine's snippet. The clipper then fetches that single public URL once for the full text and hash; if the page refuses an unauthenticated fetch, the snippet is stored as the quote and the row is marked snippet-only. A person can also paste a URL directly. | daily discovery; clips as found | same rules as X; a snippet-only row is single_source until a person clips the full post or a second source matches | same rules as X | Posts search engines have not indexed yet (typically a day or two of lag), posts from private profiles, and anything the engine ranks below the first page |
| Assisted browsing session on LinkedIn and X (Billy logged in as himself and present, Claude in Chrome driving) | `raise_announced`, `key_hire`, `partner_move`, `public_statement`, `portfolio_listing` | A person opens the session, the assistant runs a fixed list of content searches at human pace (Chicago plus raise language, past week, sorted by date; one search per tracked entity that posted recently), reads the results as displayed, and clips relevant posts into the ledger with URL, author, timestamp, and text. No unattended runs, no second account, no bulk export, no CAPTCHA handling, a few dozen queries per sitting. Piloted 2026-09-04: LinkedIn worked and surfaced a Series C within the first three results; X requires being signed in. | a daily 10 to 15 minute sitting | same rules as X: investor_attested, single_source, or two_sources by who posted | same rules as X | Sittings that get skipped; posts outside the search terms; this is a person's attention, not a feed |
| LinkedIn notification emails to a desk account | same as above | A desk LinkedIn account follows every tracked investor and company with email notifications on. LinkedIn then sends "X posted" and weekly digest emails to that inbox; the Gmail connector already in this workspace reads them. This is reading our own mail, not automating LinkedIn. | as received | same rules as X | same rules as X | LinkedIn decides which posts make it into notification email; treat it as a supplement to search discovery, not a feed |
| Founder and investor self-report | `raise_announced`, `partnership`, `key_hire` | A short "tell the desk" form on chistartuphub with a URL field. Rows are company- or investor-attested per who submits, and never more than single source until matched. | as submitted | single_source or investor_attested | flag until matched | Everyone who does not know the form exists |
| Company "backed by" pages and press releases on the company domain | `raise_announced` | crawl | weekly | single_source | flag | Companies that do not announce |
| Press and wires (Crain's, Chicago Inno, TechCrunch, PRNewswire, BusinessWire; the existing Perplexity daily search) | `raise_announced`, `press` | rss + LLM extraction | 2h | single_source, two_sources when independently matched | tier only at two_sources | Companies that do not court press; media attention bias |

Matching rule for announcements: an X or LinkedIn row and a press or filing row about the same raise share a `dedup_key` when the normalized value (company, round label, amount if stated, date within 7 days) agrees, so the evidence view promotes the pair to `two_sources` automatically. A social post alone never moves a tier.

### Commercial

| Source | Signals | Access | Cadence | Ceiling | Moves | Misses |
|---|---|---|---|---|---|---|
| City of Chicago data portal, contracts and payments datasets | `gov_contract` | Socrata API, free | weekly | filing | tier | Companies not selling to the city |
| USAspending.gov contracts | `gov_contract` | JSON API, free | weekly | filing | tier | Subcontractors |
| Illinois procurement bulletin (BidBuy) | `gov_contract` | crawl | weekly | filing | tier | Small awards below posting threshold |
| Wires and both parties' newsrooms | `partnership`, `named_customer` | rss + crawl of the counterparty's newsroom to look for the matching announcement | 2h | two_sources when both parties publish; single_source otherwise | tier only when two-sided | Quiet partnerships; large partners that never announce small ones |
| Marketplace listings (AWS Marketplace, Salesforce AppExchange, Shopify App Store, Chrome Web Store, Microsoft AppSource) | `marketplace_listing` | public listing pages, some with JSON | weekly | two_sources (platform-hosted, company-published) | tier as a commercial build signal | Companies outside those ecosystems |

### Traction

| Source | Signals | Access | Cadence | Ceiling | Moves | Misses |
|---|---|---|---|---|---|---|
| Apple App Store and Google Play public pages | `store_rank`, `review_count`, `product_launch` | public pages | daily for tracked apps | two_sources (platform-observed) | flag | Non-app companies |
| G2, Capterra public profiles | `review_count` | public pages | weekly | single_source (platform, but reviews are solicitable) | flag | Consumer and hardware companies |
| GitHub, npm, PyPI public stats for open-source companies | `oss_activity` | APIs, free | weekly | two_sources (platform-observed) | flag | Closed-source companies |
| Product Hunt | `product_launch` | public pages | daily | single_source | flag | Most B2B companies |
| Company-reported metrics in press, decks, or their own site | `metric_reported` | LLM extraction | as found | single_source, marked "company reported" | annotation only, never a tier, never a sort key | Everything; this is the most gameable input in the system |

Excluded on purpose: paid traffic panels (Similarweb and similar) until there is a budget and a terms review. LinkedIn is never crawled; it enters only through the intake path in the Capital table.

### Team

| Source | Signals | Access | Cadence | Ceiling | Moves | Misses |
|---|---|---|---|---|---|---|
| ATS public boards (Greenhouse, Lever, Ashby, Workable) | `job_posting` with function, seniority, location | vendor JSON endpoints, permitted | daily | two_sources (platform-hosted, company-published) | tier as a build signal | Companies hiring through a founder's network only |
| Careers pages on the company's own domain | `job_posting` | crawl and diff | daily | single_source (company) | tier as a build signal, counted the same as ATS rows so companies without an ATS are not penalized | Companies that never post |
| Built In Chicago | `job_posting`, `key_hire` (from its company news posts) | crawl of public listings, robots and rate limits respected; terms reviewed before phase 2 | daily | two_sources (platform-hosted, company-published) | tier as a build signal | Companies that do not pay for a Built In profile; skews to funded companies |
| Wellfound (formerly AngelList Talent), Y Combinator Work at a Startup, Otta | `job_posting` | public listing pages, crawl with the same posture; Wellfound has anti-automation terms, so it is on a per-source kill switch and may end up intake-only | daily | two_sources | tier as a build signal | Companies not on startup-specific boards; YC's board only lists YC companies |
| Hub and accelerator job boards (1871, mHUB, MATTER, Techstars Chicago, gener8tor) | `job_posting` | crawl | daily | two_sources | tier as a build signal | Companies outside those programs |

A posting that appears on more than one board is one fact: the rows share a `dedup_key` on company, normalized title, and posting week, so a company that syndicates to five boards does not get five build signals.
| Illinois WARN notices (DCEO) | `warn_notice` | public list | weekly | filing | flag ("contraction") | Layoffs below WARN thresholds |
| Press and both-party announcements | `key_hire`, `partner_move` | rss + LLM extraction | 2h | single_source; two_sources when the person's own public page confirms | flag | Hires that are not announced |

### Presence inputs (entity attribute, not a category)

These collectors do not emit ledger signals. They write `entity_presence` rows and resolution identifiers.

| Source | Writes | Access | Cadence | Basis recorded | Misses |
|---|---|---|---|---|---|
| Illinois SOS business entity search | presence established; `il_sos_file_number` | polite crawl, 1 request per 2s, named user agent | daily for new formations and foreign qualifications; weekly refresh of tracked file numbers | `il_sos_formation` or `il_sos_foreign_qualification` | Delaware companies that never foreign-qualify |
| Hub rosters (from the Product and programs collectors) | presence established | derived from `hub_membership` rows | weekly | `hub_roster` | Companies outside hubs |
| Chicago-located job postings (from the Team collectors) | presence indicated | derived | daily | `chicago_postings` | Remote-first companies |
| Chicago event roles and demo days (from the events table) | presence indicated | derived | per sync | `chicago_event` | Companies that do not present |
| Human | any | the Newsroom's entity editor, with a note and URL | as needed | `human` | none, but it is recorded who said so |

### Product and programs

| Source | Signals | Access | Cadence | Ceiling | Moves | Misses |
|---|---|---|---|---|---|---|
| Hub and accelerator rosters (1871, mHUB, MATTER, The Hatchery, 2112, Polsky, Techstars Chicago, gener8tor) | `hub_membership`, `demo_day` | crawl of public member and cohort pages | weekly | two_sources (program-published about the company) | tier as a build signal | Companies outside programs |
| Events (`aggregated_events`) | `event_role`, `demo_day` | read from the events table after each sync | per sync | two_sources (organizer-published) | build signal; where-to-watch | Events we do not aggregate |

| Source | Signals | Access | Cadence | Ceiling | Moves | Misses |
|---|---|---|---|---|---|---|
| USPTO PatentsView and TSDR | `patent_grant`, `trademark_filing` | APIs, free | weekly | filing | tier as a build signal | Companies that do not file |
| openFDA (510(k), De Novo, PMA) | `fda_clearance` | API, free | weekly | filing | tier | Non-medical companies; this matters because of the health cluster and the Venture Summit theme |
| FCC equipment authorization | `fcc_authorization` | public search | monthly | filing | tier as a build signal | Software companies |
| App store launch (from Traction collectors) | `product_launch` | derived | daily | inherits | build signal | Non-app products |

Entity resolution order: CIK, UEI, IL SOS file number, domain, official LinkedIn slug or X handle, exact normalized name. Anything that would need fuzzy matching goes to a human review queue. Every match writes an `entity_aliases` row.

Scraping posture across all crawl sources: public pages only, no login walls, per-host rate limits recorded in `request_log`, robots.txt respected, a named user agent with a contact address, no personal data beyond names already in public records, and a per-source kill switch (`is_active`) whose history stays.

## 6. Rules: presence, flags, and tiers

All rules live in `rule_versions.rules` with a plain-English `definition_text` shown verbatim wherever the rule's result appears, along with the ids of the satisfying rows.

### Chicago presence

Presence is an entity attribute with its own evidence row (`entity_presence`), independent of any filing address, and independent of the signal categories.

- **Established**: an Illinois SOS formation or foreign qualification on the file number, a hub or accelerator roster listing, or a human determination with a URL.
- **Indicated**: two or more of: Chicago-located `job_posting` rows in 90 days, an `event_role` or `demo_day` at a Chicago event, a Chicago address on a Form D that is not a registered agent or law firm address.
- **None**: otherwise. Entities with presence "none" stay in the ledger but never appear on the Desk or in watchlists.

### Flags

A flag is a named rule that is satisfied or not for an entity on a date. Starter set:

| Rule | Entity | Definition (shown on screen) |
|---|---|---|
| First Illinois filing on record | investor | Appears on an Illinois issuer's Form D with no earlier Illinois participation in the ledger. |
| First co-investment with a Chicago fund | investor | A `new_coinvestor_pair` row where the counterparty is headquartered in Chicago. |
| Fund formed | investor | A `fund_formation` filing in the last 180 days. |
| Quiet fund | investor | Three or more Form D participations in the prior 12 months and none in the last 180 days. |
| Raise likely, undisclosed | company | No `form_d_raise` on record, and either an `investor_attested_raise` row, or two build signals plus a `key_hire` with a board or executive title inside 60 days. |
| Hiring before raise | company | Three or more `job_posting` rows tagged engineering in 30 days and no capital row that clears its evidence bar. |
| Public money in | company | A `grant_award` or `gov_contract` filing in the last 12 months. |
| Two-sided deal | company | A `partnership` or `named_customer` row at two_sources where both parties are sources. |
| Cohort member | company | A `demo_day` or `hub_membership` row in the last 90 days. |
| Contraction | company | A `warn_notice` in the last 180 days. |
| Quiet since raise | company | A capital row older than 120 days and no signal of any category since. |

### Company tiers

Six rules make a tier defensible without a score:

1. **Conjunctive gates.** Every criterion in a tier must hold; no criterion compensates for another.
2. **Nested.** Tier N includes every criterion of Tier N minus 1 plus at least one more. Tiers are ordinal, never arithmetic.
3. **Evidence-gated.** A criterion counts only when its supporting row is `filing`, `two_sources`, `verified`, or `investor_attested` paired with one independent source. Single-source and inferred rows raise flags but never move tiers.
4. **Facts, windows, sources.** Each criterion is a count or date over a stated window with rows attached. The tier's "why" is a checklist with ticks and row ids.
5. **Movement only on new rows.** No decay. Staleness is a modifier stamped next to the tier, not a demotion.
6. **Ordering inside a tier is lexicographic on declared keys** shown in the caption: most recent material row, then distinct signal types in 90 days, then name.

| Tier | Name | Entry criteria (all must hold) |
|---|---|---|
| 0 | Observed | At least one signal of any class and presence at least "indicated". |
| 1 | Established | Presence "established". Plus one build signal (team, commercial, or product and programs category) in 180 days that clears its evidence bar. |
| 2 | Building | Tier 1, plus two or more distinct build signal types in 90 days across at least two categories, each clearing its evidence bar. |
| 3 | Capitalized | Tier 1, plus a capital row in the last 24 months that clears its bar: a Form D, Form C, Form 1-A, a grant or contract filing, or an investor-attested raise paired with one independent source. |
| 4 | Scaling | Tier 3, plus a second capital row at least six months after the first (or a larger amount sold on an amended Form D), plus three or more engineering `job_posting` rows in 90 days. |

Modifiers, stamped not scored: **quiet** (no signal of any category in 120 days), **corroborated** (a capital row matched in press within 30 days), **cohort** (demo day or hub roster in 90 days), **public money** (grant or contract filing in 12 months), **contraction** (WARN notice in 180 days), **undisclosed raise likely** (the flag above).

The "who to watch" list falls out without a score: Tier 2, not Tier 3, sorted by most recent material row. Hard evidence of building, no raise on record.

### What leads a result

For any entity, the headline fact is the newest row that clears its category's evidence bar. The line under it names the category, the evidence class, the date, and the source. If no row clears any bar, the headline says "no evidence-gated activity on record" and the strongest single-source or inferred row appears below a labeled fold. Company-reported metrics never lead and never sort.

### Proving the methodology

- **Backtest on the ledger**: replay the rules as of past dates and measure what share of companies that later produced a capital filing were Tier 2 in the prior 12 months, and what share of Tier 2 never did. This evaluates the ladder, not the companies, and anyone with the ledger can reproduce it.
- **Bias review**: nothing in the ladder depends on press volume, founder identity, or network proximity. ATS rows and careers-page rows count the same. Every source's "misses" column is shown on the Desk.
- **Tier changes are events** in `tier_history` with cause rows, so the Audit screen can show why a company moved on a given day as a checklist diff.

## 7. Watchlists, who and where

A watchlist is a stored predicate over snapshots and signals, rendered in plain English with its sort key and window shown. Starter set:

- **Building, not yet capitalized**: tier = 2. Sort: most recent material row.
- **Raise likely, undisclosed**: the flag. Sort: date of the investor-attested row.
- **Public money in**: the flag. Sort: award date.
- **Out-of-state firms newly active in Chicago**: "First Illinois filing on record" in 90 days. Sort: last filing.
- **First-time pairs**: `new_coinvestor_pair` in 30 days. Sort: observed date.
- **Demo day cohorts, next 30 days**: future `demo_day` joined to `aggregated_events`. Sort: event date.
- **Quiet funds** and **Quiet since raise**: the flags. Sort: date of last activity.

"Where to watch" is the join to events: for each marquee or demo-day event, the tracked investors and companies attached to it by `event_role` and `demo_day` rows.

Membership changes go to `watchlist_history`, so the Desk's "entered this week" and the weekly newsletter read from the same table.

## 8. Auditability, concretely

1. Provenance on every row: source, URL, quote, payload hash, stored raw document, extractor identity, run id, who attested it.
2. Append-only ledger; corrections use `supersedes_id`.
3. Human decisions are rows with a chained signature hash.
4. Versioned rules; the Audit screen shows a date-to-date diff as rows added, rows superseded, flags raised, flags cleared, and tier changes with their checklists.
5. Evidence class and presence are views over the ledger, recomputed on read.
6. Daily snapshots for point-in-time answers.
7. Collector run log with request-level detail, plus each source's stated coverage gap.
8. Nightly reproducibility test: recompute yesterday's snapshot from the ledger and fail loudly on drift.

## 9. The Newsroom UI (internal, `/admin/newsroom`)

1. **Desk**: signal feed with category and evidence class chips, verified marks, verify actions; "New this week" for investors and startups sorted by date; stat tiles; collector health strip with each source's "misses" note.
2. **Startup signal profile**: headline fact per section 6, tier badge with checklist drawer, modifiers, signal density strip by evidence class, flags with definitions and row ids, "what would raise a flag or the tier", timeline grouped by category with provenance drawers, related investors and counterparties.
3. **Investor movement board**: filings in 90 days, last filing, first Illinois filing, new co-investor pairs, portfolio listings added, next event role, evidence class of newest row; caption with sort and window; weekly Form D count chart; first-time pairs panel.
4. **Watchlists**: cards with plain-English predicates, sort key and window, member tables of counts, dates, tier, and evidence class.
5. **Audit trail**: as-of date picker, rules and tier criteria in effect, row, flag, and tier diff between two dates, verification log.

Public later, only after human verification: a "Recent activity" strip on investor profiles from verified `form_d_participation`, `portfolio_listing`, and `event_role` rows with source links. Company-side rows stay internal.

## 10. Phases

**Phase 1 (2 weeks): ledger, presence, and filings.** Tables, RLS, bucket, evidence view, `entity_presence`, collectors: SEC Form D, Form C and 1-A, IL SOS, SBIR, USAspending, hub rosters, `derived`. Tiers 0 to 3 with filing-class criteria only. The Desk feed and health strip. Success: every Chicago-presence company with a capital filing in 24 months is in the ledger with provenance, presence is recorded with its basis, and the reproducibility test passes.

**Phase 2 (2 weeks): building signals.** ATS and careers-page collectors, Built In Chicago and the other startup boards (terms reviewed first), marketplace listings, USPTO, openFDA, WARN, events. Tier 2 becomes reachable. The Startup signal profile with tier checklist. Success: "Building, not yet capitalized" produces a list you would actually call.

**Phase 3 (2 weeks): announcements and two-sided facts.** X API stream over the followed list, the LinkedIn clipper and daily desk routine, investor portfolio page diffs, counterparty newsroom matching for partnerships, Chicago and Illinois procurement, Form ADV. The undisclosed-raise flag goes live. Investor movement board and Watchlists screens.

**Phase 4 (1 week): traction, press, audit.** App store, G2, open-source stats, press and wire extraction with prompt versioning, company-reported metrics as annotations. Audit trail screen, signed verifications, nightly recompute, newsletter agent rewritten to draft from `watchlist_history` and verified rows.

## 11. Costs and risks

- Compute: government APIs and vendor boards are free and fit in GitHub Actions minutes; press LLM extraction is roughly 200 to 400 documents a day at cents each.
- Storage: raw payloads, roughly 100 MB a month once all collectors run.
- Legal: SEC, SOS, city and state procurement, USPTO, FDA, FCC, SBIR, USAspending, and WARN data are public records. ATS vendor endpoints are permitted. Careers pages, hub rosters, portfolio pages, marketplace listings, store pages, and Built In listings are ordinary crawling under the stated posture; Wellfound sits behind a kill switch pending its terms. X is read through its paid API, never scraped. LinkedIn is never crawled; posts enter by a person pasting a URL, which is fetched once. Paid traffic panels are excluded. Press is fetched for extraction, not republished.
- Cost: the X API Basic tier is a recurring monthly charge and the one paid data source in the system; it should be budgeted before phase 3.
- Entity resolution is the biggest technical risk. No fuzzy auto-merge; ambiguous matches wait in a review queue. Aliases are logged and reversible.
- Rule design is where bias can re-enter. Mitigation: definitions shown verbatim, versioned authorship, replay of any date under any version, the backtest, and every source's coverage gap shown beside its data.

## 12. Open questions

1. Windows: 180 days for Established, 90 for Building, 24 months for Capitalized, 120 days for quiet.
2. Whether Tier 4 should require the second capital row, or whether hiring plus a two-sided commercial deal is enough for companies that raise quietly.
3. Whether to track Cook County and Illinois state grants by crawling program pages, given how inconsistently they publish awardees.
4. Investor ladder (Active in Chicago, Repeat, Lead) under the same six rules, once the company ladder has run for a quarter.
5. Whether the LinkedIn desk routine (a person clipping posts from the followed list daily) is sustainable, or whether LinkedIn should stay a capital-only intake for announcements someone happens to see.
6. Which X API tier: Basic is enough for a followed-list stream of a few hundred accounts; keyword search across all of X needs a higher tier.
