# Investor Research (PitchBook-style workspace)

Status: design spec, not built. Design canvas artboards: Screener, Investor profile,
Deals explorer, Compare.

## 1. Purpose

Today `/investors` is a browse experience: a search box, four filter groups, and a
card grid paginated six at a time, with a modal profile. That is good for discovery
and bad for research. A founder running a raise wants to scan a hundred firms, sort
them by recent activity, cut the list to twelve, and export it.

This spec turns the same data into a research workspace:

- A dense, sortable table with facet counts, so narrowing is fast and legible.
- A real profile page (URL addressable, shareable) rather than a modal.
- Form D filings promoted to a second top level entity, so you can start from a deal
  and work back to the money.
- A compare view for the short list.

Constraint that shapes everything below: design only what the data supports, and
label the gaps rather than inventing values.

## 2. The four screens

### 2.1 Screener (`/investors`)

Left rail of facets, center data table, toolbar above, pagination below.

Table columns: Name, Type, HQ, Stage, Check size, Sectors, Deals (Form D count),
Last filing, Co-investors, Quality (a small meter over `completeness_score`).
Sticky header, row checkboxes, view toggle between Table and Cards.

Toolbar: result count, selection count, sort, column chooser, Add to list,
Compare (n), Export CSV (Pro), Table / Cards toggle.

Facet groups: Investor type, Stage focus, Check size, Geography, Sectors,
Form D activity, Co-investor of, Data quality.

### 2.2 Investor profile (`/investors/:id`)

Header with name, type badge, Midwest badge, HQ, and website in a blurred Pro state
for free users. Add to pipeline control with stage and tag.

KPI strip: Form D deals, last filing, co-investors, check size, stage focus, data
quality. Tabs: Overview, Deals, Co-investors, People, Similar investors, Notes.

Right rail: pipeline card (stage, tag, notes), saved list membership, a data
provenance block (source, confidence, completeness, last updated), the Form D
inference caveat, and a short "Not in our data yet" list.

### 2.3 Deals explorer (`/deals`)

Filters for filing date, amount sold, industry group, issuer state, fund type.
A twelve month bar chart of filings, then a table: Issuer, Filed, Amount sold,
Offered, Industry group, Issuer HQ, Linked investors (chips).

### 2.4 Compare (`/investors/compare?ids=...`)

Up to four investors as columns, attributes as rows: Type, HQ, Stage focus, Check
size, Sectors, Deals 12 mo, Last filing, Co-investors, Data quality, Pipeline status,
Website (Pro), Actions.

## 3. Facet to SQL mapping

All investor reads go through the `public_investors` view, never `investors`
directly. `ir` below is the rollup in section 4.

| Facet | Predicate |
| --- | --- |
| Investor type | `investor_type = ANY($types)` |
| Stage focus | `stage_focus ILIKE ANY($patterns)` (free text today, see 3.1) |
| Check size, under $500K | `check_size_max < 500000` |
| Check size, $500K to $2M | `check_size_min <= 2000000 AND check_size_max >= 500000` |
| Check size, $2M to $10M | `check_size_min <= 10000000 AND check_size_max >= 2000000` |
| Check size, $10M and above | `check_size_max >= 10000000` |
| Check size, not stated | `check_size_min IS NULL AND check_size_max IS NULL` |
| Geography, Chicago metro | `hq_city = ANY($chicago_metro_cities) AND hq_state = 'IL'` |
| Geography, Midwest | `is_midwest = true` |
| Geography, by state | `hq_state = ANY($states)` |
| Sectors | `sectors && $sectors` (GIN index required) |
| Form D activity, 12 mo | `ir.last_filing_date >= now() - interval '12 months'` |
| Form D activity, 24 mo | `ir.last_filing_date >= now() - interval '24 months'` |
| Form D activity, any | `ir.deal_count > 0` |
| Form D activity, none | `ir.deal_count IS NULL OR ir.deal_count = 0` |
| Co-investor of X, min N | `id IN (SELECT investor_id FROM get_coinvestors(X, N))` |
| Data quality, Detailed | `completeness_score >= 70` |
| Data quality, Verified | `completeness_score >= 60` |

The Form D facets are written against the rollup deliberately. The naive form is

```sql
EXISTS (
  SELECT 1
  FROM deal_participants dp
  JOIN form_d_deals d ON d.id = dp.deal_id
  WHERE dp.investor_id = i.id
    AND d.filing_date >= now() - interval '12 months'
)
```

which is correct and far too slow to run as a facet count across sixty thousand
rows on every keystroke. Compute it once, nightly, into the rollup.

### 3.1 Note on `stage_focus`

`stage_focus` is a free text column, not an enum. The existing filter UI already
maps to ids (`pre_seed`, `seed`, `series_a`, ...) that do not exist in the data.
Before Phase 1 ships, either normalize `stage_focus` into a `text[]` of canonical
tokens on ingest, or keep an explicit ILIKE pattern table in one place. Do not
scatter pattern strings through the query builder.

## 4. New indexes and materialized views

### 4.1 `investor_rollup` (new materialized view)

The single most important addition. Without it, the Deals, Last filing and
Co-investors columns cannot be rendered in a table at all.

```sql
CREATE MATERIALIZED VIEW investor_rollup AS
SELECT
  dp.investor_id                                        AS investor_id,
  count(DISTINCT d.accession_number)                    AS deal_count,
  count(DISTINCT d.accession_number) FILTER (
    WHERE d.filing_date >= now() - interval '12 months'
  )                                                     AS deal_count_12mo,
  count(DISTINCT d.accession_number) FILTER (
    WHERE d.filing_date >= now() - interval '24 months'
  )                                                     AS deal_count_24mo,
  max(d.filing_date)                                    AS last_filing_date,
  sum(d.total_amount_sold)                              AS total_amount_sold
FROM deal_participants dp
JOIN form_d_deals d ON d.id = dp.deal_id
GROUP BY dp.investor_id;

CREATE UNIQUE INDEX investor_rollup_pk ON investor_rollup (investor_id);
CREATE INDEX investor_rollup_last_filing ON investor_rollup (last_filing_date DESC);
CREATE INDEX investor_rollup_deals_12mo ON investor_rollup (deal_count_12mo DESC);
```

Co-investor count comes from a second small rollup over `coinvestment_pairs`
(`investor_id`, `coinvestor_count`, `coinvestor_count_min2`), refreshed in the same
nightly job, immediately after `coinvestment_pairs` itself.

Refresh order, nightly: `form_d_deals` ingest, then `deal_participants`, then
`coinvestment_pairs`, then `investor_rollup`, then the co-investor rollup. Use
`REFRESH MATERIALIZED VIEW CONCURRENTLY` so the screener stays readable.

### 4.2 Indexes

On `investors`:

- `GIN (sectors)` for the sector facet.
- `(investor_type, is_midwest, completeness_score DESC)` for the default screener sort.
- `(hq_state, hq_city)` for geography.
- `(completeness_score DESC)` for the quality tiers.

On `form_d_deals`:

- `(filing_date DESC)`
- `(hq_state, filing_date DESC)`
- `(industry_group, filing_date DESC)`
- `(total_amount_sold)`

On `deal_participants`:

- `(investor_id, deal_id)`
- `(deal_id)` for the Linked investors column on the deals table.

### 4.3 Facet counts

Do not run one count query per facet value. Run a single grouped query per facet
group against the current predicate set minus that group's own predicate, which is
the standard faceted search shape, and cache the result for sixty seconds keyed on
the filter hash.

## 5. Pro gating matrix

| Field or feature | Free | Pro |
| --- | --- | --- |
| Name, type, stage, sectors, HQ city and state | Yes | Yes |
| Check size range | Yes | Yes |
| Description and thesis | Yes | Yes |
| Deal count, last filing, co-investor count | Yes | Yes |
| Data quality score and tier | Yes | Yes |
| Website and domain | Blurred, Pro chip | Yes |
| Phone and street address | Blurred, Pro chip | Yes |
| Semantic search | Upgrade banner | Yes, 20 per hour per IP |
| Boolean search | Yes | Yes |
| CSV export | Lock glyph on the button | Yes |
| Saved searches | 3 | Unlimited |
| Saved lists | 1 | Unlimited |
| Pipeline and notes | Yes, signed in | Yes |
| Compare | 2 investors | 4 investors |

Gating rule: a gated field renders as a blurred value with a Pro chip, never as an
empty row. The founder should be able to see that the field exists.

Enforcement is server side, in the `public_investors` view, exactly as it is today.
The UI treatment is a presentation of a null, not the gate itself.

## 6. Data gaps versus PitchBook, with a candidate source

| Gap | Candidate source | Notes |
| --- | --- | --- |
| Fund size and AUM | SEC Form ADV, Part 1 Item 5 | Only for registered advisers. Covers larger funds, misses most angels and small seed funds. Free bulk download. |
| Dry powder | Derived, ADV AUM minus deployed | An estimate at best. Label it as an estimate or do not ship it. |
| Portfolio companies | Crunchbase (paid), OpenVC (open, thin) | Also derivable in weak form from `deal_participants`, with the caveat in section 7. |
| Partner names and titles | Form ADV Schedule A, firm websites | We already surface Form D related persons as "Key people". Those are issuer officers, not firm partners. Different thing, do not conflate. |
| Lead versus follow | Not available from public filings | Would require a commercial deals dataset. Out of scope. |
| Exits | SEC Form D plus M and A news feeds | Low priority for a founder searching for a first check. |
| Contact emails | Manual curation, firm sites | Highest value, highest maintenance. Curate the top few hundred Chicago and Midwest firms by hand rather than buying a bulk list. |

Sequencing view: Form ADV is the cheapest real win, since it is a free bulk source
that adds AUM and partner names for the registered slice of the database. Do that
before paying anyone for portfolio data.

## 7. The Form D related persons caveat

`deal_participants` links an investor to a filing through the related persons named
on the Form D. Those people are the issuer's own executive officers, directors and
promoters. The link from that person to an investing firm is inferred, usually from
a name match, and is not stated anywhere in the filing.

Consequences the product must respect:

1. "Deals" is a measure of activity and adjacency, not a portfolio.
2. "Co-investors" is a name overlap, not a confirmed syndicate.
3. A firm with zero linked deals is not inactive. Roughly seven filings in ten carry
   no linked investor at all.

Every surface showing a deal count carries the caveat in plain language: a line
under the screener table, a provenance card on the profile, a footer note on the
deals explorer, a footer note on compare. This is not optional polish. Shipping
inferred counts as if they were a portfolio is the single biggest credibility risk
in this feature.

## 8. Phased build plan

### Phase 1: the table and the rollups

- `investor_rollup` and the co-investor rollup, plus the nightly refresh job.
- Indexes in section 4.2.
- Normalize or centralize `stage_focus` matching (section 3.1).
- Screener table view, sticky header, row selection, sort, column chooser.
- Facet rail with counts, including the Form D activity and Co-investor of facets.
- Keep the existing card grid behind the Table / Cards toggle.
- Caveat line under the table.

Ships value on its own: the current page becomes usable for a real search session.

Open question to settle before build: which view is the default. The proposal is
Table for signed in users who have run more than one search, Cards for everyone
else, remembering the last choice.

### Phase 2: profile page and deals explorer

- Promote the modal to `/investors/:id`, keep the modal as a quick peek from the
  table if it still earns its place.
- Tabs, provenance block, the "Not in our data yet" block.
- `/deals` with filters, the monthly chart, and the linked investor chips.
- Deep links both ways: profile to filtered deals, deal row to investor profiles.

### Phase 3: compare, alerts, and enrichment

- Compare view for two to four investors.
- Saved search alerts: notify when a saved search gains a firm that filed in the
  last thirty days. This is where the rollup pays off a second time.
- Form ADV ingest for AUM and firm personnel, as a new source with its own
  confidence score.
- Hand curated contact layer for the top Chicago and Midwest firms.

## 9. Out of scope

Fabricated or estimated values of any kind, including inferred AUM presented as
fact, portfolio lists assembled from name matching without a confidence score, and
any contact detail we have not verified. If a value is not in the data, the screen
says so.
