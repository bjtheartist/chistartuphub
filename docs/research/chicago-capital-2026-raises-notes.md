# Chicago-area funding rounds, 2026-01-01 to 2026-09-04 — research notes

Compiled 2026-09-04. Output: `raises.json` (40 rows).

## How this was gathered (and the big caveat)

The WebSearch budget for the session was exhausted after ~15 queries, so most discovery was done by
directly crawling sources with WebFetch and `curl` rather than by search. Two intended primary sources
could not be read at all:

- **Chicago Inno (bizjournals.com/chicago/inno) — NOT COVERED.** bizjournals.com is blocked for the
  web-search tool ("domains not accessible to our user agent") and refuses automated fetches. **No
  Chicago Inno roundup was read for any month.** This is the single largest gap in the dataset.
- **Crain's Chicago Business — NOT COVERED.** `https://www.chicagobusiness.com/john-pletz-technology`
  returned HTTP 403. No Crain's article was read.
- TechCrunch, Axios Pro Rata, Chicago Tribune, WGN, Block Club: no dedicated Chicago funding index
  was reachable without search; nothing from these was used.
- PRNewswire / BusinessWire: PRNewswire's own keyword search returned 0 results for Chicago funding
  queries, and its Venture Capital list (`/news-releases/financial-services-latest-news/venture-capital-list/`,
  opened, HTTP 200, ~100 releases/page) carries no city on the listing page, so filtering to Chicago
  datelines would have required opening thousands of releases. Not done.

## Sources actually opened

### 1. FinSMEs (primary backbone)
FinSMEs publishes a location-stamped first sentence for essentially every US round ("X, a Chicago,
IL-based provider of ..., raised $Y"). Article pages are fetchable; archives, sitemaps and the WP REST
API are Cloudflare-blocked, but the on-site search **is** reachable at `?s=<term>&paged=N`.

Crawled:
- `https://www.finsmes.com/?s=Chicago&paged=1..40` -> 804 unique articles, **66 dated 2026**. All 66 opened.
- `https://www.finsmes.com/?s=Illinois&paged=1..40` -> 14 additional 2026 articles not in the Chicago set. All opened.
- `https://www.finsmes.com/?s=Evanston&paged=1..2` -> 4 x 2026 articles, **none** an Evanston company (false matches).
- Also walked FinSMEs' prev-article chains from 9 seed articles before switching to the search method
  (partial coverage of Jan/Feb/Mar/Apr/Jun/Aug/Sep; superseded by the search crawl).

Yield: 34 of the 40 rows in `raises.json`.
Per month, FinSMEs 2026 Chicago/Illinois articles that turned out to be Chicago-area rounds:
Jan 3, Feb 7, Mar 5, Apr 5, May 3, Jun 6, Jul 5, Aug 3, Sep 1.

### 2. Built In Chicago
Crawled `https://www.builtinchicago.org/articles?page=1..40` (400 listing slots) and pulled every
article slug with a date suffix. **Built In Chicago published only three funding stories in 2026:**
- https://www.builtinchicago.org/articles/renterra-raises-9m-series-a-hiring-20260121 (1 round)
- https://www.builtinchicago.org/articles/letter-ai-raises-40m-series-b-20260226 (1 round)
- https://www.builtinchicago.org/articles/keycare-raises-27m-funding-20260303 (1 round)
All three opened and used as the second source for those rows. There is no monthly "these Chicago
companies raised" roundup in 2026 — that format appears to have been discontinued after 2024.
Months with no Built In funding article: Apr, May, Jun, Jul, Aug, Sep (and Feb has only Letter AI).

### 3. Hyde Park Angels (investor)
`https://hpa.vc/news/` opened, plus all 7 individual 2026 posts:
chowbus-round (1), cydelphi (1), digit-follow-on (1), handspring-b (1),
hpa-invests-in-empirical-series-a (1), hpa-invests-in-karoohealth (1), hpa-invests-in-shelfmark (1).
Yield: second sources for Chowbus and Empirical Security; 5 rounds that could not be placed in Chicago (below).

### 4. Polsky Center, University of Chicago
`https://polsky.uchicago.edu/category/news/` opened (2026 items listed), plus
`https://polsky.uchicago.edu/2026/06/17/george-shultz-innovation-fund-awards-250k-to-parasol-medtech-and-signl/`.
Yield: 2 rows (Parasol Medtech, Signl — $250K each).

### 5. Ecosystem pages that yielded nothing
- `https://worldbusinesschicago.com/news/` — opened; 2026 items are reports/rankings, no funding rounds.
- `https://www.1871.com/blog/` — opened; no 2026 member funding announcements.
- `https://mhub.org/blog` — opened; member spotlights and programs, no 2026 funding rounds.
- `https://news.crunchbase.com/tag/chicago/` — opened; nothing newer than 2020.
- `https://polsky.uchicago.edu/tag/venture-capital/` — opened; nothing from 2026.
- `https://revli.com/chicago-funded-startups/`, `https://fundraiseinsider.com/blog/recently-funded-startups-chicago/` — opened;
  paywalled aggregators, used only as lead lists, never as sources.
- `https://projectstartups.com/pages/chicago/` — HTTP 403.

### 6. Company sites (opened only to establish Chicago presence, never counted as a funding source)
Confirmed a Chicago-area address on the company's own site for: Qumis, KeyCare, Chowbus, BravoTran,
Syntax Bio, Sabanto, PatientIQ, Zarminali Pediatrics, memQ (memq.tech/about, /contact),
LanzaJet (lanzajet.com/contact — Deerfield, IL), Honeycomb (honeycombinsurance.com/contact),
Vinyl Equity (vinylequity.com/contact), EDX Markets (edxmarkets.com/about), Go Brewing
(gobrewing.com/pages/contact — Naperville, IL).

## Coverage by month (rows in raises.json)
Jan 3 | Feb 7 | Mar 5 | Apr 5 | May 3 | Jun 8 | Jul 5 | Aug 3 | Sep (1-4) 1 = **40**

Evidence classes: two_sources 5, investor_attested 2, single_source 33. No SEC/state filings were checked.

## Seen but NOT included, with reasons

**Chicago-area but not a funding round (M&A / corporate):**
- Syndigo (Chicago) acquired Taggstar, 2026-03-23 — acquisition.
- Supplier.io (Chicago) acquired TealBook, 2026-04-06 — acquisition.
- Context Analytics (Chicago) acquired by BridgeWise, 2026-03-02 — acquisition.
- Tempus AI / Personalis, ACCO Brands / EPOS, Abbott / Exact Sciences, Quantum Rise / Dhauz,
  Allwyn business combination — all M&A items seen on Built In Chicago, not rounds.

**Chicago investor, non-Chicago company (excluded — the money was Chicago, the company was not):**
- InstaSwitch, $4.7M seed 2026-05-06, led by Chicago Ventures — FinSMEs and the company release both say NYC-based.
- Guthrie AI, $4M seed 2026-07-13, led by Chicago Ventures — Philadelphia, PA.
- Intelligent Legal Solutions, undisclosed seed 2026-03-09, led by Chicago Ventures — London, UK.
- Buildforce, $10M Series A 2026-07-30, Chicago Ventures participating — Houston, TX.
- Coral Care ($13M Series A, NYC), Ownwell ($50M Series B, Austin), Zero Homes ($16.8M, Denver),
  Rundoo ($30M Series B, Redwood City), ProphetX ($35M, NYC), Neato ($25M, Las Vegas),
  10Beauty ($23.5M, Burlington MA), Arkenstone Defense ($35M, Menlo Park), Solar Landscape (NJ, 3 rounds),
  Aspen Power (NYC), Base Power (Austin), Dimension Energy (Atlanta), Vaderis (Basel),
  Power Home Remodeling (Chester PA), Luminate (Galway), Newlight (San Francisco).

**Illinois but not Chicago-area (excluded per the Chicago-metro scope):**
- Natural Fiber Welding, strategic investment 2026-01-14 — Peoria, IL.
- Photon Queue, $4M seed 2026-07-21 and $500K grant 2026-07-15 — Champaign, IL.

**Could not source well enough to include (HQ never established from an opened URL):**
- **Digit** — $3M seed, 2026-03-13, led by Tech Square Ventures, HPA follow-on
  (https://hpa.vc/digit-follow-on/). HPA's post never states a city; getdigit.com did not resolve.
  Likely not Chicago (Tech Square = Atlanta, Assembly/Grand Ventures = Michigan) but unproven either way.
- **Cydelphi** — $3M seed, 2026-02-12, led by Glasswing Ventures, HPA participating
  (https://hpa.vc/cydelphi/). No city in the post; cydelphi.com returned no location text.
- **Shelfmark** — $3.5M seed, 2026-08-05, led by Armory Square Ventures, HPA participating
  (https://hpa.vc/hpa-invests-in-shelfmark/). No city in the post; shelfmark.ai returned no location text.
  Armory Square is Syracuse, NY-focused, so Chicago is doubtful.
- **Karoo Health** — $16.2M Series A, 2026-07-21, co-led by 7wire Ventures and Allumia Ventures, HPA
  participating (https://hpa.vc/hpa-invests-in-karoohealth/). No city in the post; karoohealth.com
  returned no location text. 7wire is a Chicago firm, which is suggestive but not evidence of HQ.
- **Handspring Health** — $19M Series B, 2026-07-07 (https://hpa.vc/handspring-b/). Excluded because
  handspringhealth.com lists only East Coast/Southeast markets; not a Chicago company.
- Revli's aggregator table listed several 2026 rounds I could never corroborate from any opened
  article and therefore did not include: **Freehand** ($75M Series B, Jul), **Fly** ($23M, Jul),
  **Imio** ($6M seed, Jul), **LawEngine** ($100K seed, Jul), **Every Body Eat** ($5M, Jun),
  **The General Aviation Company** ($500K pre-seed, Jun), **Rent Butter** ($3M debt, May),
  **NovaScan** ($671K convertible note, May), **Trajektory** ($8M, May), **Switched Source** ($10M, May),
  **Renovo Financial** ($75M debt, May), **Paira** ($130K pre-seed, May), **Moto** ($810K seed, May),
  **Celadyne** ($250K NSF, May). Revli is a paywalled database, not an opened primary source, and
  several of these are probably not Chicago companies. **These are the most likely misses.**
- Polsky's Global New Venture Challenge awarded a record $435,000 across winners on 2026-06-05
  (Phinorm, Morton Labs and others). Treated as competition prize money, not a funding round; excluded.

## Known weaknesses of this dataset
1. No Chicago Inno and no Crain's — the two outlets that cover small Chicago rounds most thoroughly.
   Expect meaningful under-count, especially pre-seed/seed rounds under $3M and rounds with no wire release.
2. 33 of 40 rows rest on a single outlet (FinSMEs). Amounts, dates and investor lists are as FinSMEs
   printed them; none were cross-checked against a company press release.
3. `date_announced` is the publication date of the source article, which can trail the company's own
   announcement by a day or two.
4. Hopscotch Primary Care's Chicago attribution comes only from FinSMEs and is contradicted by the
   company's own site; flagged in its row.
5. Suburban coverage is thin: only "Chicago", "Illinois" and "Evanston" were used as search terms on
   FinSMEs. Naperville, Oak Brook and Northbrook rows surfaced via the "Illinois" query, but a company
   described only as e.g. "Schaumburg-based" without the word Illinois would have been missed.
