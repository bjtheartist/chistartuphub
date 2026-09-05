# Chicago investor activity, 2026-01-01 to 2026-09-04 — research notes
Compiled 2026-09-04. Two datasets sit alongside this file:
- `investor-deployments.json` — 89 investments by Chicago/Illinois-HQ investors
- `fund-closes.json` — 16 fund closes / new fund announcements by Chicago-HQ managers

## How to read this

Research ran as nine parallel lanes (g0 orchestrator sweep + g1-g8 investor groups). Each lane's section below
is reproduced verbatim, including every URL opened and every explicit "No 2026 activity found." line, so that
**absence is documented rather than merely absent**. Rows were then merged, de-duplicated across lanes, and
filtered to the window.

### Evidence classes present

Deployments: investor_attested=18, single_source=18, two_sources=53

Funds: filing=2, investor_attested=3, single_source=1, two_sources=10

### Deal count by investor

- ARCH Venture Partners — 11
- Valor Equity Partners — 8
- Hyde Park Angels — 6
- M25 — 6
- Chicago Atlantic — 5
- Energize Capital — 4
- Hyde Park Venture Partners — 4
- Jump Capital — 4
- Origin Ventures — 4
- Chicago Ventures — 3
- Moderne Ventures — 3
- N.XT Fund (Northwestern University) — 3
- S2G Investments — 3
- TechNexus Venture Collaborative — 3
- Wind Point Partners — 3
- 7wire Ventures — 2
- Bluestein Ventures — 2
- Cleveland Avenue — 2
- Corazon Capital — 2
- George Shultz Innovation Fund (Polsky Center, University of Chicago) — 2
- Illinois Ventures — 2
- Impact Engine — 2
- Lightbank — 2
- Baird Capital — 1
- KB Partners — 1
- Serra Ventures — 1

### Fund events by manager

- 2026-01-07 — Valor Equity Partners, Valor Compute Infrastructure L.P. (VCI) (announced, $5.4 billion transaction, including a $3.5 billion capital solution from Apollo-managed funds)
- 2026-02-04 — SNAK Venture Partners, SNAK Venture Partners Fund I (final_close, $50 million (oversubscribed; $40M target))
- 2026-03-21 — Motivate Venture Capital (Motivate Ventures), Motivate Fund III (announced, $100 million (target))
- 2026-03-31 — Corazon Capital, Corazon Capital Fund IV (final_close, $100M)
- 2026-04-08 — Chicago Atlantic, Chicago Atlantic Emerging Markets Private Credit strategy (announced, size undisclosed)
- 2026-04-21 — Baird Capital, Baird Capital Global Fund III (final_close, $450 million)
- 2026-05-05 — Baird Capital, Baird Capital Blue Matter continuation vehicle (single-asset CV) (final_close, undisclosed)
- 2026-05-12 — S2G Investments, Solutions Fund I (final_close, $1 billion)
- 2026-06-24 — Valor Equity Partners, Valor Equity Partners Fund VII (target, $2.5 billion (target))
- 2026-07-29 — Jump Capital, Jump Capital Fund VIII (final_close, $350 million)
- 2026-07-29 — GTCR, GTCR Capital Solutions Fund (final_close, approximately $1.25 billion in aggregate commitments)
- 2026-07-29 — Wind Point Partners, Wind Point Partners XI (final_close, $3.2 billion)
- 2026-07-30 — TechNexus Venture Collaborative, SecondWave (announced, size undisclosed)
- 2026-08-05 — G Squared, G Squared VII (final_close, $2.3 billion)
- 2026-08-27 — Permanent Capital Ventures, Permanent Capital Ventures Fund II (final_close, $200 million)
- 2026-08-31 — ARCH Venture Partners, ARCH Venture Fund XIV, L.P. (announced, $3,000,000,000 total offering amount)

## Dataset-wide caveats

**1. The session WebSearch budget (200/200 calls) was exhausted partway through the run.** Every lane reported hitting
it. After that point lanes fell back to WebFetch against investor sites, SEC EDGAR, press releases, and news RSS.
Consequently a "No 2026 activity found." line in a later-finishing lane may reflect a truncated query battery rather
than genuine inactivity. **Treat this dataset as a floor, not a ceiling.** Re-running with
`CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` raised is the single highest-value follow-up.

**2. Several major publishers return HTTP 403 to automated fetching**: businesswire.com, prnewswire.com (intermittently),
chicagobusiness.com (Crain's), forbes.com, finsmes.com, nosh.com, foodbusinessnews.net, and Google/Bing/DDG/Brave/Mojeek
HTML search. Some rows are graded `single_source` purely because a known second source could not be opened, not because
it does not exist.

**3. Scope note on fund closes.** Criterion (B) reads "any Chicago-HQ investment manager," so buyout, growth and private
credit managers are included alongside venture: Wind Point Partners, GTCR, Baird Capital, G Squared and Chicago Atlantic
all appear. Each such row says so in its notes. Drop them if the intended scope is venture-only.

**4. Firms verified as NOT Chicago-HQ and therefore excluded** (documented so the exclusion is auditable):
Firebrand Ventures (Kansas City MO), Great North Ventures (Maple Grove MN), GreatPoint Ventures (San Francisco),
Cultivation Capital (St. Louis; Chicago satellite only), Ampersand Capital Partners (Boston MA), Level Equity (New York),
Top Down Ventures (Vancouver BC), Gateway Capital (Milwaukee), Northwestern Mutual venture arm (Milwaukee).
Purple Arch Ventures is an Alumni Ventures fund whose manager sits in Manchester NH — flagged, deals not recorded.

**5. "Amplify Chicago" is not an investor.** It is a Chicago workforce-development and wealth-building nonprofit. No
Chicago VC by that name exists; the "Amplify" venture firms are all California-based. Zero rows.

**6. Pre-supplied claims, both checked.** S2G Investments Solutions Fund I **confirmed exactly** — final close,
$1,000,000,000, announced 2026-05-12. The Fairway Private Equity & Venture Capital Opportunities Fund $26.3M figure
**is not a fund close** and was excluded; see the g0 section for the reasoning.

**7. Known unresolved leads** (named, deliberately not recorded, needing a follow-up pass): the four SNAK portfolio
companies (BigRentals, Repackify, Ruck, APFusion); a Crain's headline about a "$200M Gamson-led fund"; ~8 Illinois
Ventures portfolio logos tagged 2026; Chicago Ventures' Helix; a possible M25 check into Benji; Motivate's 2026
deployments; ARCH's ~3 undocumented remaining 2026 rounds; and PitchBook-attributed deals for Purple Arch, Chicago
Early Growth Ventures and IrishAngels that no publisher corroborates.

**8. Cross-lane conflicts resolved on merge.** Jump Capital Fund VIII was reported at both 2026-07-28 (The Information)
and 2026-07-29 (AltAssets, Chicago Business Journal); 07-29 retained as the public announcement date. GTCR's Capital
Solutions Fund was found independently by two lanes and collapsed to one row. Wind Point Fund XI likewise.

**9. Three rows carry a null `date_announced`** — the N.XT Fund's Amino, AtomoAi and GoEco. The fund tags them 2026 on
its own site but publishes no date or amount and no outlet covered them. Dates were left null rather than invented.

---


# Lane g0 — orchestrator sweep, pre-supplied claim verification, discovery

## Orchestrator lane (g0) — cross-cutting sweep, verification of pre-supplied claims, discovery

### Verification of pre-supplied claim: Fairway Private Equity & Venture Capital Opportunities Fund, $26.3M

**Verdict: manager IS Chicago-HQ, but this is NOT a fund close and is EXCLUDED from fund-closes.json.**

URLs opened:
- https://fairwaycapm.com/pe-vc-opportunities/ — confirms Fairway Capital Management HQ is **One South Wacker Drive, Suite 1050, Chicago IL 60606**. Chicago-HQ: yes.
- https://www.businesswire.com/news/home/20260304658022/en/Fairway-Private-Equity-Venture-Capital-Opportunities-Fund-Announces-Fourth-Quarter-and-Full-Year-Results — **HTTP 403, could not open.** Title alone shows it is a *quarterly/full-year results* release, not a fund close.
- https://pitchbook.com/news/articles/why-large-evergreen-funds-might-be-the-losers-in-vc — via search result: the fund "held about $26.3 million in net assets as of March 31, 2026, per regulatory filings."

Why excluded: the $26.3M is the fund's **net asset value as of 2026-03-31**, not a capital raise, first close, final close, or new fund announcement. The fund is an **evergreen / continuously-offered tender-offer fund with a December 29, 2021 inception date** — so its launch also falls outside the 2026-01-01..2026-09-04 window. Nothing here meets the definition of event B. Recorded here so the absence is documented rather than silently dropped.

### Verification of pre-supplied claim: S2G Investments Solutions Fund I, ~$1B, ~2026-05-12

Delegated to the group-3 researcher (S2G is in their investor set) to avoid duplicate work. See the S2G section of this notes file for the outcome.

### Discovered Chicago-HQ managers NOT on the original list

#### SNAK Venture Partners — INCLUDED (fund close)
- https://techcrunch.com/2026/02/04/snak-venture-partners-raises-50m-fund-to-back-digitizing-marketplaces/
- https://snakvc.substack.com/p/announcing-snak-fund-i
- https://vcwire.tech/2026/02/04/snak-venture-partners-closes-inaugural-fund-at-50m/
- https://intersectionhq.substack.com/p/who-raised-what-2026-guide-to-new
- https://app.dealroom.co/news/feed/snak-venture-partners-raises-50m-debut-fund-to-back-b2b-vertical-marketplaces (search result only)
- https://pulse2.com/snak-venture-partners-50-million-debut-fund/ (search result only)
- https://techfundingnews.com/snak-venture-partners-50m-fund-b2b-marketplaces/ (search result only)

Chicago. Fund I, $50M oversubscribed close, announced 2026-02-04. Founded by Sonia Sahney Nagar and Adam Koopersmith, both ex-Pritzker Group VC; Pritzker Group is the anchor LP, alongside the State of Illinois Growth and Innovation Fund. This is the firm behind the Crain's headline "Pritzker Group veterans raise $50M venture capital fund."

**Open gap:** SNAK's own announcement names four portfolio companies — BigRentals, Repackify, Ruck, APFusion — but I could not establish individual round dates, amounts, or SNAK's role for any of them, so **no SNAK deployment rows were created**. These four need a follow-up pass.

#### GTCR — INCLUDED (fund close)
- https://www.prnewswire.com/news-releases/gtcr-closes-1-25-billion-capital-solutions-fund-302837130.html
- https://www.altassets.net/premium/gtcr-wraps-up-capital-solutions-vehicle-with-1-25bn-raise.html

Chicago. Inaugural Capital Solutions Fund, ~$1.25B final close, 2026-07-29. Structured equity/debt, not venture, but qualifies under scope (B) as a Chicago-HQ investment manager.

### Wind Point Partners (on the list) — fund close captured in g0
- https://www.wppartners.com/wind-point-partners-announces-final-close-of-oversubscribed-fund-xi-at-3-2-billion/
- https://finance.yahoo.com/small-business/articles/wind-point-partners-announces-final-120000475.html
- https://www.altassets.net/premium/wind-point-partners-concludes-eleventh-flagship-fund-at-3-2bn.html

Fund XI final close at $3.2B on 2026-07-29, Chicago-HQ. Captured here rather than by the group-6 researcher; deduped on merge. Wind Point *deal* activity is the group-6 researcher's lane.

### Candidates checked and REJECTED

- **Top Down Ventures, Founders Fund I, $28M final close (April 2026, announced 2026-05-12).** Surfaced by a "Chicago-based fund close 2026" search but the firm is **Vancouver, BC**-headquartered, not Chicago. Excluded.
  - https://www.prnewswire.com/news-releases/top-down-ventures-closes-us28m-founders-fund-i-exceeding-target-302767596.html (WebFetch timed out; HQ established from BetaKit/Channel Insider/Morningstar search results)
  - https://betakit.com/top-down-closes-vc-fund-aimed-at-invisible-infrastructure-of-the-global-economy/ (search result only)
- **The Vistria Group, Vistria Fund IV, $2.68B final close.** Chicago-HQ, but the release is dated **2021-06-30**, not 2026. The page footer reads "© 2026," which is what made it surface in a 2026 query. Excluded as out of window.
  - https://vistria.com/the-vistria-group-closes-on-2-68-billion-for-flagship-core-private-equity-fund/
- **The Vistria Group multi-asset continuation vehicle, ~$750M, Partners Group leading.** Reported as *expected* to close end-2025/early-2026. This is a forward-looking report of an expected close, not an announced close — **rumor-class, excluded** per the no-rumors rule. Worth re-checking whether a close was ever announced.
  - https://ionanalytics.com/insights/mergermarket/vistria-runs-multi-asset-continuation-vehicle-process-partners-group-leads-deal/ (search result only)
- **Gateway Capital Fund II first close, $25M.** Milwaukee, WI. Excluded.
- **Northwestern Mutual $150M Fund III (2026).** Milwaukee, WI corporate venture arm. Excluded. Not to be confused with Northwestern University's N.XT fund, which is in the group-7 lane.
- **Madison Dearborn Partners, CORE Industrial Partners.** Both Chicago-HQ; searched for 2026 fund closes and **no 2026 fund close found**. CORE's most recent surfaced close (Fund II, $465M) is dated 2021-02-26. Coverage here is thin — see gaps.

### Leads noted for other lanes (not actioned by g0, to avoid duplicate work)
- Origin Ventures — new **$140M** fund (sixth), reported by Crain's around **February 2026**. Group-1 lane. https://www.chicagobusiness.com/technology/origin-ventures-raises-new-140-million-venture-capital-fund/
- Chicago Ventures — new **$63M** fund, reported by Crain's around **January 2026**. Group-1 lane. https://www.chicagobusiness.com/john-pletz-technology/chicago-ventures-raises-new-63-million-fund/
- "Gamson-led venture capital firm raises $200M fund" (Crain's, via AlphaMaven) — likely **Origin Ventures** (Steven Gamson) or a related vehicle; **unresolved**, needs a follow-up pass. https://alpha-maven.com/story/venture-capital/gamson-led-venture-capital-firm-raises-200m-fund-crains-chicago-business
- Context for the year: Crain's reports Chicago-area companies raised **$2.6B in 2025, a seven-year low**, and that Chicago is "missing the rebound" in venture funding. https://www.chicagobusiness.com/finance-banking/chicago-missing-rebound-venture-funding

### HARD CONSTRAINT HIT — session WebSearch budget exhausted

The session's WebSearch quota (**200 of 200 calls**) was consumed partway through this run, across the orchestrator and the eight parallel group researchers. From that point on only WebFetch (direct URL retrieval) remained available.

Practical consequences for this dataset:
- Any group researcher that had not finished its query battery when the cap hit could not complete the prescribed nine searches per investor. Per-investor coverage is therefore **uneven**, and a "No 2026 activity found." line in a later group's section may reflect an exhausted search budget rather than genuine absence of activity.
- The planned broad PRNewswire/BusinessWire wire sweeps for firm names were only partially executed.
- The Chicago PE fund-close sweep (Madison Dearborn, CORE Industrial, Sterling Partners, Thoma Bravo, Adams Street, Vistria) was cut short after one query.
- Treat this dataset as a **floor, not a ceiling**: rows present are sourced, but absence is not proven.

To finish the job, re-run with `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` raised, prioritising: the four SNAK portfolio companies; the unresolved "$200M Gamson-led fund"; Madison Dearborn/CORE Industrial/Sterling/Adams Street fund closes; and any investor section below whose notes show a truncated query battery.

---


# Lane g1 — Chicago Ventures, Hyde Park Venture Partners, Hyde Park Angels, Lightbank, Origin Ventures

## Group g1 research notes — Chicago venture investors, 2026-01-01 → 2026-09-04

Research date: 2026-09-04. Window enforced: only rounds announced 2026-01-01 through 2026-09-04.

**Tooling caveat (affects source coverage):** the session's WebSearch budget (200 calls) was exhausted early. The
remainder of the research was done with WebFetch plus direct HTTP retrieval (curl) of the Google News RSS search
endpoint, investor sites, and publisher site-search endpoints. Several primary wire hosts —
`businesswire.com`, `prnewswire.com`, `forbes.com`, `medium.com`, and `globenewswire` (WebFetch path only) —
return HTTP 403 to automated fetches, so where a wire release could not actually be opened it is flagged in the
per-deal `notes` and the evidence class is downgraded. Google/DuckDuckGo/Bing/Mojeek/Brave/Ecosia general web
search all blocked automated access (CAPTCHA / 403 / 429).

---

### Chicago Ventures

HQ confirmed: 220 N Green St, Chicago, IL 60607 (site footer).

URLs opened:
- https://www.chicagoventures.com/
- https://www.chicagoventures.com/companies  (full portfolio pulled; four entries tagged "2026, Seed")
- https://medium.com/chicago-ventures  (HTTP 403 — could not open)
- https://www.businesswire.com/news/home/20260309099601/en/ILS-Intelligent-Legal-Solutions-Raises-$3M-in-Funding-Led-by-Chicago-Ventures  (HTTP 403)
- https://pulse2.com/intelligent-legal-solutions-3-million-raised-for-legal-technology-platform/
- https://www.legaltech-talk.com/intelligent-legal-solutions-secures-seed-investment-led-by-chicago-ventures/
- https://tech.eu/2026/03/09/ils-secures-seed-funding-to-expand-provision-legal-workflow-platform/
- https://www.morningstar.com/news/business-wire/20260309099601/ils-intelligent-legal-solutions-raises-3m-in-funding-led-by-chicago-ventures  (no readable body)
- https://www.legaion.com/news/intelligent-legal-solutions-secures-3m-seed-funding-led-by-chicago-ventures-ddc1adc9  (no readable body)
- https://www.globenewswire.com/news-release/2026/05/05/3287812/0/en/instaswitch-launches-account-activation-infrastructure-for-business-banking-and-announces-4-7m-in-funding.html
- https://www.finsmes.com/2026/05/instaswitch-raises-4-7m-in-seed-funding.html
- https://www.forbes.com/sites/elainepofeldt/2026/05/05/startup-wins-funding-from-chicago-ventures-for-a-platform-that-makes-it-easier-for-small-businesses-to-switch-banks/  (HTTP 403)
- https://venturebeat.com/business/guthrie-ai-raises-4-million-seed-round-led-by-chicago-ventures-to-put-a-virtual-bid-assistant-on-every-glazing-team
- https://pulse2.com/guthrie-ai-raises-4-million-seed-funding-to-scale-virtual-bid-assistant-platform-for-glazing-contractors/
- https://technical.ly/entrepreneurship/guthrie-ai-raises-4-million-construction-tech/
- https://www.finsmes.com/2026/03/keycare-raises-27-4m-in-funding.html  (exclusion check — see below)

Deals found (all Chicago Ventures as **lead**):
1. **ILS (Intelligent Legal Solutions)** — $3M seed, 2026-03-09.
2. **InstaSwitch** — $4.7M seed, 2026-05-05 (New York, NY; Chicago office).
3. **Guthrie AI** — $4M seed, 2026-07-13 (Philadelphia, PA).

Not recorded in the JSON:
- **Helix** — the Chicago Ventures portfolio page lists "Helix — Enterprise Tools — 2026, Seed"
  ("on-device, deepfake-resistant voice verification that proves a live, account-bound human and plugs into
  existing identity and fraud systems"). No announcement, date, amount, or press coverage could be found anywhere.
  Because the schema requires a specific `date_announced` and no date is attested, it is **omitted from
  g1-deployments.json rather than dated by guesswork**. It is a real, investor-attested 2026 addition and should
  be treated as a fifth Chicago Ventures 2026 deal of unknown size and date.
- **KeyCare** ($27.4M, 2026-03-03, Chicago) — surfaced under a "Chicago Ventures" news query but the investor is
  **University of Chicago Ventures**, a different entity. Excluded. Name-collision trap worth flagging.

No 2026 fund close, first close, or new-fund announcement found for Chicago Ventures.

---

### Hyde Park Venture Partners

HQ: Chicago, IL (Midwest / "mid-continent" focus, pre-seed through early Series A).

URLs opened:
- https://www.hydeparkvp.com/
- https://www.hydeparkvp.com/companies  (full portfolio with "Partner Since" years; no 2026 additions listed,
  most recent new logo is Rayni, 2025)
- https://www.hydeparkvp.com/perspectives  (full archive; only one 2026 item — Guy Turner's article
  "The Year AI Stuck the Landing", March 2026. **No 2026 company-news posts at all**, so the firm's own site
  materially understates its 2026 activity.)
- https://quantumcomputingreport.com/memq-secures-10m-series-a-to-develop-distributed-quantum-networking-hardware/
- https://thequantuminsider.com/2026/03/31/memq-raises-10-million-in-series/
- https://polsky.uchicago.edu/2026/03/31/memq-closes-10m-series-a-funding-round/
- https://pulse2.com/definity-raises-12-million-series-a-to-advance-agentic-data-engineering-platform/
- https://www.start-midwest.com/news/chicagos-definity-unveils-agentic-data-engineering-platform-with-12m-series-a
- https://www.prnewswire.com/news-releases/definity-unveils-agentic-data-engineering-platform-with-12m-series-a-302757245.html  (timeout)
- https://www.finsmes.com/2026/04/definity-raises-12m-in-series-a-funding.html  (HTTP 403 via WebFetch)
- https://www.finsmes.com/2026/05/benji-raises-6-25m-in-seed-funding.html
- https://www.finsmes.com/2026/08/rwx-raises-12m-in-series-a-funding.html
- https://www.prnewswire.com/news-releases/hdata-raises-10-million-to-accelerate-energy-sector-data-intelligence-302080103.html  (exclusion check)

Deals found:
1. **memQ** — $10M Series A, 2026-03-31, participant (Chicago, IL).
2. **definity** — $12M Series A, 2026-04-29, participant (Chicago, IL & Israel).
3. **Benji** — $6.25M seed, 2026-05-19, participant (Chicago, IL & NYC).
4. **RWX** — $12M Series A, 2026-08-04, **lead** (Columbus, OH).

Excluded after checking:
- **Slip Robotics** $28M Series B — announced 2024-12-17, outside window. (Tracxn describes it as HPVP's "most
  recent first-time investment", which is misleading.)
- **HData** $10M Series A — announced March **2024**, outside window. A search snippet wrongly implied 2026.
- **Rayni** — HPVP portfolio addition dated "Partner Since 2025"; a January 2026 Business Journals item surfaced
  but no 2026 funding round was verifiable. Not recorded.

No 2026 fund event. HPVP's most recent fund is **Fund IV, $98M, announced May 2024** — outside the window.

---

### Hyde Park Angels (HPA)

HQ: Chicago, IL. Note the domain redirect: hydeparkangels.com → **hpa.vc**.

URLs opened:
- https://www.hydeparkangels.com/ (redirects to https://hpa.vc/)
- https://hpa.vc/news/  (full 2026 news feed — the single best source for this investor)
- https://hpa.vc/portfolio/
- https://www.finsmes.com/2026/02/cydelphi-raises-3m-in-seed-funding.html
- https://pulse2.com/cydelphi-3-million-seed-funding/
- https://www.finsmes.com/2026/03/chowbus-raises-81m-in-funding.html
- https://www.finsmes.com/2026/07/handspring-raises-19m-in-series-b-funding.html
- https://pulse2.com/handspring-raises-19-million-series-b-to-scale-evidence-based-youth-mental-health-care-nationwide/
- https://www.finsmes.com/2026/07/empirical-security-raises-25m-in-series-a-funding.html
- https://pulse2.com/empirical-security-raises-25-million-series-a-to-expand-predictive-exposure-management-platform/
- https://www.finsmes.com/2026/07/karoo-health-raises-16-2m-in-series-a-funding.html
- https://www.finsmes.com/2026/08/shelfmark-raises-3-5m-in-seed-funding.html

Deals found (HPA is a **participant** in all six; it did not lead any 2026 round):
1. **Cydelphi** — $3M seed, 2026-02-12 (Dallas, TX).
2. **Digit** — $3M seed follow-on, 2026-03-13 (investor-attested only).
3. **Handspring Health** — $19M Series B, 2026-07-07 (New York, NY).
4. **Empirical Security** — $25M Series A follow-on, 2026-07-20 (Chicago, IL).
5. **Karoo Health** — $16.2M Series A, 2026-07-21 (Albuquerque, NM).
6. **Shelfmark** — $3.5M seed, 2026-08-05 (Pittsburgh, PA).

Not recorded:
- **Chowbus** $81M, 2026-03-11 (Chicago, IL). HPA posted about it, but both HPA's post and FinSMEs describe HPA
  only as a long-standing shareholder since the 2019 series seed; **neither states HPA participated in this
  round** (led by Prysm Capital and Left Lane Capital, with Dutchess, Fika and Avid Bank). Excluded to avoid
  inventing a role. Flagging it because it is the largest 2026 round touching an HPA portfolio company.
- **Moonnox acquired by Certinia** (2026-07-21) — an exit, not a deployment.

No 2026 fund event found for HPA.

---

### Lightbank

HQ: Chicago, IL (site footer: "INFO@LIGHTBANK.COM · CHICAGO, IL").

URLs opened:
- https://www.lightbank.com/
- https://www.lightbank.com/blog  (**no 2026 posts at all** — most recent is 2025-06-10, "Boom celebrates the
  reversal of the supersonic flight ban". Lightbank's own site is effectively dark for 2026.)
- https://www.lightbank.com/companies  (names only, no dates or stage/vintage data — cannot be used to detect
  2026 additions)
- https://www.finsmes.com/2026/02/bearing-closes-4-5m-seed-funding.html
- https://pulse2.com/bearing-4-5-million-seed-funding-raised-for-scaling-on-the-servicenow-ai-platform/
- https://www.finsmes.com/2026/07/valarian-raises-50m-in-series-a-funding.html
- https://pulse2.com/valarian-raises-50-million-series-a-to-build-sovereign-infrastructure-for-ai-driven-systems/

Deals found (participant in both; no 2026 lead found):
1. **Bearing** — $4.5M seed, 2026-02-12 (Scottsdale, AZ).
2. **Valarian** — $50M Series A, 2026-07-14 (London, UK).

No 2026 fund event. Lightbank's most recent fund is **Fund III, $290M, announced May 2024** — outside the window.

Gap warning: Lightbank is the least-documented of the five. Its blog is silent for 2026, its companies page is
undated, and general web search was unavailable, so coverage here rests entirely on the Google News index. There
may be unannounced or lightly covered 2026 Lightbank deals not captured.

---

### Origin Ventures

HQ: **Chicago is one of six listed offices** — the site footer reads "San Francisco | Salt Lake City | Chicago |
D.C. | New York | Los Angeles". The firm is historically and still commonly described as Chicago-based, so
`investor_hq` is recorded as "Chicago", but note the distributed footprint — it is no longer a single-office
Chicago firm. Thesis has been repositioned around "the Artificial Intelligence Economy".

URLs opened:
- https://www.originventures.com/
- https://www.originventures.com/blog  (post list with ISO dates — best source for this investor)
- https://www.originventures.com/portfolio
- https://www.originventures.com/blog/the-invisible-battlefield-rf-sensing-and-the-new-frontier-of-security  (R2 Wireless)
- https://www.originventures.com/blog/why-we-invested-in-intalus
- https://www.originventures.com/blog/building-the-clinical-data-layer-for-ai-why-we-invested-in-century-health
- https://www.tectonicdefense.com/p/exclusive-intalus-raises-20m-for-metal-ceramic-integration
- https://www.finsmes.com/2026/05/century-health-raises-5m-in-seed-funding.html
- https://techcrunch.com/?p=2231348  (turned out to be a 2021 story about Origin's $130M Fund V — not in window)

Deals found:
1. **R2 Wireless** — $5.3M round, 2026-01-08, **lead** (investor-attested only; stage not labelled by Origin).
2. **Intalus** — $11M seed, 2026-04-24, **lead** (investor-attested only).
3. **Intalus** — additional $20M seed, 2026-07-21, role **unknown**, single source. Recorded separately; watch for
   double-counting against item 2 (Tectonic Defense says total funding reached $31M = $11M + $20M).
4. **Century Health** — $5M seed, 2026-05-19, **lead** (New York, NY).

No 2026 fund event. Origin's most recent is **Fund VI, $140M, closed October 2025** — just outside the window.
All four 2026 investments above are explicitly attributed to "Origin Ventures VI".

---

### Fund events

**g1-funds.json is an empty array.** No final close, first close, target announcement, or new-fund announcement
by any of the five managers fell inside 2026-01-01 → 2026-09-04. The nearest events, all outside the window:

| Manager | Fund | Event | Date | Size |
|---|---|---|---|---|
| Origin Ventures | Fund VI | close | 2025-10-07 | $140M |
| Hyde Park Venture Partners | Fund IV | close | 2024-05 | $98M |
| Lightbank | Fund III | announced | 2024-05-24 | $290M |
| Chicago Ventures | Fund III | close | 2021-03 | n/a |
| Hyde Park Angels | — | none found | — | — |

---

### Other Chicago investors discovered

Encountered incidentally while researching group g1 — offered as leads, not verified beyond the noted source:

- **University of Chicago Ventures** — https://www.finsmes.com/2026/03/keycare-raises-27-4m-in-funding.html
  (participated in KeyCare's $27.4M round, 2026-03-03). Easily confused with Chicago Ventures; distinct entity.
- **Jump Capital** (Chicago) — closed a **$350M fund focused on AI and cybersecurity**, reported 2026-07-29 by
  The Business Journals (headline seen in the Google News index; article not opened). Strong candidate for a
  2026 fund-event record in another group.
- **Permanent Capital Ventures** — "closes $200M fund", The Business Journals, 2026-08-27 (headline only;
  Chicago affiliation not confirmed).
- **Buoyant Ventures** (Chicago, climate/digital) — https://www.prnewswire.com/news-releases/hdata-raises-10-million-to-accelerate-energy-sector-data-intelligence-302080103.html (led HData's Series A, 2024).
- **M25** (Chicago, Midwest pre-seed) — https://www.finsmes.com/2026/05/benji-raises-6-25m-in-seed-funding.html
  (participated in Benji's $6.25M seed, 2026-05-19).
- **7wire Ventures** (Chicago, digital health) — https://www.finsmes.com/2026/07/karoo-health-raises-16-2m-in-series-a-funding.html
  (co-led Karoo Health's $16.2M Series A, 2026-07-21).
- **First Trust Capital Partners** (Wheaton, IL) — same Karoo Health source.
- **Harper Court Ventures** and **Skydeck Capital** (both Chicago / Hyde Park orbit) — https://quantumcomputingreport.com/memq-secures-10m-series-a-to-develop-distributed-quantum-networking-hardware/
  (memQ $10M Series A syndicate, 2026-03-31).
- **Illinois Innovation Venture Fund Program** / **Illinois Growth and Innovation Fund** (state LP/co-investor) —
  same memQ source; also an LP in HPVP Fund IV.
- **Vocal Ventures** (Chicago, voice technology) — https://investormatch.pro/vcs/vocal-ventures (directory listing only).
- **Origin Ventures' Chicago peers named in the Fire Awards coverage**, The Business Journals, 2026-08-18
  (headline only, not opened): worth a pass for additional Chicago investor names.

---


# Lane g2 — MATH Venture Partners, Jump Capital, Pritzker Group Venture Capital, Valor Equity Partners

### MATH Venture Partners

URLs opened:
- https://mathventurepartners.com/ (firm site; fetched 2026-09-04) — states verbatim: "MATH Venture Partners is no longer making new investments." Firm raised two funds and will not raise a third. Site has no news/portfolio/blog section; only Investor Portal, Privacy Policy, Terms of Use links. Footer shows "© 2026 MATH Venture Partners" (boilerplate, not a dated news item).

Searches run (WebSearch):
- "MATH Venture Partners" 2026 investment — no 2026 deals; aggregators list last investment as Pie Systems Series A, 2025-11-27 (outside window).
- "MATH Venture Partners" led round 2026 — no 2026 deals; most recent led round reported as Pie Systems, 2025-11-27.
- "MATH Venture Partners" 2026 seed Series A participated — no 2026 deals surfaced; aggregators (Crunchbase, PitchBook, Tracxn, CB Insights, OpenVC, vcsheet, privateequitylist) show 71 total investments, nothing in 2026.

Deals found: none.
Fund events found: none. The firm has explicitly stated it will not raise a third fund.

No 2026 activity found.

Note: searches for "closes fund 2026" / "announces new fund 2026" / prnewswire / businesswire site-restricted queries were not separately run for MATH because the firm's own site affirmatively states it is no longer making new investments and will not raise a third fund — an investor-attested negative that supersedes those queries. Flagging this as a deliberate scope decision, not an omission.

### Jump Capital

URLs opened:
- https://jumpcap.com/news/ — HTTP 403, could not fetch (blocked to automated fetch)
- https://jumpcap.com/insights/jump-capitals-350mm-fund/ — HTTP 403, could not fetch
- https://cryptorank.io/news/feed/jump-capital-lp-raise-2026-07-29 — 2026-07-29, "eighth investment fund worth $350 million, targeting AI-native companies"; cites no original source
- https://www.altassets.net/private-equity-news/jump-capital-announces-close-of-eight-institutional-fund.html — AltAssets, 2026-07-29, confirms Chicago-founded Jump Capital "has concluded its eighth fund"; rest paywalled
- https://www.venturecapitaljournal.com/jump-capital-aims-to-speed-ai-adoption/ — Venture Capital Journal, 2026-07-31, "eighth flagship fund", $350 million, AI "picks and shovels"; tags AI, Cybersecurity, Fundraising, Israel, North America, US
- https://crypto.news/jump-capital-bets-on-enterprise-ai-with-new-350m-fund-viii/ — crypto.news, 2026-08-04, Fund VIII, $350M final close, North America + Israel, initial checks $1-4M and follow-ons $8-15M
- https://en.cryptonomist.ch/2026/07/29/jump-capital-crypto-fund/ — HTTP 403, could not fetch
- https://www.prnewswire.com/news-releases/vinyl-equity-raises-20-million-led-by-jump-capital-as-its-infrastructure-powers-modern-capital-markets-and-corporate-transactions-302795321.html — PR Newswire, 2026-06-09, Vinyl Equity $20M Series A led by Jump Capital
- https://fintech.global/2026/06/10/vinyl-equity-raises-20m-series-a-led-by-jump-capital/ — FinTech Global, 2026-06-10, second source on Vinyl Equity
- https://www.compa.ai/blog/compa-raises-35m-series-b-to-accelerate-ai-for-enterprise-compensation — Compa, 2026-01-26, $35M Series B led by Jump Capital, HQ Newport Beach, CA
- https://www.builtinla.com/articles/compa-raises-35m-series-b-funding-20260126 — Built In LA, 2026-01-26, second source on Compa
- https://www.businesswire.com/news/home/20260126996188/en/Compa-Raises-$35M-Series-B-to-Accelerate-AI-for-Enterprise-Compensation — HTTP 403, could not fetch (wire original)
- https://standardkernel.com/blog/announcing-our-seed-round-is-kernel-generation-solved/ — Standard Kernel, 2026-03-11, $20M seed led by Jump Capital
- https://www.thesaasnews.com/news/standard-kernel-raises-20m-seed-round/ — The SaaS News, 2026-03-11, second source on Standard Kernel; HQ Palo Alto, CA
- https://techfundingnews.com/standard-kernel-raises-20m-to-automate-gpu-optimisation-with-ai/ — HTTP 403, could not fetch
- https://www.finsmes.com/2026/03/standard-kernel-raises-20m-in-seed-funding.html — HTTP 403 (finsmes blocks fetch); search snippet gave HQ as Mountain View, CA
- https://www.finsmes.com/2026/01/compa-raises-35m-in-series-b-funding.html — HTTP 403
- https://www.finsmes.com/2026/09/physical-superintelligence-raises-58m-in-seed-funding.html — HTTP 403
- https://www.finsmes.com/2026/05/judgment-labs-closes-32m-in-seed-and-series-a-funding.html — HTTP 403
- https://finance.yahoo.com/technology/ai/articles/introducing-physical-superintelligence-worlds-most-100200437.html — 2026-09-01, PSI $58M seed led by Breakthrough Energy Ventures
- https://www.hpcwire.com/off-the-wire/physical-superintelligence-raises-58m-to-develop-ai-physics-platform/ — HTTP 403
- https://cryptobriefing.com/openreserve-25m-seed-a16z-crypto/ — Crypto Briefing, 2026-09-03, OpenReserve $25M seed led by a16z crypto
- https://www.theblock.co/news/regulation/2026-09-04-andreessen-horowitz-backed-openreserve-secures-preliminary-occ-approval-for-national-bank-charter-413528 — The Block, 2026-09-04, names Jump Capital as a participant in OpenReserve's $25M seed
- https://techcrunch.com/tag/jump-capital/ — only a 2021 article (Zipmex); no 2026 TechCrunch coverage
- https://www.sec.gov/cgi-bin/browse-edgar?company=jump+capital&type=D — "No matching companies" under that exact name; no Form D located
- https://openreserve.com/ and https://www.openreserve.com — ECONNRESET, could not fetch (domain left blank rather than guessed)

Deals found (2026-01-01..2026-09-04):
- Compa — $35M Series B, 2026-01-26, Jump Capital LED
- Standard Kernel — $20M Seed, 2026-03-11, Jump Capital LED
- Vinyl Equity — $20M Series A, 2026-06-09, Jump Capital LED (Chicago-HQ company)
- OpenReserve — $25M Seed, 2026-09-03, Jump Capital PARTICIPANT (a16z crypto led)

Fund events found:
- Jump Capital Fund VIII — $350M final close, announced 2026-07-29

IMPORTANT CORRECTION / trap avoided: a cluster of sites (valueaddvc.com, fundmomentum.vc, cryptometer.io, pro.edgex.exchange, cryptonews.net, cryptonomist) describe the July 2026 $350M close as Jump Capital's "seventh" fund with a "crypto" focus. That framing is recycled from Jump Capital's genuinely different SEVENTH fund, also $350M, announced 2021-09-14 (CoinDesk, https://www.coindesk.com/business/2021/09/14/jump-capital-raises-350m-venture-fund-with-increased-concentration-on-crypto). The 2026 event is the EIGHTH fund (Fund VIII), AI/infrastructure/cybersecurity focused, per AltAssets and Venture Capital Journal. Only the Fund VIII characterization is recorded.

Excluded candidates:
- Physical Superintelligence, $58M seed, 2026-09-01 (Cambridge, MA) — EXCLUDED. The release names "individual investors from OpenAI, NVIDIA, SoftBank Energy, Oracle, Hugging Face, JUMP Capital, and the a16z Scout Fund." That is individuals employed at Jump Capital, not a Jump Capital fund investment. Verified verbatim wording via Yahoo Finance copy of the release.
- Jump (jump.ai, AI for financial advisors), $80M Series B, 2026-02-19/20 — EXCLUDED. Name collision only; led by Insight Partners, Jump Capital is not an investor.
- TrueFoundry and KGeN — UNVERIFIED LEADS. crypto.news (2026-08-04) references Jump Capital co-founder Sach Chitnis citing "recent AI investments including Compa, Standard Kernel, and TrueFoundry" and CIO Saurabh Sharma commenting on "KGeN's funding." No dated primary source for either was reachable, and no announcement date could be confirmed inside the window. Omitted rather than guessed.

Coverage gap: jumpcap.com (news, insights, portfolio) returns HTTP 403 to automated fetch, so the firm's own 2026 portfolio additions could not be enumerated directly. FinSMES also blocks fetch. The WebSearch budget for this session was exhausted (200/200) before Jump Capital enumeration was complete; fallback search engines (DuckDuckGo, Mojeek) served CAPTCHAs or 403s and Bing returned off-topic results. Jump Capital's 2026 deal list should be treated as a floor, not a complete census.

### Pritzker Group Venture Capital (and Pritzker Vlock / PSP Partners)

URLs opened:
- https://www.pritzkergroup.com/ — homepage only; no news, portfolio, or investments section reachable. Only 2026 reference is the boilerplate footer "© 2026 Pritzker Group."
- https://www.pritzkergroup.com/portfolio — HTTP 404
- https://www.pritzkergroup.com/home , https://www.pritzkergroup.com/sitemap.xml
- https://medium.com/pritzker-group-venture-capital and /about — HTTP 403
- https://techcrunch.com/tag/pritzker-group-venture-capital/ and https://techcrunch.com/?s=Pritzker+Group+Venture+Capital — no 2026 items
- https://techcrunch.com/2026/02/04/snak-venture-partners-raises-50m-fund-to-back-digitizing-marketplaces/ — TechCrunch, 2026-02-04, SNAK Venture Partners $50M debut fund, Pritzker Group anchored as lead LP
- https://www.altassets.net/private-equity-news/by-region/north-america-by-region/united-states-north-america-by-region/former-pritzker-group-execs-seal-50m-debut-snak-venture-partners-fund-close.html — AltAssets, 2026-02-05, "SNAK Venture Partners Fund I," $50M, final close (oversubscribed)
- https://www.linkedin.com/posts/stevencollens_pritzker-group-veterans-raise-50m-venture-activity-7425164699735891968-dZKz — corroborating timing
- https://www.psppartners.com/ , /news , /news-resources/#news-releases , /business-units/venture-capital/ , /our-holdings/ , /success-stories/ — PSP Partners (Penny Pritzker family office); PSP Growth is its venture arm. No 2026-dated deal found. Most recent located item: PassiveLogic $74M with PSP Growth as new investor, 2025-09-18 (outside window).
- https://www.ppcpartners.com/ — Pritzker Private Capital
- https://www.prnewswire.com/search/news/?keyword=Pritzker%20Group%20Venture%20Capital — no 2026 deal releases
- https://www.prnewswire.com/search/news/?keyword=PSP%20Growth — no 2026 deal releases
- https://www.prnewswire.com/search/news/?keyword=Pritzker%20Vlock%20Family%20Office — zero results
- https://builtinchicago.org/?s=Pritzker+Group+Venture+Capital
- https://fortune.com/?s=Pritzker+Group+Venture+Capital
- https://www.pritzkervlockfamilyoffice.com — no content returned
- https://www.chicagobusiness.com/finance-banking/pritzker-group-veterans-raise-50m-venture-capital-fund/ — HTTP 403 (Crain's blocks fetch)
- https://www.chicagobusiness.com/topic/pritzker-group-venture-capital — HTTP 403
- https://www.crunchbase.com/organization/pritzker-group-venture-capital (and /news_and_analysis) — HTTP 403
- https://pitchbook.com/profiles/investor/11253-52 — HTTP 403
- https://www.businesswire.com/portal/site/home/search/?searchTerm=Pritzker%20Group%20Venture%20Capital — HTTP 403
- https://www.finsmes.com/?s=Pritzker+Group+Venture+Capital and /?s=PSP+Growth — HTTP 403
- https://www.axios.com/local/chicago and /search?q=Pritzker%20Group%20Venture%20Capital — HTTP 403
- https://angelinvestorsnetwork.com/alternative-investments/family-office-private-equity-fund-2026-pritzkers-385m-close — see fabrication warning below
- Bing/DuckDuckGo/Google/Startpage fallback query pages (multiple) — CAPTCHA, consent walls, or off-topic results
- https://pipelineroad.com/directory/pritzker-group
- https://www.linkedin.com/company/the-pritzker-group/posts/ — login wall

Deals found (direct Pritzker Group Venture Capital investments into companies, 2026-01-01..2026-09-04): none.
No 2026 activity found.

Fund events found:
- SNAK Venture Partners Fund I — $50M final close, announced 2026-02-04. Pritzker Group Venture Capital's role is ANCHOR LP / lead investor in the fund, NOT the manager. Recorded in g2-funds.json under manager "SNAK Venture Partners" with that distinction spelled out, because it is the only 2026 fund event touching a g2 target investor. SNAK was founded by two ex-PGVC partners (Sonia Nagar, Adam Koopersmith). Other LPs: State of Illinois Growth and Innovation Fund, executives from Favor Delivery and RetailMeNot. Strategy: B2B vertical marketplaces digitizing supply chain and construction; ~20 companies, $1-2M seed checks over 3-4 years. TechCrunch quote from Nagar: "Without Pritzker's support, it would have been quite hard to raise this fund, especially in last year's environment."

PSP Partners / PSP Growth: No 2026 activity found.
Pritzker Vlock Family Office: No 2026 activity found. No independent public website or news footprint could be located; whether the entity is active, dormant, or a naming variant is genuinely unknown.

FABRICATION WARNING — claim rejected, NOT recorded: the aggregator angelinvestorsnetwork.com asserts that "Pritzker Alternative Strategies" closed a $385 million private equity fund in March 2026, citing "Crain's Chicago Business, March 26, 2026." No corroboration exists anywhere; the entity name matches none of the real Pritzker vehicles (Pritzker Group, Pritzker Private Capital, PSP Partners, The Pritzker Organization / 53 Stations). Treated as AI-generated slop and excluded.

Context (outside window, not recorded as 2026 activity): Nagar and Koopersmith's departure from PGVC was reported in August 2024. PGVC continues to operate — TechCrunch's February 2026 piece still describes it as an active firm with managing partner Chris Girgenti. No evidence PGVC has wound down. An aggregator (Tracxn) summary put PGVC's most recent known investment at Ocient, 2025-07-07, which is consistent with finding nothing in 2026 but was not verified against a primary source.

Coverage gap: Crain's Chicago Business, Crunchbase, PitchBook, Business Wire search, FinSMEs, and Axios all return HTTP 403 to automated fetch, and the session's WebSearch budget was exhausted, so fallback search engines (Bing, Google, DuckDuckGo, Startpage) served CAPTCHAs, consent walls, or off-topic results. Bing "no results" outcomes for Pritzker queries are weak negatives. The PGVC 2026 null result is well-supported but not airtight.

### Valor Equity Partners

URLs opened:
- https://www.valorep.com/growth-investments — firm site, growth investments listing
- https://www.valorep.com/news — HTTP 404 (no news page at that path)
- https://www.prnewswire.com/news/valor-equity-partners/ — wire newsroom index
- https://techcrunch.com/tag/valor-equity-partners/ — TechCrunch tag page
- https://techcrunch.com/2026/01/06/xai-says-it-raised-20b-in-series-e-funding/ — TechCrunch, 2026-01-06, xAI $20B Series E; Valor named first in investor list, no lead designated
- https://www.cnbc.com/2026/01/06/elon-musks-xai-raises-20-billion... — HTTP 403
- https://www.apollo.com/insights-news/pressreleases/2026/01/apollo-backs-5-4-billion-valor-and-xai-data-center-compute-infrastructure-transaction-with-3-5-billion-capital-solution-3214463 — Apollo, 2026-01-07, $5.4B Valor Compute Infrastructure L.P. / xAI GPU triple-net-lease, $3.5B Apollo capital solution, NVIDIA anchor LP
- https://www.datacenterdynamics.com/en/news/valor-equity-partners-raises-54bn-to-buy-nvidia-gpus-for-xai/ — HTTP 403
- https://techcrunch.com/2026/01/21/zipline-charts-drone-delivery-expansion-with-600m-in-new-funding/ — TechCrunch, 2026-01-21, Zipline $600M at $7.6B; Valor a participant
- https://techcrunch.com/2026/03/23/zipline-snaps-up-another-200m-to-fuel-its-drone-delivery-expansion/ — TechCrunch, 2026-03-23, +$200M taking the Series H to $800M; Valor still listed
- https://www.zipline.com/about — company site, HQ South San Francisco, CA
- https://www.axios.com/2026/01/21/zipline-drone-delivery-600-million — HTTP 403
- https://www.wsgr.com/en/insights/wilson-sonsini-advises-zipline-... — HTTP 403
- https://dronexl.co/2026/01/20/zipline-reaches-... — HTTP 404
- https://www.finsmes.com/2026/03/zipline-raises-200m... — HTTP 403
- https://siliconangle.com/2026/04/07/data-center-switch-maker-aria-networks-raises-125m/ — SiliconANGLE, 2026-04-07, Aria Networks $125M; Valor among four investors, no lead named
- https://www.unite.ai/loop-raises-95m-series-c-to-expand-its-ai-platform-across-the-supply-chain/ — Unite.AI, 2026-04-17, Loop $95M Series C led by Valor Equity Partners and the Valor Atreides AI Fund
- https://techcrunch.com/2026/04/17/exclusive-loop-raises-95m... — HTTP 404
- https://www.finsmes.com/2026/04/loop-raises-95m-in-series-c-funding.html — HTTP 403
- https://citybiz.co/article/loop-raises-95-million... — HTTP 403
- https://fintech.global/2026/04/29/counterpart-raises-50m-series-c-to-tackle-ai-era-business-risks/ — FinTech Global, 2026-04-29, Counterpart $50M Series C led by Valor
- https://www.theinsurer.com/news/mga-counterpart-raises-50-million... — HTTP 401
- https://www.finsmes.com/2026/04/counterpart-raises-50m... — HTTP 403
- https://techcrunch.com/2026/06/24/valor-equity-partners-looks-to-raise-a-2-5b-fund-vii-per-bloomberg/ — TechCrunch relaying Bloomberg, 2026-06-24, Fund VII targeting $2.5B, still raising
- https://spaceq.ca/dominion-dynamics-closes-139m-series-a-for-arctic-and-space-defence-systems/ — SpaceQ, 2026-06-30, Dominion Dynamics CAD $139M Series A led by Georgian; Valor participated
- https://betakit.com/dominion-dynamics-lands-139-million... — HTTP 404
- https://ventureburn.com/2026/06/dominion-dynamics-raises-139m... — HTTP 403
- https://techcrunch.com/2026/08/06/defense-tech-hadrian-raises-1-37b-at-8b-valuation/ — TechCrunch, 2026-08-06, Hadrian $1.37B Series D at $7.87B; Valor named among the lead investors
- https://www.citybiz.co/article/... Hadrian — HTTP 403
- https://www.therobotreport.com/hadrian-raises-1-37b... — HTTP 404
- https://www.prnewswire.com/news-releases/hadrian-raises-1-37b-series-d... — HTTP 404 (URL guessed, does not exist)
- https://techcrunch.com/2026/08/24/valor-point72-back-general-intuition-at-6b-valuation-as-ai-startup-pushes-into-robotics/ — TechCrunch, 2026-08-24, General Intuition at $6B pre-money; see exclusion below
- https://www.axios.com/2026/08/24/general-intuition-6b-... and /pro/climate-deals/... — HTTP 403
- https://cryptobriefing.com/general-intuition-6b-valuation-valor-point72/ — HTTP 404
- https://pulse2.com/medici-brands-raises-250-million-series-b-led-by-greenoaks-and-valor-equity-partners/ — Pulse 2.0, 2026-09-02, Medici Brands $250M Series B co-led by Greenoaks and Valor
- https://www.prnewswire.com/news-releases/medici-brands-raises-250-million... — HTTP 404 (URL guessed)
- https://news.google.com/rss/search?q=%22Medici+Brands%22+%22250+million%22+Series+B — confirms PR Newswire release 2026-09-02, plus Food Business News 2026-09-03, Inc. 2026-09-02 ($2.25B valuation), TradingView, Athletech News, fb101.com
- https://news.google.com/rss/search?q=Hadrian+%221.37+billion%22+Series+D+Valor — returned zero items
- Additional Google News RSS queries run for: Valor+Zipline, Valor+Loop Series C (empty), Valor+Medici Brands (empty), Valor+Hadrian, Valor+Counterpart, Valor+Aria Networks, Valor+xAI $20B, Dominion Canada defense, Valor+Botanix (empty), Xsight Labs+Valor (empty), "Defend the Dominion"+Valor (empty), Valor Siren Ventures 2026, General Intuition+Point72, Valor+Anduril/Boom/SpaceX/Neuralink 2026, Counterpart HQ, Hadrian HQ, Medici Brands HQ
- https://www.crunchbase.com/organization/valor-equity-partners — HTTP 403
- https://www.chicagobusiness.com/search?q=Valor%20Equity%20Partners — HTTP 403
- https://www.businesswire.com/portal/site/home/search/... — HTTP 403
- https://www.finsmes.com/?s=Valor+Equity+Partners — HTTP 403
- Google / Bing / DuckDuckGo fallback query pages — no results, CAPTCHA, or blocked

Deals found (2026-01-01..2026-09-04) — 8 recorded:
- xAI — $20B Series E, 2026-01-06, participant
- Zipline — $600M Series H at $7.6B, 2026-01-21, participant (+$200M extension 2026-03-23, folded into the same record; Series H total $800M)
- Aria Networks — $125M, 2026-04-07, participant (round letter not stated by the source)
- Loop — $95M Series C, 2026-04-17, co-lead (Valor Equity Partners + Valor Atreides AI Fund)
- Counterpart — $50M Series C, 2026-04-29, lead
- Dominion Dynamics — CAD $139M (~US$100M) Series A, 2026-06-30, participant
- Hadrian — $1.37B Series D at $7.87B, 2026-08-06, co-lead
- Medici Brands — $250M Series B at $2.25B, 2026-09-02, co-lead

Fund events found:
- Valor Compute Infrastructure L.P. (VCI) — $5.4B xAI GPU infrastructure transaction announced 2026-01-07, recorded in g2-funds.json as a Valor-managed vehicle rather than as a deployment, because it is an asset acquisition and triple-net-lease, not an equity venture round
- Valor Equity Partners Fund VII — $2.5B TARGET, reported 2026-06-24, still raising. NOT a close. No close for Fund VII, Valor Siren Ventures, or any other Valor vehicle was found in the window.

Excluded candidates:
- General Intuition, ~$6B pre-money valuation, 2026-08-24 — EXCLUDED as not-yet-closed. Despite the TechCrunch headline framing ("Valor, Point72 back General Intuition"), the body states the amount is not finalized and the round is still in talks. Under the no-rumors rule this is a reported negotiation, not a completed deployment. Valor is described as a new lead investor alongside Point72 Ventures and Seven Seven Six (new) with Khosla Ventures and General Catalyst existing. Company is New York, generalintuition.com. Worth re-checking after it closes; it follows a $320M raise at $2.3B in June 2026.
- CHAOS Industries $510M (2025-11-13), Nirvana $100M Series D (2025-12-18), Crusoe $1.375B Series E (Oct 2025) — all pre-window, excluded.
- Xsight Labs and Botanix Labs — no Valor connection could be substantiated; the Botanix association appears to be a bad database auto-scrape. Dropped.

Evidence-quality caveat specific to Valor: eight of the ten Valor items rest on a single publisher's verified full text, because Axios, CNBC, Bloomberg, FinSMEs, Crunchbase, Business Wire, Crain's, citybiz, TheInsurer and Data Center Dynamics all block automated fetch (401/403) and several TechCrunch/PR Newswire URLs 404'd. Where corroboration exists only as a matching headline in a news aggregator, the record says so and the evidence_class stays single_source rather than being upgraded. Company HQ and domain are left blank for Aria Networks, Loop, Counterpart, Hadrian, Medici Brands and xAI wherever no opened source stated them.

### Other Chicago investors discovered

- SNAK Venture Partners (Chicago) — new seed firm founded by ex-Pritzker Group VC partners Sonia Nagar and Adam Koopersmith; closed a $50M oversubscribed Fund I on 2026-02-04, anchored by Pritzker Group Venture Capital. Seed-stage B2B vertical marketplaces (supply chain, construction), $1-2M initial checks, ~20 companies planned. Named portfolio companies so far include BigRentals and Repackify. The most notable new Chicago venture entity surfaced by this research.
- State of Illinois Growth and Innovation Fund — an LP in SNAK Fund I; a state-backed Illinois LP source rather than a direct venture investor, but relevant to Chicago fund formation.
- PSP Partners / PSP Growth (Chicago) — Penny Pritzker's family office and its venture arm. Confirmed to exist and to have an active venture unit, but no 2026 deal was found in the window (most recent located: PassiveLogic $74M, 2025-09-18).
- Pritzker Private Capital / PPC Partners (Chicago) — surfaced during entity disambiguation; middle-market private equity, not venture. Not researched for deals.
- Jump Trading (Chicago) — Jump Capital's affiliated quantitative trading firm; Jump Crypto (a separate affiliate) participated in Extended's $12.5M strategic round in July 2026. Jump Crypto was NOT treated as Jump Capital in this fragment.
- No new Chicago investors surfaced from the MATH Venture Partners line of research; that firm has stopped making new investments.

Method note: Vinyl Equity (Chicago) is the one Chicago-HQ portfolio company found across all four g2 investors in the window — a Chicago investor backing a Chicago company.

---


# Lane g3 — Energize Capital, S2G Investments, Corazon Capital, OCA Ventures, Sandbox Industries

## Group g3 research notes — Chicago venture investors, 2026-01-01 .. 2026-09-04

Research date: 2026-09-04. Window enforced strictly; anything dated 2025 or earlier is listed
below as EXCLUDED with its real date so it is not re-found later.

Tooling note: the session's WebSearch budget (200 calls) was exhausted partway through. The rest
of the research was done with WebFetch and curl. Working search surfaces once WebSearch was gone:
Bing News (`bing.com/news/search?q=`) and Google News RSS (`news.google.com/rss/search?q=`).
Blocked/unusable: DuckDuckGo (CAPTCHA), Mojeek (CAPTCHA), Brave (JS shell), Bing web search
(quoted-phrase queries silently ignored). Publishers that returned HTTP 403 to the fetcher:
businesswire.com, finsmes.com (readable via curl), coverager.com, citybiz.co, ventureburn.com,
esgnews.com, f4.fund.

---

### S2G Investments (formerly S2G Ventures; incl. S2G Ocean / Builders)

URLs opened:
- https://www.s2ginvestments.com/news (twice: WebFetch + curl scrape of full listing)
- https://www.s2ginvestments.com/news/?_paged=2 (returns page 1 again — pagination is JS-driven)
- https://www.s2ginvestments.com/news/page/2/ (404)
- https://www.s2ginvestments.com/news/s2g-investments-closes-1-billion-solutions-fund-i
- https://www.s2ginvestments.com/insights/welcome-goshe-energy-storage
- https://www.businesswire.com/news/home/20260512836810/en/S2G-Investments-Closes-$1-Billion-Solutions-Fund-I-... (403)
- https://www.agtechnavigator.com/Article/2026/05/13/s2g-closes-1b-fund-... (301 → agnavigator.com)
- https://www.agnavigator.com/Article/2026/05/13/s2g-closes-1b-fund-as-investors-double-down-on-food-and-energy-resilience/
- https://inchargeus.com/incharge-energy-raises-46m-to-scale-energy-solutions-platform-across-north-america/
- https://mercomcapital.com/incharge-energy-raises-46-million-led-by-s2g-investments/
- https://www.hatch.blue/news/kuehnle-agrosystems-secures-series-b-to-accelerate-commercial-production-of-sustainable-natural-astaxanthin
- https://www.bing.com/news/search?q=%22S2G+Investments%22+led+round
- https://www.bing.com/news/search?q=%22S2G+Investments%22+investment+2026

#### SPECIAL TASK — "Solutions Fund I closed at ~$1B around 2026-05-12"
**CONFIRMED, and the details are exact, not approximate.**
- Primary release: S2G's own newsroom, dated **12 May 2026**, "S2G Investments Closes $1 Billion
  Solutions Fund I to Scale Growth-Stage Companies Across Food & Agriculture, Energy, and Oceans."
- Event type: **final close**. Size: **$1,000,000,000**.
- Strategy: growth-stage, the "missing middle" — companies past proof-of-concept risk that need
  scale-up capital; food & agriculture, energy, oceans; primarily North America and Europe;
  $25–100M checks (per AgTechNavigator).
- Independent outlet confirmation: AgTechNavigator/AgNavigator, 13 May 2026 (read in full).
  Also indexed: Chicago Business Journal (2026-05-12) and WSJ Pro (2026-05-12), both surfaced via
  Bing News and listed on S2G's own news index; neither opened directly.
- Business Wire is the wire original (release ID 20260512836810 encodes 2026-05-12); the URL
  returns 403 to the fetcher, so it is recorded as a wire source, not as one of the two
  independent publishers.
- Context from the release: LPs are pension funds, funds of funds and family offices across
  North America, Europe, Asia and Australia; ~$300M already deployed across ten investments
  (Exacto, Echandia, ANA Inc., Urbint — Urbint being the fund's first exit, acquired by Itron).
- One nuance worth flagging: AgNavigator's article is dated 13 May, one day after the release.
  The announcement date is 12 May 2026.

#### 2026 deals found
1. **Goshe Energy Storage** — 2026-05-28 — up to **$40M** strategic HoldCo **debt** facility from
   S2G's Special Opportunities team. Not an equity venture round. Announced together with Goshe's
   first ERCOT 100 MW asset going live. Goshe HQ not stated anywhere I could read.
2. **InCharge Energy** (Los Angeles) — 2026-06-04 — **$46M** strategic investment **led by S2G**,
   with QIC participating (per Mercom, 2026-06-09). No Series letter disclosed.
3. **Kuehnle AgroSystems** (Honolulu) — 2026-07-08 — **Series B**, multi-million, amount never
   disclosed. Led by IVC; **S2G participated** as an existing investor alongside Hatch Blue and
   new investor Dest EOOD.

#### Checked and rejected
- **TechMet €14.4M Ukraine investment** (Irish Business News, 2026-04-18, linked from S2G's news
  feed): no source names S2G as an investor in that round. Excluded.
- **Noveria Energy / TenneT Germany grid deal** (2026-04-23), **Brightseed Hummingbird launch**
  (2026-05-13), **XOCEAN AWS profile** (2026-05-15), **Trime/ANA European sales agreement**
  (2026-05-12), **Flashfood Kroger expansion** (2026-04-08), **Sofar Ocean USV** (2026-04-16),
  **GreenLight Biosciences EU authorization** (2026-05-06): portfolio-company product/commercial
  news carried on S2G's news feed, not financings. Excluded.
- **Echandia SEK 325M financing from S2G** — dated **2025-06-24**. EXCLUDED (before window).
- S2G's news index is JS-paginated (24 pages) and I could not reach pages 2+, so
  **January–March 2026 S2G portfolio news is not fully enumerated**. Bing News and Google News
  turned up no S2G financing announcements in that quarter, but this is the one real coverage gap
  in this group.

---

### Energize Capital

URLs opened:
- https://www.energizecap.com/news
- https://energizecap.com/insights
- https://energizecap.com/insights/announcing-ventures-fund-iii
- https://energizecap.com/insights/why-we-invested-in-5
- https://esgnews.com/energize-capital-closes-430-million-fund-to-scale-digital-climate-solutions/ (403)
- https://www.finsmes.com/2026/03/halcyon-raises-21m-in-series-a-funding.html (via curl)
- https://www.coverager.com/halcyon-raises-21-million/ (403 / Cloudflare)
- https://halcyon.io/blog ; https://halcyon.io/news (404)
- https://www.axle.energy/blog/announcing-our-series-a
- https://www.finsmes.com/2026/07/axle-energy-raises-25m-in-series-a-funding.html (403 via WebFetch)
- https://siliconangle.com/2026/07/14/instalily-developer-ai-teammates-can-automate-complex-business-specific-work-raises-60m/
- https://venturebeat.com/business/emerald-ai-raises-150-million-series-a-at-105-billion-valuation-to-scale-power-flexible-ai-data-centers
- https://www.bing.com/news/search?q=%22Energize+Capital%22
- https://news.google.com/rss/search?q=%22Energize+Capital%22+when:250d
- https://news.google.com/rss/search?q=Halcyon+%22Energize+Capital%22+Series+A

#### 2026 deals found
1. **Halcyon** (San Francisco) — 2026-03-16 — **$21M Series A, led by Energize Capital**, with
   Zero Infinity Partners, Congruent Ventures, Obvious Ventures and Sabanci Climate Ventures.
   AI platform for energy regulatory/market intelligence; CEO Bruce Falck. Only FinSMEs could be
   read in full; Coverager (2026-03-24) and Axios ("Energy data startup Halcyon raises $21M
   Series A", 2026-03-16) were blocked/paywalled → recorded as single_source.
   This deal does **not** appear on Energize's public insights feed.
2. **Axle Energy** (London) — 2026-07-08 — **$25M Series A, led by Energize Capital**, with
   existing investors Accel, Picus Capital and Eka. ~300k connected devices / >2GW flexible
   capacity. (Reported elsewhere as €21M / £18.7M; FinSMEs and Lewis Silkin dated it 2026-07-10 —
   the company's own post and Energize's insight are both 2026-07-08.)
3. **InstaLILY AI** — 2026-07-14 — **$60M Series B, led by Energize Capital**, with Insight
   Partners increasing, plus Home Depot Ventures and United Rentals. Brings total to ~$100M.
   HQ not confirmed in any source read → left null.
4. **Emerald AI** (Washington, DC) — 2026-08-25 — **$150M Series A at a $1.05B valuation,
   co-led by Energize Capital and DCVC**. Oversubscribed; 12 Fortune Global 500 participants
   including NVIDIA, Samsung Ventures, Siemens, GE Vernova, Salesforce Ventures, Aramco Ventures,
   RWE, In-Q-Tel, Radical Ventures, Energy Impact Partners, Lowercarbon Capital.

#### Checked and rejected
- **Energize Ventures Fund III, $430M** — the announcement page is dated **2025-06-03**.
  EXCLUDED (before window). Several aggregator snippets wrongly re-date this to June 2026; the
  primary page does not support that. No new Energize fund close falls inside the window.
- **"Why We Invested in 5"** (Energy by 5, Irving TX) — page dated **2025-05-13**. EXCLUDED.
- **Engenuus Energy, 2026-04-07** — this was an **acquisition by 5**, an Energize portfolio
  company, not an Energize deployment. Aggregators (Tracxn) mislabel it as Energize's latest
  investment. EXCLUDED.
- **DroneDeploy acquired by Procore for $845M** (Energize blog, 2026-07-29) — an **exit**, not a
  deployment; out of scope for the deployments file but real and in-window.
- **Tyba, Archive, Nira Energy** — named in the June 2025 Fund III post as already-deployed
  Fund III investments. EXCLUDED (2025 or earlier).

---

### Corazon Capital

URLs opened:
- https://www.corazon.vc/ (DNS does not resolve — the firm's domain is corazon.com)
- https://www.corazon.com/update
- https://pulse2.com/corazon-capital-100-million-fund-iv-raised-to-back-ai-native-consumer-companies/
- https://www.prnewswire.com/search/news/?keyword=Corazon%20Capital
- https://www.prnewswire.com/news-releases/boldvoice-raises-21m-series-a-to-give-a-billion-non-native-english-speakers-their-own-ai-voice-coach-302671777.html
- https://techcrunch.com/2026/07/15/rime-picks-up-24m-series-a-to-help-enterprises-field-customer-calls/
- https://pulse2.com/rime-raises-24-million-series-a-to-build-enterprise-ready-speech-to-speech-ai-models/
- https://www.citybiz.co/article/rime-raises-24-million-series-a-to-expand-enterprise-voice-ai-platform/ (403)
- https://www.rime.ai/blog/series-a (404)
- https://www.boldvoice.com/blog
- https://news.google.com/rss/search?q=%22Corazon+Capital%22+when:250d
- https://news.google.com/rss/search?q=Rime+%22Series+A%22+speech+%22Corazon%22
- https://www.bing.com/news/search?q=Rime+%2424+million+Series+A+Corazon+Capital
- https://www.bing.com/news/search?q=%22Corazon+Capital%22+2026

#### 2026 deals found
1. **BoldVoice** (New York) — 2026-01-28 — **$21M Series A**, led by Matrix Partners;
   **Corazon Capital participated** alongside Flybridge, Xfund, Liquid 2, Alumni Ventures,
   Umami Capital and Y Combinator. Only the company's PR Newswire release names Corazon →
   single_source.
2. **Rime** (San Francisco) — 2026-07-15 — **$24M Series A**, led by M13; **Corazon Capital
   participated** with Twilio Ventures, Unusual Ventures and other existing investors.
   Confirmed by both TechCrunch and Pulse 2.0.

#### Fund
- **Fund IV, $100M final close, 2026-03-31** — pre-seed/seed/Series A, AI-native emphasis.
  Announced with partner promotions (Greg Johnston, Smriti Jayaraman) and Alison Stillman
  (ex-Serena Ventures) joining as partner.

#### Checked and rejected
- **Kinspire $3.6M seed** (Corazon co-led) — **2023**. EXCLUDED.
- **Noble Mobile $10.3M seed, led by Corazon** — **September 2025**. EXCLUDED. (A Corazon
  LinkedIn post about it recirculated in 2026, which is what surfaced it.)
- **AllFly** (Orlando, Lightbank-led, Corazon-backed) — PR Newswire release **2025-11-05**, and it
  is a product launch, not a financing. EXCLUDED.
- **Tandem $3.7M seed** — March 2024. EXCLUDED.
- **Laws of Motion seed** — no in-window date could be established; not recorded.
- **Insider One acquires Bluecore** (AlleyWatch, 2026-05-14) — an M&A/exit touching a Corazon
  portfolio name, not a deployment.

---

### OCA Ventures

URLs opened:
- https://www.ocaventures.com/
- https://www.ocaventures.com/news (404)
- https://www.ocaventures.com/news/ (404)
- https://f4.fund/firms/oca-ventures/activity (403)
- https://news.google.com/rss/search?q=%22OCA+Ventures%22
- https://www.bing.com/news/search?q=%22OCA+Ventures%22
- https://www.bing.com/search?q=%22OCA+Ventures%22+led+seed+Series+A+2026+startup+raises
- https://html.duckduckgo.com/html/?q=%22OCA+Ventures%22+2026+funding+round+led (CAPTCHA)

**No 2026 activity found.**

The firm's site has News and Portfolio links in its navigation but no reachable, dated news
listing (both /news and /news/ 404 to the fetcher). Google News' full archive for the exact phrase
"OCA Ventures" returns nothing after 2025; the most recent items are Ocient's CEO appointment
(2025-06-17) and a 2025-12-19 Chicago VC listicle. Bing News returns a single 2021 hiring release.

#### Checked and rejected
- **Ocient $49.4M**, led by Greycroft and OCA Ventures — **2024-03-11** (Series B extension).
  EXCLUDED. Several 2026-refreshed aggregator profiles present this as current; it is not.
- **Resolv $500K pre-seed, January 2026** — appears only in a Tracxn profile snippet. No primary
  release, company page, or outlet coverage could be found to corroborate it, and the WebSearch
  budget was exhausted before it could be chased further. NOT recorded — unverified.

---

### Sandbox Industries

(Explicitly the Chicago firm behind Blue Venture Fund and Sandbox Insurtech Ventures.
**SandboxAQ is a different company and was excluded throughout.**)

URLs opened:
- https://www.sandboxindustries.com/
- https://news.google.com/rss/search?q=%22Sandbox+Industries%22
- https://www.bing.com/news/search?q=%22Sandbox+Industries%22
- https://www.bing.com/news/search?q=%22Sandbox+Insurtech+Ventures%22+OR+%22Blue+Venture+Fund%22+2026
- https://www.bing.com/search?q=%22Sandbox+Industries%22+2026+fund+investment+insurance+healthcare

**No 2026 activity found.**

The site has no news, blog, or portfolio-listing page at all — only Blue Venture Funds, Insurance,
Consulting, People and Contact sections, none dated. Google News' archive for the exact phrase
returns nothing in 2026 except two Crain's Chicago Business people-profile pages
(chicagobusiness.com "Nick Rosa, 59" and "Nina Nashif, 38", re-dated 2026-02-28 / 2026-03-01)
which are evergreen bio pages, not deals. Bing News returns only 2012–2021 items.

---

### Other Chicago investors discovered

Surfaced incidentally during this research; none verified beyond a single mention, listed as
leads only:

- **Buoyant Ventures** (Chicago) — climate/digital VC; named as a participant in Ocient's 2024
  round. No in-window 2026 deal seen.
- **Levy Family Partners** (Chicago) — family office; Ocient 2024 participant.
- **Riverwalk Capital** (Chicago) — Ocient 2024 participant.
- **Wolf Capital Management** (Chicago) — Ocient 2024 participant.
- **Lightbank** (Chicago) — led AllFly's round (2025-11-05 PR Newswire release).
- **Victorum Capital** (Chicago-linked) — named alongside Lightbank and Corazon as an AllFly backer.
- **Invenergy** — appears as the historical origin of Energize Capital's Crunchbase entity
  ("Invenergy Future Fund"); Chicago-based energy developer, relevant as an LP/strategic lineage
  rather than as a distinct VC.
- **Ocient** (Chicago) — portfolio company, not an investor; noted here only because its 2024
  round is the deal most often misdated into 2026 by aggregators.

---


# Lane g4 — 7wire Ventures, Cleveland Avenue, M25, TechNexus, Moderne Ventures

## Group g4 research notes — Chicago venture investors

**Window enforced:** 2026-01-01 through 2026-09-04. Research date: 2026-09-04.

**Method / limits:**
- All findings come from live WebSearch + WebFetch. Nothing was answered from memory.
- The session's WebSearch budget (200 calls) was exhausted partway through. From that point on, only WebFetch was available, so second-source hunting for the last few items (Letter AI, Benji, Cleveland Avenue) is thinner than intended. This is called out per item below.
- Several data providers block automated fetching with HTTP 403: Crunchbase, PitchBook, CB Insights, Tracxn, FinSMEs, Fierce Healthcare, citybiz, Chicago Defender, f4.fund, startupfundraising.com, and 7wireventures.com's own /news/ pages. Where a claim rests only on those, evidence_class is `single_source` and the note says so.
- Medium-hosted `blog.midweststartups.com` returned no output on repeated fetches.

---

### 7wire Ventures

**URLs opened:**
- https://www.7wireventures.com/news/ — HTTP 403 (blocked; could not enumerate their news index)
- https://www.7wireventures.com/news/why-we-invested-in-when/ — HTTP 403
- https://www.prnewswire.com/news-releases/karoo-health-announces-oversubscribed-16-2-million-series-a-co-led-by-7wire-ventures-and-allumia-ventures-302830121.html — fetched OK
- https://hitconsultant.net/2026/07/23/karoo-health-raises-16m-series-a-cardiovascular-operating-system/ — fetched OK
- https://www.fiercehealthcare.com/ai-and-machine-learning/karoo-health-banks-162m-series-continue-ai-native-cardiovascular-care — HTTP 403
- https://www.brokertechventures.com/post/when-raises-10m-series-a-to-transform-employee-health-benefits-during-critical-moments — fetched OK
- https://www.citybiz.co/article/800422/when-raises-10m-series-a-to-transform-employee-health-benefits-during-critical-moments/ — HTTP 403
- https://www.finsmes.com/2026/02/when-raises-10-2m-in-series-a-funding.html — HTTP 403 (seen in search results)
- https://www.axios.com/pro/health-tech-deals/2026/01/30/when-10m-benefits-transitions-self-insured — seen in search results (paywalled Axios Pro)

**Searches run:** `"7wire Ventures" 2026 investment round`; `"When" workforce transitions healthcare "Series A" $10.2 million 7wire 2026`; `Karoo Health funding round 2026 7wire Ventures`; `"7wire Ventures" led OR "co-led" Series 2026 announces`; `"7wire" Ventures participated seed round digital health 2026 announced funding`; `"7wire Ventures" new fund close 2026`

**Deals found (2 in window):**
1. **When** — $10.2M Series A, announced 2026-01-30. 7wire **co-led** with ManchesterStory. When is itself Chicago-based (forwhen.com). Also in: Mairs & Power VC (new), B Capital, Enfield Capital Partners, TTV Capital, Alumni Ventures. Two independent publishers → `two_sources`.
2. **Karoo Health** — $16.2M Series A, announced 2026-07-21, Albuquerque NM. 7wire **co-led** with Allumia Ventures; First Trust Capital Partners, SpringRock Ventures, Hyde Park Angels participated. Lee Shapiro (7wire) joined the board. Wire + independent outlet → `two_sources`.

**Fund activity:** No 2026 fund event. The most recent 7wire vehicle found is the $217M Growth & Opportunity ("GO") Fund, closed **October 2023**, which brought AUM past $500M. Also a $150M Connected Consumer Health Fund, older. Nothing in the 2026 window.

**Unresolved lead:** A search snippet referenced 7wire being "added as a new investor to a Series B round for an AI Life Sciences company affiliated with Access Industries." No company name, date, amount or fetchable URL was obtainable, and the search budget ran out before it could be chased. **Not recorded** — insufficient to name a company or date.

---

### Cleveland Avenue (Cleveland Avenue LLC / CAST US)

**URLs opened:**
- https://www.clevelandavenue.com/ — fetched OK. No news section, no dated announcements, no CAST US mention on the homepage. Copyright reads "© Copyright 2026 Cleveland Avenue, LLC" (a footer year, not news).
- https://www.clevelandavenue.com/portfolio — fetched OK. Full portfolio list retrieved (~90 companies across Food & Beverage, Restaurant/Food Tech, Consumer, Software Services, AgriTech, Robotics/AI, Commercial Services, LOHAS). **No dates on any entry**, so 2026 additions cannot be identified from the firm's own site. Exits shown: Better Foods (May 2025), Beyond Meat (May 2019), Craftable (July 2023). "Sustainable Beverage Technologies" (BrewVo) is listed as a current portfolio company.
- https://www.castus.page/ and https://castus.page/ — DNS does not resolve (ENOTFOUND). The CAST US site appears to be dead or moved.
- https://chicagodefender.com/cleveland-avenue-announces-70-million-cast-us-initiative-for-minority-entrepreneurs/ — HTTP 403
- https://f4.fund/firms/cleveland-avenue/activity — HTTP 403
- https://pitchbook.com/profiles/company/155321-92 (BrewVo) — HTTP 403
- https://startupfundraising.com/founders/alex-dhillon-outtake — HTTP 403
- https://www.vcsheet.com/fund/cleveland-avenue — fetched OK. Describes CAST US as a **$70M fund** with mandates of 75% Black/Hispanic-owned, 75% Chicago South/West Sides, 50% women-founded F&B; sectors Food & Ag, CPG/D2C, Retail Tech, Robotics, AI; led by Don Thompson (former McDonald's CEO). **No date given** — this fund predates the window and is not a 2026 event.
- https://techcrunch.com/2026/01/28/ai-security-startup-outtake-raises-40m-from-iconiq-satya-nadella-bill-ackman-and-other-big-names/ — fetched OK
- https://venturebeat.com/business/outtake-raises-40m-series-b-led-by-iconiq-to-build-the-unified-platform-for-digital-trust-in-the-ai-era — fetched OK

**Searches run:** `"Cleveland Avenue" LLC investment 2026 funding round Chicago`; `Outtake "Series B" January 2026 Cleveland Avenue`; `BrewVo funding Cleveland Avenue March 2026`

**Deals found (2 candidates, both weakly evidenced):**
1. **Outtake** — $40M Series B, 2026-01-28, New York. The round is well documented. **Cleveland Avenue's participation is NOT.** I fetched both TechCrunch and the VentureBeat/press-release version in full and confirmed neither names Cleveland Avenue; they name lead ICONIQ plus CRV, S32 and eight named angels. Only aggregator databases (CB Insights, Crunchbase, Tracxn) list Cleveland Avenue as a backer. Recorded as `single_source` with an explicit warning. **Do not upgrade without a source that names the firm.**
2. **BrewVo / Sustainable Beverage Technologies** — reported $1.25M Series E-II led by Cleveland Avenue on 2026-03-16. PitchBook/Tracxn only; both blocked on direct fetch, so this rests on a search-engine extract. No press release, wire item or article found. Recorded as `single_source`; treat as unconfirmed.

**Fund activity:** No 2026 fund event found. CAST US ($70M) exists but has no 2026 date attached in any fetchable source, and its own website no longer resolves.

**Assessment:** Cleveland Avenue publishes no dated news at all, which makes independent verification of its activity unusually hard. Both 2026 candidates should be treated as leads, not confirmed deals.

---

### M25 (M25 VC, Chicago)

This was the richest investor in the group, as expected. Their blog is the authoritative enumeration.

**URLs opened:**
- https://www.m25vc.com/portfolio — fetched OK. 80+ companies listed with active/inactive/exit status but **no dates**, so it cannot be used to date 2026 additions. Newer names visible: Immigify, Stock, Promota AI, Swept AI, Supercrew, Quiver Quantitative.
- https://www.m25vc.com/ — fetched OK. No fund or news info; "150+ portfolio companies," "most active investor in the region." Copyright "© M25 2015-2026."
- https://www.m25vc.com/blog — fetched OK. **This is the key page.** Complete 2026 post list retrieved:
  - Why We Invested in Immigify — 2026-07-07
  - Why We Invested in Oath — 2026-05-28
  - Why We Invested in Stock — 2026-05-12
  - Why We Invested in OneDose — 2026-03-05
  - Why We Invested in Entravia — 2026-02-04
  (Prior post: 2025: M25 Year in Review — 2025-12-18. So the five above are the complete set of M25-announced 2026 investments as of 2026-09-04.)
- https://www.m25vc.com/blog/why-we-invested-in-immigify — fetched OK
- https://www.m25vc.com/blog/why-we-invested-in-oath — fetched OK
- https://www.m25vc.com/blog/why-we-invested-in-stock — fetched OK
- https://www.m25vc.com/blog/why-we-invested-in-onedose — fetched OK
- https://www.m25vc.com/blog/why-we-invested-in-entravia — fetched OK
- https://siliconprairienews.com/2026/07/ai-powered-startup-immigify-finds-home-in-nebraska-to-help-others-navigate-u-s-immigration/ — fetched OK
- https://www.nextinthenorth.com/p/entravia-launches-infrastructure-platform-powering-peo-broker-sales — fetched OK
- https://www.nextinthenorth.com/p/how-entravia-raised-2-6m-in-its-first-year — fetched OK
- https://myonedose.com/onedose-secures-funding-to-enhance-emergency-care-platform/ — fetched OK
- https://www.jems.com/industry-news/onedose-secures-funding-to-enhance-emergency-care-platform/ — fetched OK
- https://www.accountingtoday.com/news/aicpa-weighs-pe-and-tech-impact-on-audit-independence-rules — fetched OK (2026-08-31)
- https://blog.midweststartups.com/stocks-supply-chain-platform-is-tackling-billions-in-retail-waste-3a4eeb9a9fb0 (and ?gi= variant) — no output returned on two attempts
- https://www.start-midwest.com/news/midwest-startup-funding-for-the-week-ending-august-21-2026 — fetched OK; no M25 deals that week

**Searches run:** `M25 VC Chicago led seed round 2026`; `"M25" led seed round 2026 Midwest startup announces funding`; `Entravia funding round M25 2026`; `"Stock" stockitbetter pre-seed M25 2026 Chicago inventory`; `Immigify pre-seed funding M25 Omaha 2026`; `"Oath" oathverified funding M25 Chicago 2026`; `OneDose myonedose funding round 2026 EMS Minneapolis M25`

**Deals found (6 records, 5 companies):**
1. **Entravia** — $550K pre-seed **led by M25**, 2026-02-04, Minneapolis (entravia.co). With Cambrian Ventures. `two_sources`.
2. **Entravia (second round)** — $2.05M seed led by Matchstick Ventures, M25 **participant**. Reported 2026-07-29; the exact close/announce date is not stated anywhere, so date_announced is an upper bound. `single_source`.
3. **OneDose** — round **led by M25** with CoFound Partners, 2026-03-05, Minneapolis (myonedose.com). **Amount and round stage were deliberately undisclosed** by the company, M25 and JEMS — recorded as null rather than guessed. `two_sources`.
4. **Stock** — $1.5M pre-seed **led by M25**, 2026-05-12, Chicago (stockitbetter.com). With StoryTime Capital, Mighty Capital, LongJump, IU Ventures. M25's post confirms the investment but gives no amount; the amount comes from a Midwest Startups article that could not be fetched directly. `two_sources` with caveat.
5. **Oath / Oath Verified** — $6.6M seed led by Rackhouse Capital, M25 **participant**, Chicago (oathverified.com). **Window caveat:** M25 announced it 2026-05-28, but Accounting Today (2026-08-31) says the round was raised "last December," i.e. December 2025 — outside the window. Kept with date_announced 2026-05-28 and flagged for dedup. `two_sources`.
6. **Immigify** — $1.015M pre-seed **led by M25**, 2026-07-01, Omaha NE (immigify.com). With Invest Nebraska, Nelnet, NMotion, angel Kevin Pope. `two_sources`. **Discrepancy noted:** some Nigerian outlets (guardian.ng, thisdaylive.com) describe the round as "led by Gener8tor"; Silicon Prairie News and M25's own post both put M25 as lead.

**Unresolved lead — Benji:** A search result stated "Benji announced $6.25 million in new funding in May 2026, with backing from Preface Ventures and M25" (a loyalty-programme API, "Plaid of loyalty programmes"). No URL was returned for it, M25 published no blog post about it, and the WebSearch budget was exhausted before it could be chased. **Not recorded in the JSON** — no verifiable source, no confirmed date. This is the single most likely missing M25 deal and is worth one follow-up search.

**Fund activity:** No 2026 fund event found. M25's own site shows no fund page. Their most recent publicly announced fund on m25vc.com is Fund III at $31.8M (older). PitchBook shows an "M25 Fund IV" profile but the page is blocked (403) and no announcement, close date or size could be verified. **Not recorded.**

---

### TechNexus Venture Collaborative

**URLs opened:**
- https://technexus.com/news/ and https://www.technexus.com/news/ — fetched OK. Full 50-headline index with URLs retrieved (dates are not exposed on the index page, so each candidate article had to be opened individually).
- https://www.technexus.com/doubling-down-on-active-intelligence-why-we-invested-in-letter-ais-40m-series-b/ — fetched OK, 2026-02-26
- https://www.technexus.com/fedex-thor-lead-160m-series-c-investment-in-harbinger/ — fetched OK, **2025-11-13 → OUT OF WINDOW**
- https://www.technexus.com/revoy-raises-27m-to-turn-diesel-freight-trucks-electric/ — fetched OK, 2026-08-06
- https://www.technexus.com/exelon-invests-in-natrion-s-battery-performance-tech/ — fetched OK, 2026-05-28
- https://www.technexus.com/critical-infrastructure-has-a-security-problem-solitude-labs-has-a-fix/ — fetched OK, 2026-09-03. **Not an investment announcement** — a feature story about Solitude Labs (UChicago New Venture Challenge / Grainger Engineering Challenge third place) that only notes the company has access to TeamWorking by TechNexus, the firm's shared workspace. No round, amount or investment disclosed. Not recorded.
- https://www.technexus.com/introducing-prime-x-technexus-s-ai-enabled-portfolio-intelligence-product/ — fetched OK. Product launch (internal portfolio-intelligence tool), **no date exposed** (datePublished empty), no capital raised. Not recorded.
- https://www.technexus.com/technexus-venture-collaborative-launches-secondwave-to-unlock-value-in-corporate-venture-portfolios/ — fetched OK, 2026-07-30. See funds file.

**Searches run:** `"TechNexus" Venture Collaborative 2026 investment funding round`; `Natrion funding round 2026 TechNexus battery`

**Deals found (3 records, only 1 a confirmed new participation):**
1. **Letter AI** — $40M Series B, 2026-02-26, Chicago. TechNexus **participant** (their post is literally titled "Why we invested"). Lead Battery Ventures; also Y Combinator, Lightbank, Stage 2 Capital, Northwestern Mutual Future Ventures. `investor_attested` — no independent second publisher found before the search budget ran out.
2. **Natrion** — Exelon Foundation (2c2i) strategic equity investment announced 2026-05-28, amount undisclosed. TechNexus is listed among core investors but the post does **not** say TechNexus put new money in. Role recorded as `unknown`. Note: Tracxn claims a TechNexus investment in Natrion on 2026-04-14 ("Unattributed VC - II"); no fetchable source corroborates it and it is **not** recorded. TechNexus's actual Natrion lead was the $2M seed in **2022** (out of window).
3. **Revoy** — $27M Series A, 2026-08-06, San Francisco. TechNexus describes itself only as an "early backer" from 2022 and is **not** listed among this round's participants (lead Standard Capital; also Y Combinator, Doerr Capital, Leap Ventures). Role recorded as `unknown`.

**Fund activity:** No fund close or new fund. **SecondWave** (2026-07-30) is recorded in the funds file with a heavy caveat — it is explicitly a portfolio-management *service* that "leverages TechNexus's existing infrastructure rather than deploying new capital," not a committed pool. Firm-level context given: $300M+ across 250+ venture investments.

**Also seen on the index, in or near window but not investments:** Harbinger + In-Q-Tel backing; Harbinger/American Rheinmetall partnership; Harbinger electric work truck launch + autonomous driving acquisition; Losant acquired by SUSE; LANDR acquires Reason Studios; Lightship production capacity. These are portfolio operating news / M&A, not TechNexus deployments, and dates were not individually verified.

---

### Moderne Ventures

**URLs opened:**
- https://www.moderneventures.com/news-insights — fetched OK (twice). Full headline+URL list retrieved.
- https://www.moderneventures.com/news-insights/moderne-invests-in-orbital-ai-platform---60m-series-b-funding-round — fetched OK, 2026-01-26
- https://www.moderneventures.com/news-insights/moderne-invests-in-mesh-series-c-company-reaches-1b-valuation — fetched OK, 2026-01-27
- https://www.moderneventures.com/news-insights/moderne-ventures-raises-230-million-venture-fund — fetched OK, **2024-09-19 → OUT OF WINDOW** (Fund III, $230M, final close; follows a $43M debut in 2015 and a $200M fund in 2021; ~40% strategic corporate LPs, GCM Grosvenor a new institutional backer)
- https://www.prnewswire.com/news-releases/moderne-ventures-announces-eight-new-companies-selected-to-join-its-exclusive-moderne-passport-industry-immersion-program-302753301.html — fetched OK, 2026-04-28
- https://www.prnewswire.com/news-releases/sigma360-secures-17mm-series-b-to-scale-ai-powered-financial-crime-prevention-and-compliance-302709482.html — fetched OK, 2026-03-10
- https://www.amlintelligence.com/2026/03/news-sigma360-raises-17m-to-scale-ai-powered-financial-crime-prevention-tech/ — fetched OK, 2026-03-11
- https://commercialobserver.com/2026/01/real-estate-law-orbital-series-b/, https://www.lawnext.com/2026/01/orbital-raises-60m-series-b-..., https://tech.eu/2026/01/26/orbital-raises-60m-series-b-... — seen in search results, all dated 2026-01-26
- https://fintech.global/2026/01/28/mesh-raises-75m-at-1bn-valuation-to-unify-digital-asset-payments/ — seen in search results, 2026-01-28
- https://pitchbook.com/profiles/company/622402-66 (3V Infrastructure) — not fetched (PitchBook blocked)

**Searches run:** `"Moderne Ventures" 2026 investment funding round`; `Sigma360 Series B $17.3M Moderne Ventures`; `Orbital "Series B" $60 million Moderne Ventures 2026`; `"Moderne Ventures" Mesh Series C 2026 valuation`; `"3V Infrastructure" funding Moderne Ventures 2026`

**Deals found (3 in window):**
1. **Orbital** — $60M Series B, 2026-01-26, London (orbital.tech). Moderne **participant**. Led by Brighton Park Capital; also REV (RELX/LexisNexis), The LegalTech Fund, Grosvenor Group; existing JLL Spark, Outward, Seedcamp. Total to $75M. `two_sources` (Moderne + 3 independent outlets).
2. **Mesh** — $75M Series C at $1B valuation, 2026-01-27/28 (meshpay.com). Moderne **participant**. Led by Dragonfly Capital; also Paradigm, Coinbase Ventures, SBI Investment, Liberty City Ventures. `two_sources`.
3. **Sigma360** — $17.3M Series B, 2026-03-10, New York (sigma360.com). Moderne **LED**. With Vocap Partners, Orrick, Contour Ventures, Mosaik Partners. Moderne partner Liza Benson quoted. `two_sources`.

**Explicitly NOT counted as investments — the Spring 2026 Passport class (announced 2026-04-28):** Chateauz (San Diego), Darcy Solutions (New Brighton MN), Geolava (San Francisco), Hologram Media Network (Cary NC), Sigma360 (New York), Orbital (New York), On3.ai (Madison WI), 3V Infrastructure (New York). I fetched the release in full: Passport is a **six-month industry-immersion program** offering education and networking, and the release does not state that Moderne took equity in any of these eight. Several aggregators (Crunchbase, Tracxn) report a Moderne "investment" in **3V Infrastructure dated 2026-04-28** — that date is exactly the Passport announcement date, which strongly suggests the databases mis-classified program selection as an investment. **3V Infrastructure is therefore NOT recorded as a deployment.** Sigma360 and Orbital are recorded, but on the strength of their own separately-announced rounds, not their Passport membership.

**Fund activity:** No 2026 fund event. Fund III ($230M) closed 2024-09-19 — out of window. The site's only active fund-adjacent CTA is "Apply to Our 2026 Passport Program," which is a program, not a fund.

**Other 2026 portfolio news seen (not deployments):** Trust & Will named to Fast Company's Most Innovative Companies 2026; Super named Best Overall Home Warranty Company of 2026 by USA Today; ICON's first commercial rollout of 3D-printing construction tech.

---

### Summary counts

| Investor | 2026 deployments recorded | Of which two_sources | 2026 fund events |
|---|---|---|---|
| 7wire Ventures | 2 | 2 | 0 |
| Cleveland Avenue | 2 (both weak) | 0 | 0 |
| M25 | 6 records / 5 companies | 4 | 0 |
| TechNexus Venture Collaborative | 3 (1 confirmed participation) | 0 | 1 (non-fund; SecondWave) |
| Moderne Ventures | 3 | 3 | 0 |
| **Total** | **16** | **9** | **1 (caveated)** |

Investors with **no** qualifying activity: none — every firm in g4 had at least one 2026 item. No investor required the literal "No 2026 activity found." line, though Cleveland Avenue comes closest to it on verifiable evidence.

---

### Other Chicago investors discovered

Surfaced incidentally while researching g4. Not investigated in depth; listed as leads for other groups.

- **Chicago Ventures** — participated in Oath's $6.6M seed alongside M25 (chicagoventures.com has an Oath portfolio page). Chicago-based.
- **Hyde Park Angels (HPA)** — participated in Karoo Health's $16.2M Series A (2026-07-21). Chicago-based angel group.
- **Lightbank** — participated in Letter AI's $40M Series B (2026-02-26). Chicago-based.
- **First Trust Capital Partners, LLC** — participated in Karoo Health's Series A. Wheaton/Chicago area.
- **Illinois Ventures** — named among Natrion's earlier backers (2022 seed, out of window). Chicago-based, university-affiliated.
- **Chicago Early Growth Ventures** — appeared in search results adjacent to M25 coverage; not investigated.
- **Chicago:Blend** — Chicago VC diversity organization profiled on TechNexus's site; an ecosystem body rather than a fund.
- **GCM Grosvenor** — Chicago-headquartered institutional investor; disclosed as a new LP in Moderne Ventures Fund III (2024). LP, not a direct venture investor.
- **Origin Ventures, MATH Venture Partners, Jump Capital, OCA Ventures, Sandbox Industries, Chicago Ventures' peers** — not encountered in 2026 evidence during this pass; noted only as known Chicago firms not covered by group g4.

Non-Chicago co-investors seen repeatedly in these rounds (for cross-referencing, not Chicago-based): ManchesterStory (Des Moines), Allumia Ventures, Matchstick Ventures (Minneapolis), Groove Capital (Minneapolis), Cambrian Ventures, Rackhouse Capital, Battery Ventures, Brighton Park Capital, Dragonfly Capital, ICONIQ, CRV, S32, Invest Nebraska, NMotion (Lincoln NE), IU Ventures (Indiana), LongJump, StoryTime Capital, Mighty Capital, CoFound Partners, Vocap Partners, Contour Ventures, Mosaik Partners, SpringRock Ventures.

---


# Lane g5 — KB Partners, Chicago Atlantic, Motivate Ventures, Impact Engine, Lofty Ventures, Firebrand Ventures

## Group g5 — Chicago venture investors, 2026-01-01 through 2026-09-04

Research date: 2026-09-04. Window is strictly 2026-01-01 .. 2026-09-04.

**Method limitation to flag:** the session's WebSearch budget (200 calls) was exhausted partway
through this task. All searches listed below were completed before that point; everything after
was done with WebFetch only. Several sources (FinSMEs, MJBizDaily, Business Wire, Crunchbase,
StreetInsider, nordic9, Cannabis Business Times) return HTTP 403 to WebFetch; where a fact rests
on an indexed search excerpt rather than a fetched page, it is called out explicitly below and in
the JSON `notes`.

---

### KB Partners

**HQ finding:** 600 Central Ave, Suite 300, **Highland Park, IL 60035** — confirmed on the firm's
own About page. Not Northbrook as the brief supposed; still suburban Chicago / Illinois, so
`investor_hq` recorded as "Illinois". Founded 1996 by Keith Bank; sports-tech focused.

**Fund status (material):** the About page states KB Partners "has completed investing from its
Myriad Opportunity Funds I and II," is no longer making new investments from those funds, and will
consider select opportunities only "through Special Purpose Vehicles (SPVs) or similar
structures." No 2026 fund raise found.

URLs opened:
- https://kbpartners.com/ (HQ address, four featured portfolio companies, no news section)
- https://kbpartners.com/about/ (HQ address, fund status quoted above)
- https://kbpartners.com/portfolio/ (47 active + 34 exited companies; none flagged as a 2026 addition)
- https://www.finsmes.com/2026/02/sportiq-raises-6-2m-in-series-a-funding.html (HTTP 403 on fetch; detail from indexed excerpt)
- https://tracxn.com/d/companies/siqbasketball/__rAU5URQBvSTPhiTcCVUP9IMp3XMbk2LlLa_e4wpwmlM (fetched OK)
- https://siqbasketball.com/ (fetched; now redirects to "SIQ is now Spalding TF DNA", no funding detail)
- https://nordic9.com/news/siq-basketball-raised-3-million-seed-from-kb-partners-and-joined-by-tera-ventures/ (HTTP 403)
- https://www.crunchbase.com/organization/siq-basketball (HTTP 403)
- https://www.barchart.com/story/news/20192776/... (BookSeats/KB Partners item — fetched, page returned empty body; date not established, so NOT recorded)

Searches run: "KB Partners sports tech venture led 2026"; "KB Partners seed round 2026 sports
technology investment announced"; "SIQ Basketball $6.2M funding round KB Partners 2026".

**Deals found (1):**
- **SportIQ / SIQ Basketball** — $6.2M, announced ~2026-02-19, KB Partners a participant.
  Round label conflicts: FinSMEs reports "Series A"; Tracxn records "Seed" with Match Ventures as
  lead and KB Partners participating. Company is Helsinki, Finland based with a Charlotte, NC US
  office. Other backers: Koppenberg Management, Match Ventures. Evidence class `two_sources`
  (FinSMEs + Tracxn — independent of each other, neither a wire copy).

No 2026 fund close or new fund announcement found for KB Partners.

---

### Chicago Atlantic

**HQ finding:** **Chicago, Illinois**, with additional offices in Miami, New York and London.
Confirmed on the firm's own press releases. The public vehicles are Chicago Atlantic Real Estate
Finance, Inc. (NASDAQ: REFI) and Chicago Atlantic BDC, Inc. (NASDAQ: LIEN); SEC filings list
Chicago, IL and New York, NY.

Per the brief, credit facilities to companies are treated as investments with `round` =
"credit facility".

URLs opened:
- https://www.chicagoatlantic.com/news/ (2026 items, May–July 2026)
- https://www.chicagoatlantic.com/news/page/2/ (same window; only one named financing, Meridian)
- https://www.chicagoatlantic.com/news/page/3/ (returned no Jan–Apr 2026 items; site pagination did not surface them)
- https://www.chicagoatlantic.com/transactions/ ("As of June 30, 2026" cumulative stats; individual deals are undated and mostly unnamed — several amounts shown as "---")
- https://www.chicagoatlantic.com/chicago-atlantic-announces-30-million-senior-secured-financing-to-hugo-inc-to-accelerate-bpo-roll-up-strategy/
- https://www.chicagoatlantic.com/chicago-atlantic-provides-16-5-million-term-loan-to-ocular-science-inc-a-leading-biotech-company-focused-on-compounded-ophthalmic-products/
- https://www.chicagoatlantic.com/chicago-atlantic-provides-35-million-senior-secured-credit-facility-to-meridian-rapid-defense-group-llc/
- https://www.chicagoatlantic.com/chicago-atlantic-plans-to-launch-emerging-markets-private-credit-platform/
- https://www.chicagoatlantic.com/chicago-atlantic-deploys-25-million-in-senior-secured-financing-for-elevate-cannabis/ (dated 2024-04-15 — OUT OF WINDOW, not recorded)
- https://www.financialcontent.com/article/bizwire-2026-3-19-chicago-atlantic-agents-a-senior-secured-facility-to-support-the-acquisition-of-lionel-holdings-llc-by-round-2-holdings-llc
- https://finance.yahoo.com/news/chicago-atlantic-announces-30-million-150000861.html
- https://www.businesswire.com/news/home/20260514584842/... (HTTP 403)
- https://www.streetinsider.com/Business+Wire/... Hugo (HTTP 403)
- https://www.rutlandherald.com/news/business/...hugo... (HTTP 429)
- https://www.globenewswire.com/news-release/2026/03/12/3254438/0/en/Verano-Announces-195-Million-Senior-Secured-Term-Loan-Refinancing-Agreement-to-Fund-Company-s-Strategic-Growth-Initiatives.html
- https://mgmagazine.com/press-releases/verano-secures-195m-senior-secured-term-loan/
- https://mjbizdaily.com/news/cannabis-mso-verano-plans-growth-spree-with-new-195-million-loan/614976/ (HTTP 403 on fetch; detail from indexed excerpt)
- https://www.cannabisbusinesstimes.com/finance/news/15819428/... (HTTP 403)
- https://investors.verano.com/news-releases/news-release-details/verano-announces-195-million-senior-secured-term-loan (fetch timed out)
- https://www.sahmcapital.com/news/content/chicago-atlantic-to-launch-emerging-markets-private-credit-platform-2026-04-08 (HTTP 404)
- https://efts.sec.gov/LATEST/search-index?q=%22Chicago+Atlantic%22&forms=8-K&startdt=2026-01-01&enddt=2026-09-04 (SEC full-text search — 2026 8-Ks are quarterly earnings/investor decks for REFI and LIEN plus a June 2026 REFI/LIEN merger announcement; no named borrower financings)

Searches run: "Chicago Atlantic credit facility announced 2026 cannabis loan"; "Chicago Atlantic
'senior secured credit facility' 2026 press release provides"; "Chicago Atlantic 2026 announces
financing site:businesswire.com"; "Chicago Atlantic cannabis loan 2026 Green Market Report
MJBizDaily million"; "Chicago Atlantic 2026 term loan announces sole arranger prnewswire OR
businesswire August July June"; "Verano Holdings $195 million loan Chicago Atlantic Needham Bank 2026".

**Deals found (5):**
1. **Hugo Inc.** — $30M senior secured credit facility, 2026-01-08. Chicago Atlantic sole arranger
   and administrative agent. Hugo is Chicago-headquartered (BPO / AI operations). `investor_attested`.
2. **Ocular Science, Inc.** — $16.5M senior secured term loan, 2026-01-15. Sole arranger and
   administrative agent. El Segundo, CA; ocularscience.com. `investor_attested`.
3. **Verano Holdings Corp.** — $195M senior secured term loan, 2026-03-12. Chicago Atlantic
   Financial Services LLC as co-administrative agent alongside Needham Bank. Chicago, IL; cannabis
   MSO. 9.50% (Term SOFR + 5.50%, 4% floor), matures 2029-03-11. `two_sources` — this is the only
   Chicago Atlantic deal in the window with genuinely independent publishers (company release +
   mg Magazine + MJBizDaily).
4. **Lionel Holdings, LLC** — undisclosed senior secured facility, 2026-03-19, supporting the
   acquisition of Lionel by Praesidian Capital / Round 2 Holdings. Chicago Atlantic as
   administrative agent. Amount null. `investor_attested`.
5. **Meridian Rapid Defense Group, LLC** — $35M senior secured term loan, 2026-05-14. Sole arranger
   and lender. `investor_attested`.

**Fund/platform event found (1):** Emerging Markets Private Credit strategy launch, 2026-04-08. No
size disclosed. Recorded in g5-funds.json as `announced`, size null.

**Deliberately NOT recorded (data quality):**
- The "$350,000,000 Senior Secured Credit Facility to a vertically integrated, multi-state cannabis
  operator" and "$55 million ... single-state operator" line items surfacing from REFI/BDC quarterly
  disclosure "as of March 31, 2026" name no borrower and carry no announcement date. Origination
  date could not be pinned inside the window. Excluded rather than guessed.
- The credit-facility maturity extension "to June 30, 2026" (MJBizDaily) is a 2024-dated event about
  Chicago Atlantic's OWN borrowing, not a deployment. Excluded.
- The Chicago Atlantic BDC $100M revolving credit line is Chicago Atlantic borrowing, not deploying.
  Excluded.
- The June 2026 REFI / LIEN merger is a corporate action, not a deployment or a fund raise. Noted
  here only.
- Green Market Report was not reachable in this session; MJBizDaily was covered via search index
  and one 403'd article. Chicago Atlantic's transactions page lists 195+ deals / $3.8B closed as of
  2026-03-31 but is undated and largely anonymized, so it cannot be mined for in-window deals.
  **Chicago Atlantic almost certainly closed more 2026 loans than the five above; this list is what
  is publicly named and dated, not a complete deployment record.**

---

### Motivate Ventures (Motivate Venture Capital)

**HQ finding:** **Chicago, Illinois** — 110 N. Peoria Street, Suite 104, Chicago, IL 60607, per the
SEC Form D for Motivate Ventures AI Fund III, LP. Founded 2019; pre-seed and seed.

URLs opened:
- https://motivate.vc/ (portfolio: Fulcrum, Attain, Lazarus Forms, Valiot, Inca Digital, ReloShare; no dates, no HQ)
- https://motivate.vc/blog/ (full post list — only one 2026 post)
- https://motivate.vc/motivate-announces-fund-iii/ (2026-03-21, Fund III)
- https://motivate.vc/motivate-ventures-launches-fund-iii/ (HTTP 404 on fetch, twice; content only via indexed search excerpt)
- https://motivate.vc/news/ (HTTP 404)
- https://data.sec.gov/submissions/CIK0002108725.json (Form D filing index)
- https://www.sec.gov/Archives/edgar/data/2108725/000210872526000001/xslFormDX01/primary_doc.xml (Form D primary doc)
- https://radientanalytics.com/firm/form-d/motivate-ventures-ai-fund-iii-lp-2108725 (fetched; page returned no substantive data)

Searches run: "Motivate Ventures Chicago led seed round 2026"; "Motivate Ventures 'Fund III' $100
million 2026 announcement". A third search ("Motivate Ventures participated round 2026 startup
raises") was blocked by the exhausted search budget — **this is the single largest gap in this
group's coverage: Motivate's 2026 portfolio deployments were not searchable.** Their blog carries
no 2026 investment posts and their site lists no dated portfolio additions, but third-party data
(Tracxn, via an earlier search excerpt) indicated 8 investments in 2025 and at least 1 in early
2026 — that early-2026 deal could not be identified by name.

**Deals found:** none identifiable by name. **No 2026 deployment recorded.**

**Fund event found (1):** **Motivate Fund III**, announced 2026-03-21 on the firm's blog; two
Form D filings on 2026-02-02 (Motivate Ventures AI Fund III, LP — CIK 0002108725; Motivate Ventures
QP Fund III, LP — CIK 0002108724). Form D shows an *indefinite* offering amount and $0 sold, "first
sale yet to occur". The $100M target figure and the "$200M+ AUM / acquired Willpower Ventures / added
Andy Will as Partner" details come from the 404'd launch page via search index only. Recorded as
`announced` with a target size, **not** as a close. Evidence class `filing`.

---

### Impact Engine

**HQ finding:** **Chicago, Illinois**. Founded 2011; impact VC and PE across economic empowerment,
education, environmental sustainability and health. Women-led; partners Jessica Droste Yagan, Roger
Liew, Tasha Seitz.

URLs opened:
- https://www.theimpactengine.com/articles (full 2026 post list, Feb–Sep 2026)
- https://www.theimpactengine.com/bloghome/category/Why+We+Invested (2026: Midi Health, Paladin EnviroTech)
- https://www.theimpactengine.com/bloghome/2026/2/3/why-we-invested-in-midi-health
- https://www.theimpactengine.com/bloghome/2026/4/15/why-we-invested-in-paladin
- https://www.theimpactengine.com/bloghome/2026/2/24/our-feb-2026-newsletter ("first public investment of the year" = Midi Health)
- https://www.theimpactengine.com/articles/why-we-invested-in-paladin (HTTP 404 — wrong path; correct path above)
- https://www.theimpactengine.com/bloghome/2026/5/7/april-2026-newsletter (HTTP 404 — slug guess; the "Tech trash is a problem" newsletter appears to be the Paladin item)
- https://www.theimpactengine.com/bloghome/2026/9/1/our-latest-exit-is-a-hot-one (HTTP 404 — slug guess)
- https://www.joinmidi.com/press-release/series-d-announcement
- https://paladinenvirotech.com/ (HQ Tampa, FL; no funding announcement)
- https://efts.sec.gov/LATEST/search-index?q=%22Impact+Engine%22&forms=D&startdt=2026-01-01&enddt=2026-09-04 (zero results — no 2026 Form D)

Searches run: "Impact Engine Chicago venture led investment 2026"; "Impact Engine Midi Health
investment 2026 round"; "Impact Engine Paladin investment 'why we invested' 2026".

**Deals found (2):**
1. **Midi Health** — $100M Series D at >$1B valuation, 2026-02-03, led by Goodwater Capital. Impact
   Engine's own post attests the investment; the Midi press release does *not* name Impact Engine,
   so `investor_attested`. Palo Alto, CA; joinmidi.com.
2. **Paladin EnviroTech** — 2026-04-15. E-waste recycling / ITAD roll-up, Tampa, FL. Round, amount
   and role all undisclosed — recorded null/unknown. Single investor source; `investor_attested`.

**Other 2026 posts on the site that are NOT deployments:** 2026-09-01 "Our latest exit is a 'Hot'
one" (an exit, not a deployment; company not identified from the accessible listing), 2026-07-29
and 2026-07-28 AGM fund-manager panel recaps, 2026-06-30 newsletter, 2026-06-03 team promotions,
2026-03-31 newsletter.

**No 2026 fund close found** — no Form D in the window and no fund announcement on the site. Their
$25M Impact Engine Ventures Fund II close is an older event, out of window.

---

### Lofty Ventures

**HQ finding:** **Chicago, Illinois**. Founded 2014; first-check to seed, $10k–$100k initial with
$100k–$500k follow-on via syndicate; $3M–$5M pre-money sweet spot; Chicago-based, tech-enabled
businesses. Founder Christopher Deutsch. Site currently reports 159 founders, 88 startups, 5 exits.

URLs opened:
- https://loftyventures.com/ (HQ, stats, 2026/07 summit banner; no news or blog section)
- https://loftyventures.com/portfolio/ (60+ companies listed, none flagged as a 2026 addition)

Searches run: "Lofty Ventures Chicago investment 2026".

**No 2026 activity found.**

The only 2026 event located is the **2026 Lofty Angels Summit** held in Chicago on 2026-08-10 (200+
attendees, startup pitch competition with a $2,000 grand prize sponsored by Lofty Ventures) — an
event, not an investment, so it is not recorded in either JSON file. Third-party data (Tracxn, via
search excerpt) explicitly states Lofty has made no investment in 2026 to date. Given their
$10k–$100k check size, any Lofty participation would in any case rarely be named in round
announcements.

---

### Firebrand Ventures — EXCLUDED (not Chicago-HQ)

**HQ finding: Kansas City, Missouri.** Confirmed as the firm's headquarters, with additional
offices in Boulder, Colorado and Austin, Texas. Chicago and Denver appear only as *target investment
markets* in their thesis (they deliberately target Austin, Boulder, Denver, Chicago, Des Moines and
Kansas City) — neither is an office, and neither is the HQ.

**Firebrand Ventures is therefore EXCLUDED from this group. No Firebrand deals were placed in
g5-deployments.json or g5-funds.json, and no 2026 deal research was carried out for the firm.**

URLs consulted (search results only; HQ finding is consistent across all of them):
- https://www.firebrandvc.com/about
- https://www.firebrandvc.com/
- https://app.thunder.vc/investments-firms/kansas-city-mo-firebrand-ventures-6788
- https://tracxn.com/d/venture-capital/firebrandventures/__foNkERxgZR2jQKtHv15Z_DCYM7BsgPZrtb8vi5SxILs
- https://www.crunchbase.com/organization/firebrand-ventures

Search run: "Firebrand Ventures headquarters Kansas City Denver 2026".

---

### Other Chicago investors discovered

Surfaced incidentally while researching this group. None were researched for 2026 activity; listed
for possible assignment to another group.

- **Chicago Atlantic Financial Services, LLC** — the operating lending entity behind the Verano
  facility; distinct from Chicago Atlantic Real Estate Finance (REFI) and Chicago Atlantic BDC
  (LIEN). Worth treating as one manager with multiple vehicles rather than as separate investors.
- **Willpower Ventures** — early-stage fintech firm **acquired by Motivate Ventures** around the
  Fund III launch (2026); founder Andy Will joined Motivate as Partner. Per the indexed excerpt of
  the 404'd Motivate launch page; not independently confirmed. No longer an independent firm if the
  acquisition is accurate.
- **Lofty Angels** — Lofty Ventures' associated angel syndicate/community, Chicago; runs the annual
  Lofty Angels Summit and co-invests alongside the fund.
- **Needham Bank** — co-lender with Chicago Atlantic on the Verano facility, but Massachusetts-based,
  not Chicago. Noted only to prevent misfiling.
- **Praesidian Capital / Round 2 Holdings** — acquirer side of the Lionel Holdings deal financed by
  Chicago Atlantic. Praesidian is a New York PE firm, not Chicago; Round 2 Holdings HQ not
  established.
- **Verano Holdings Corp.** — Chicago-headquartered cannabis MSO; a borrower here, not an investor,
  but it is a large Chicago company whose capital events recur in this dataset.
- **MacArthur Foundation** — Chicago-based; appears as an LP/grantee relationship with Impact Engine.
  A foundation rather than a venture investor, but it is a Chicago institutional capital source.

---


# Lane g6 — Serra Ventures, Illinois Ventures, Amplify Chicago, Duchossois, Wind Point Partners, Baird Capital

## Group g6 — Chicago / Illinois investor research notes

Window: 2026-01-01 through 2026-09-04 only. Research date: 2026-09-04.
Method: WebFetch of firm sites + WebSearch (search budget of 200 calls was exhausted mid-research;
the last four planned searches — Illinois Ventures Series A 2026, "Serra Ventures led 2026",
Duchossois/CIT 2026, Baird "Rapid Energy" office attribution — could NOT be run and are flagged as
coverage gaps below. Remaining verification was completed by direct WebFetch).

---

### Serra Ventures

**HQ finding:** 520 N Neil St, Suite 510, Champaign, IL 61820. Champaign, Illinois — NOT Chicago.
Per the brief, `investor_hq` is recorded as "Illinois".

**URLs opened:**
- https://www.serraventures.com/ (WebFetch — HQ address, portfolio, 2026 news teasers)
- https://www.serraventures.com/news (WebFetch — full 2026 news list)
- https://www.serraventures.com/pressroom (WebFetch — only monthly "Snapshot" newsletter links for
  Jan–Jul 2026; no substantive 2026 press items)
- https://www.serraventures.com/news/yqjf4v51fahssgq87husj4re4qf32l (WebFetch — Leo Cancer Care item)
- https://leocancercare.com/news-and-events/press-release/leo-cancer-care-raises-65m-series-d-to-scale-its-integrated-upright-cancer-care-platform/ (WebFetch)
- https://www.businesswire.com/news/home/20260708655051/en/Leo-Cancer-Care-Raises-$65M-Series-D-to-Scale-Its-Integrated-Upright-Cancer-Care-Platform (WebFetch — HTTP 403, could not read; URL date stamp 20260708 used only as corroboration of the date)
- https://www.fiercehealthcare.com/health-tech/leo-cancer-care-secures-65m-series-d-advance-upright-radiotherapy-system (WebFetch — HTTP 403, could not read; content known only from search snippet)
- WebSearch: `"Serra Ventures" 2026 investment round`
- WebSearch: `"Serra Ventures" participated seed round 2026 announcement`
- WebSearch: `"Leo Cancer Care" $65 million Series D 2026 Serra Ventures`

**Deals found (in window):**
1. **Leo Cancer Care — $65M Series D, announced 2026-07-08, Serra a participant.** Led by Yu Galaxy
   (Silicon Valley); new investor Eventide Asset Management. Leo Cancer Care HQ is Middleton,
   Wisconsin (plus a Crawley, West Sussex, UK office); domain leocancercare.com. Company founded
   2018, $155M raised to date. Serra's participation is attested ONLY by Serra's own site
   (post dated 2026-07-13), which states Leo is a Serra Capital III / Serra Capital III SBIC
   portfolio company — the company press release names only Yu Galaxy and Eventide and otherwise
   says "existing investors". Recorded as `investor_attested`.

**Other 2026 Serra items that are NOT deployments (no row created):**
- 2026-07-01 — VeriSIM Life: CEO Jo Varshney on the Inc. Female Founders 500 list; research
  collaboration formalized with FDA/NCTR. Not a financing.
- 2026-06-02 — SWARM Engineering CEO Shail Khiyara byline on AI in agriculture. Not a financing.
- 2026-04-30 — Fork Farms (Serra Capital Ag & Food Tech Fund II company) partnered with Feeding
  America and Rockwell Automation on Clock Tower Farms. Partnership, not a financing.
- 2026-04-07 — Opendorse and Mast Reforestation named to Fast Company's 2026 Most Innovative
  Companies list. Recognition, not a financing.
- 2026-02-10 — Drew Beard promoted from Associate to Principal. Personnel, not a financing.

**Funds:** No 2026 fund close, first close, or new fund announcement found for Serra Ventures.
The site references Serra Capital I, II, III, Serra Capital III SBIC and Serra Capital Ag & Food
Tech Fund II, but with no 2026 close event.

**Coverage gap:** the planned `"Serra Ventures" led 2026` search could not be executed (search
budget exhausted). Third-party trackers seen in snippets (Tracxn) said "no investment in 2026 so
far" as of Jan 2026 data, which is stale and contradicted by the July Leo Cancer Care item — so
treat the Serra deal list as possibly incomplete for Aug–Sep 2026.

---

### Illinois Ventures

**HQ finding:** Two offices listed — Chicago at 200 S Wacker Dr, 20th Floor, Chicago, IL 60606, and
Champaign at 60 Hazelwood Drive, Champaign, IL 61820. Recorded `investor_hq` = "Chicago".
University-affiliated (University of Illinois System), founded 2002, 125+ investments over 25 years.

**URLs opened:**
- https://www.illinoisventures.com/ (WebFetch — HQ, highlighted portfolio)
- https://illinoisventures.com/about-us/news/ (WebFetch — **no 2026 items**; newest posts are July
  2025 and earlier. The site's news feed is stale.)
- https://illinoisventures.com/portfolio/ (WebFetch — full portfolio; several logos carry 2026 asset
  markers)
- https://illinoisventures.com/illinois-ventures-launches-new-fund-to-propel-deep-tech-startups/
  (WebFetch — Illinois Deep Technology Strategic Venture Fund, L.P., announced **2024-10-18**,
  size not disclosed — OUT OF WINDOW, no fund row created)
- https://payloadspace.com/samara-closes-10m-seed-round/ (WebFetch)
- https://researchpark.illinois.edu/enterpriseworks-tenant-photon-queue-raises-4-million-seed-round/ (WebFetch)
- WebSearch: `"Illinois Ventures" 2026 investment seed round`
- WebSearch: `Samara Aerospace $10 million seed Illinois Ventures 2026`
- WebSearch: `"Photon Queue" $4 million seed round quantum memory 2026`
- WebSearch: `"Illinois Ventures" participated 2026 funding announcement`

**Deals found (in window):**
1. **Samara Aerospace — $10M Seed, announced 2026-01-20, Illinois Ventures a participant.** Led by
   Balerion Space Ventures; also MFV Partners and Access Venture Partners. Samara HQ San Francisco,
   CA; domain samaraaerospace.com. Founder/CEO Patrick Haddox is a University of Illinois alum.
   Two independent outlets (Payload 2026-01-20, Evertiq 2026-01-27).
2. **Photon Queue — $4M oversubscribed Seed, announced 2026-07-21, Illinois Ventures a participant.**
   Led by Playground Global; also Cerberus Capital Management, Roadrunner Venture Studios,
   MFV Partners. Photon Queue HQ Champaign, IL (EnterpriseWorks / U of I Research Park tenant);
   domain photonqueue.com. Two independent outlets (U of I Research Park, The Quantum Insider),
   both 2026-07-21; also distributed by Business Wire the same day.

**Not counted / out of window:**
- Apriority — $2.3M Seed with Illinois Ventures participating, **November 2025**. Out of window.

**Ambiguity flagged:** the Illinois Ventures portfolio page renders several logos with a "2026"
asset marker — Worktrace AI, Tandemn, Femtovox, Excelsior Sciences, Madison Scientific,
Beyond Barriers Therapeutics, Coologics, CranioSense, plus Photon Queue and Samara Aerospace.
The 2026 marker on the other eight is most likely an image-upload year rather than an investment
date, and I found no dated 2026 announcement for any of them. **No rows were created for them.**
These are the highest-value follow-up targets if the search budget is restored. A third-party
tracker snippet claimed Illinois Ventures had made 3 investments in 2026 as of June 2026, versus
the 2 I could date-verify — so at least one 2026 Illinois Ventures deal is likely still unfound.

**Funds:** No 2026 fund close or new-fund announcement found. (The Illinois Deep Technology
Strategic Venture Fund was announced 2024-10-18 — out of window.)

---

### Amplify Chicago

**VERIFICATION RESULT: not an investor. No rows created in either JSON file.**

**HQ finding:** Amplify Chicago exists and is located at 900 N. North Branch St., Chicago, IL —
but it is a **workforce-development and wealth-building non-profit / social enterprise**, not a
venture capital firm, PE firm, or startup investor. Its program is a cohort for young adults aged
21–30 (career readiness training, industry certifications, financial planning, coaching), explicitly
aimed at closing the racial wealth gap, with reported outcomes of 110 participants, 4 homeowners and
13 business owners. Its only for-profit arm is Amplify Property Solutions LLC, a property maintenance
business that grants employees ownership stakes. An "Amplify Detroit" expansion is billed as
"launching soon" with no date given.

**Name collisions checked and ruled out:** Amplify Partners (Menlo Park / San Francisco, CA — early
stage deep tech / dev tools / AI, GPs Sunil Dhaliwal and Lenny Pruss); Amplify (Los Angeles, CA,
founded 2011, seed-stage); Amplify Capital; AmplifyHer Ventures. **None of these is a Chicago or
Illinois firm.** There is no Chicago-based venture investor named "Amplify".

**URLs opened:**
- https://www.amplifychicago.org/ (WebFetch)
- WebSearch: `"Amplify Chicago" venture capital investor`
- WebSearch: `"Amplify" Chicago venture fund startup investor Illinois 2026`

**No 2026 activity found.** (No investment activity of any kind — the entity does not make startup
investments.)

---

### Duchossois Capital Management (DCM)

**HQ finding:** 444 W. Lake St, Suite 2000, Chicago, Illinois 60606. Private investment firm launched
in 2013 by the Duchossois Group; four investment areas — Private Capital, Real Estate, Funds, and
Public Securities. Effectively a family-office / private investment platform.

**IMPORTANT NAME DISAMBIGUATION:** "DCM Ventures" is a **different, unrelated firm** — DCM
(formerly Doll Capital Management), founded 1996, headquartered in **Menlo Park, California**, 374
portfolio companies. It is NOT the venture arm of Duchossois Capital Management. Searches for
"DCM Ventures" return the California firm. I found no separately branded venture vehicle called
"DCM Ventures" operated by Duchossois. Do not merge these two records.

**URLs opened:**
- https://dcmllc.com/ (WebFetch — HQ address; no news page exists on the site)
- http://dcmllc.com/strategy/ (WebFetch — four strategy areas; no named companies, no 2026 items)
- https://dcmllc.com/investments/ (WebFetch — active portfolio list)
- http://www.prnewswire.com/news-releases/citadel-ehs-acquires-aurora-industrial-hygiene-302787421.html (WebFetch)
- WebSearch: `"Duchossois Capital Management" OR "DCM Ventures" investment 2026`
- WebSearch: `"Duchossois" "Aurora Industrial Hygiene" 2026`
- WebSearch: `"Duchossois Capital" Citadel EHS investment`
- WebSearch: `"Duchossois Capital Management" 2026 announces partnership investment`
- WebSearch: `"DCM Ventures" Duchossois Chicago venture 2026`

**Active portfolio as listed on dcmllc.com/investments:** Citadel EHS, CIT, Magical Beginnings, EDP,
Sevita, Novum Health, Illumifin, SightMD, Pattern, LSL Healthcare, Incline, Churchill Downs
(NASDAQ: CHDN), Chamberlain Group. Two entries — **Citadel EHS** and **CIT** — carry 2026 asset
markers in their image paths, suggesting they were added to the site in 2026, but **the site gives no
dates, no press releases and no announcement text**, so no row can be created from that alone.

**Deals found (in window): NONE CONFIRMED.**

The one lead that surfaced was a third-party tracker claim that Duchossois Capital Management's
"latest investment was on 2026-06-01 in Aurora Industrial Hygiene". **I checked this and it does not
support a Duchossois deployment row.** The actual 2026-06-01 PR Newswire release is
"Citadel EHS Acquires Aurora Industrial Hygiene" — an add-on acquisition by Citadel EHS (HQ Glendale,
Southern California) of Aurora Industrial Hygiene (San Diego / Los Angeles, CA, founded 1996 by
Karen Shockley and Grace Rinck). The release credits Citadel EHS as **"backed by the Broadview Group,
a St. Louis-based investment and operating company"** and **does not mention Duchossois Capital
Management anywhere**. Duchossois does list Citadel EHS in its own portfolio (so it is plausibly a
co-investor alongside Broadview), but the only dated 2026 document I could find neither names
Duchossois nor describes a new Duchossois deployment — it describes a portfolio-company add-on. Per
the no-invention rule, **no deployment row was created**; recording one would require inferring both
Duchossois's involvement and its role.

**Funds:** No 2026 fund close, first close, or new fund announcement found for Duchossois.

**No 2026 activity found.**

**Coverage gap:** the planned `"Duchossois Capital Management" 2026 acquires CIT` search could not be
run (search budget exhausted). Duchossois publishes no press releases and has no news page, so its
2026 activity is close to invisible to open-web research; a Duchossois row would realistically need
PitchBook / Preqin / Mergr paid data or a portfolio-company press release naming the firm.

---

### Wind Point Partners

**HQ finding:** 676 N. Michigan Avenue, Suite 3700, Chicago, IL 60611. Chicago-headquartered
middle-market private equity, founded 1984, ~$9 billion AUM, 90+ platform investments. Reported to be
relocating in October 2026 to 333 Wolf Point Plaza, downtown Chicago.

**URLs opened:**
- https://www.wppartners.com/news/ (WebFetch — 2026 news index)
- https://www.wppartners.com/companies/ (WebFetch — portfolio with investment years)
- https://www.wppartners.com/wind-point-partners-to-acquire-eci/ (WebFetch)
- https://www.wppartners.com/wind-point-partners-to-acquire-the-hiller-companies/ (WebFetch)
- https://www.wppartners.com/wind-point-partners-to-acquire-enviromatic/ (WebFetch — **HTTP 404**,
  guessed URL; no Enviromatic release appears to exist on the firm site)
- https://finance.yahoo.com/small-business/articles/wind-point-partners-announces-final-120000475.html (WebFetch — Fund XI)
- https://peprofessional.com/2026/01/wind-point-buys-enviromatic-systems/ (WebFetch)
- WebSearch: `"Wind Point Partners" 2026 acquires`
- WebSearch: `"Wind Point Partners" 2026 platform investment announcement Chicago`
- WebSearch: `"Wind Point Partners" businesswire 2026 acquisition announcement`
- WebSearch: `Hiller Companies Wind Point Partners Littlejohn January 2026 acquisition`
- WebSearch: `"Eze Castle Integration" Wind Point Partners August 2026`

**Deals found (in window):**
1. **The Hiller Companies — announced 2026-01-15, Wind Point as acquirer/lead.** Bought from
   Littlejohn & Co. Hiller HQ Mobile, Alabama; founded 1919; fire and life safety services;
   1,900+ employees, 45+ branches; commercial, industrial and marine end markets. Terms undisclosed.
   CEO Santiago Perez continues, Bob Chauvin as Board Chair, Clayton Finley (Principal) quoted.
   Buy-side advisors Winston & Strawn (legal) and KPMG (M&A); sell-side Gibson Dunn (legal),
   Robert W. Baird and Harris Williams (M&A). Wind Point's portfolio page dates the completed
   investment to February 2026.
2. **Eze Castle Integration (ECI) — announced 2026-08-04, Wind Point as acquirer/lead.** Bought from
   H.I.G. Capital. Founded 1995; outsourced cybersecurity, cloud and IT managed services to regulated
   industries (financial services, insurance, manufacturing); 775+ employees across North America,
   Europe, Asia-Pacific; reported ~$35–38M EBITDA. Terms undisclosed. Leadership retained: CEO Jeff
   Schmidt, CFO Andy Breton, CIO Rich Itri, COO Pete Magyar; Wind Point Executive Advisor Partners
   Tony Anderson, Joe Mertens, Kelly Chambliss and Bob Pryor joining at close. H.I.G. had run an
   auction via Robert W. Baird & Co. that was paused in March amid customer churn. Wind Point's
   portfolio page dates the investment July 2026.
3. **Enviromatic Systems — reported January 2026, Wind Point as acquirer/lead. FLAGGED FOR DATE
   AMBIGUITY.** PE Professional published the deal in January 2026 (URL /2026/01/), but Wind Point's
   own portfolio page dates the Enviromatic investment to **December 2025**, which would put it
   outside the window. No Wind Point press release exists for it (guessed URL 404s; the firm's news
   index does not list it). Recorded as `single_source` with the conflict stated in the row's notes.
   Enviromatic: HQ Texas, founded 1973, 275+ employees across TX, FL, TN, GA, building automation and
   energy management; CEO Dean Glover; management retained a meaningful stake; deal led out of Wind
   Point's Chicago HQ by Clayton Finley (Principal) and Nathan Brown (Managing Director).

**Not counted (portfolio-company add-on, not a Wind Point platform deployment):**
- January 2026 — "SIGMA Acquires Masonry Supply, Inc." (add-on by Wind Point's 2025 platform SIGMA).

**Funds found (in window):**
- **Wind Point Partners XI — final close 2026-07-29 at $3.2 billion.** Oversubscribed, above hard
  cap; largest fund in the firm's 42-year history; 65+ institutions across 17 countries; fundraise
  completed in under nine months. Recorded as `investor_attested` because the second source located
  (Yahoo Finance) is a carry of the firm's own Business Wire release rather than independent
  reporting.

---

### Baird Capital

**HQ finding — and the required caveat.** Baird Capital presents itself as operating from **Chicago
and London** (its own Global Fund III release names exactly those two offices), and Crain's Chicago
Business covers it as a Chicago firm; third-party profiles describe it as headquartered in Chicago,
Illinois. It is the direct private investment arm associated with **Milwaukee-headquartered Robert W.
Baird & Co.** — which is the reason the brief's Chicago-attribution caveat applies. Every Baird row
carries that caveat in its `notes`. `investor_hq` is recorded as "Chicago".

**Office attribution I established (this is the basis for including/excluding each deal):**
- **Joanna Arras, Partner** — bio page gives phone +1-312-609-2555 (Chicago 312 area code); described
  elsewhere as a Partner on the **U.S. Venture team in Chicago**, joined 2014. Bio text does not
  print a city, so this is inference from area code + U.S. team, not a literal statement.
- **Rebecca "Becca" Schlagenhauf, Partner** — bio page gives phone +1-312-609-7037 (Chicago 312).
  Same inference caveat. (A first guessed URL `/team/rebecca-schlagenhauf/` 404'd; the live page is
  `/team/becca-schlagenhauf/`.)
- **James Benfield, Partner** — bio states plainly **"based in London"**, Industrial Tech &
  Sustainability.
- **Michael Holgate, Partner** — bio states plainly **"Based in London"**, Tech Services & Software
  and Pharma Services.

**URLs opened:**
- https://www.bairdcapital.com/news/ (WebFetch — full 2026 news index)
- https://www.bairdcapital.com/news/2026/02/baird-capital-invests-in-autoloto/ (WebFetch)
- https://www.bairdcapital.com/news/2026/02/baird-capital-invests-in-rapid-energy/ (WebFetch)
- https://www.bairdcapital.com/news/2026/04/baird-capital-exceeds-target-closes-third-global-fund-at-$450m/ (WebFetch)
- https://www.bairdcapital.com/news/2026/04/baird-capital-closes-oversubscribed-continuation-fund-to-fuel-growth-of-blue-matter/ (WebFetch)
- https://www.bairdcapital.com/team/ (WebFetch — index only, no cities shown)
- https://www.bairdcapital.com/team/joanna-arras/ (WebFetch)
- https://www.bairdcapital.com/team/rebecca-schlagenhauf/ (WebFetch — **HTTP 404**)
- https://www.bairdcapital.com/team/becca-schlagenhauf/ (WebFetch)
- https://www.bairdcapital.com/team/james-benfield/ (WebFetch)
- https://www.bairdcapital.com/team/michael-holgate/ (WebFetch)
- WebSearch: `"Baird Capital" 2026 investment Chicago`
- WebSearch: `"Baird Capital" "Blue Matter" investment 2026`
- WebSearch: `"Baird Capital" invests 2026 announcement prnewswire businesswire`
- WebSearch: `"autoLOTO" Baird Capital investment February 2026`
- WebSearch: `Joanna Arras Baird Capital partner Chicago office`

**Deals found (in window) — INCLUDED as Chicago-attributed:**
1. **autoLOTO — majority recapitalization / growth investment, announced 2026-02-25.** Announcement
   quotes Partners Joanna Arras and Rebecca Schlagenhauf, both with Chicago 312 numbers → Chicago
   team. autoLOTO HQ Coeur d'Alene, Idaho; domain autoloto.co; founded 2019; cloud software and
   services automating Lockout/Tagout (LOTO) worker-safety procedures for data-center and industrial
   construction/maintenance environments. Terms undisclosed. Citizens Bank was exclusive financial
   advisor to autoLOTO (2026-03-05 release). Mergermarket ran a Deal Focus on it (Baird recap
   2026-04-23) featuring Arras and Schlagenhauf.

**Deals found (in window) — EXCLUDED as London-attributed (per the brief's "Chicago team only" rule):**
2. **Rapid Energy — investment announced 2026-02-10.** Company HQ **Redditch, United Kingdom**;
   specialist provider of emergency and planned temperature-control hire solutions. The only Baird
   person quoted is **James Benfield, Partner, whose bio states he is based in LONDON**. Attribution
   is clear rather than unclear, so **no deployment row was created** — recorded here for
   completeness. If the caller wants all-office Baird coverage rather than Chicago-only, this is the
   one row to add back.

**Funds found (in window):**
- **Baird Capital Global Fund III — final close 2026-04-21 at $450M** (hard cap; 30%+ larger than
  predecessor; all prior anchor investors re-upped). Strategy: $25–75M growth equity and buyout into
  founder-led lower-middle-market B2B tech and services companies with $10–100M revenue in the U.S.
  and U.K. Gordon Pan, President, quoted. Independently covered by Crain's Chicago Business
  (2026-04-20) and Bloomberg (2026-04-21) → `two_sources`.
- **Blue Matter single-asset continuation vehicle — closed 2026-05-05**, size undisclosed,
  oversubscribed. Led by Ares Secondaries funds; Global Fund III also made a new investment into the
  business; Blue Matter management retained a majority stake. Blue Matter Consulting LLC is a
  life-sciences strategy consulting firm, San Francisco, CA; Baird first invested 2020, since when
  ~25% organic revenue CAGR, three add-ons, revenue more than tripled. **London-attribution caveat:
  the Baird principal quoted is Michael Holgate, based in London.** Recorded in g6-funds.json because
  it is a fund-level event of the Chicago-based manager, with the caveat stated in the row's notes.
  (Note the URL path says /2026/04/ but both the news index and the page itself date it May 5, 2026.)

**Other 2026 Baird news items that are NOT deployments or fund closes (no rows created):**
- 2026-08-26 — Baird Capital exits investment in Vega Global (EXIT).
- 2026-08-19 — Baird Capital exits investment in Cleanwater1 (EXIT).
- 2026-07-30 — Michael Holgate discusses Blue Matter's continuation vehicle strategy with
  Mergermarket (commentary).
- 2026-07-23 — Baird Capital realizes investment in AEGIS (EXIT/realization).
- 2026-04-30 — Erin Jelenchick on portfolio data standardization in The Drawdown (commentary).
- 2026-04-14 — Portfolio company Newmarket Strategy acquires Visible Analytics (portfolio add-on, not
  a Baird deployment).
- 2026-01-22 — Baird Capital elevates talent across investment team: Becca Schlagenhauf promoted to
  Partner, Katie Schoen named Global Head of Capital Formation, Erin Jelenchick named Global Head of
  Finance and Operations (personnel).
- 2026-01-20 — Baird Capital finalist for Real Deals' Private Equity Award (recognition).

---

### Other Chicago investors discovered

These surfaced incidentally during g6 research and are **not** part of group g6. No rows were created
for them; listed here as leads for other groups.

- **Robert W. Baird & Co. (Baird) — Milwaukee, WI, with a large Chicago presence.** Appears
  repeatedly as sell-side M&A advisor in 2026 Chicago-relevant deals: sell-side advisor on Hiller to
  Wind Point (2026-01), and ran H.I.G.'s auction of ECI that ended in the Wind Point deal (2026-08).
  Advisory role, not an investor role, in those deals. Distinct from Baird Capital (see above).
- **The Duchossois Group** — the family holding company behind Duchossois Capital Management;
  separate CB Insights investor profile exists. Chicago-area. Not researched.
- **Littlejohn & Co.** — Greenwich, CT (not Chicago); seller of Hiller to Wind Point, 2026-01-15.
- **H.I.G. Capital** — Miami (not Chicago); seller of ECI to Wind Point, 2026-08-04.
- **Broadview Group** — St. Louis, MO (not Chicago); backer of Citadel EHS, which acquired Aurora
  Industrial Hygiene on 2026-06-01. Relevant because Duchossois also lists Citadel EHS in its
  portfolio.
- **Ares Secondaries** — led the Baird Capital Blue Matter continuation vehicle (2026-05-05). Not
  Chicago.
- **Chicago Ventures** — surfaced as a CB Insights "related investor" suggestion while searching
  Illinois Ventures. Chicago-based early-stage VC. Not researched here; likely belongs to another
  group.
- **MFV Partners** — appeared as a co-investor in BOTH Illinois Ventures 2026 rounds (Samara
  Aerospace, Photon Queue). Not Chicago (Silicon Valley), but a notable repeat co-investor alongside
  an Illinois firm.
- **Playground Global** (led Photon Queue), **Balerion Space Ventures** (led Samara), **Yu Galaxy**
  (led Leo Cancer Care), **Eventide Asset Management**, **Cerberus Capital Management**,
  **Roadrunner Venture Studios**, **Access Venture Partners** — co-investors/leads in the rounds
  above; none Chicago-based.

---


# Lane g7 — ARCH Venture Partners, Polsky Center funds, N.XT, Ampersand, Level Equity, 1871

## Group g7 — Chicago investors, research notes
Window: 2026-01-01 through 2026-09-04. Research date: 2026-09-04.

**Method caveat:** the session's WebSearch budget (200 calls) was exhausted partway through this task. Remaining research was done with WebFetch against firm sites, company press releases, SEC EDGAR full-text search, and Bing/DuckDuckGo HTML endpoints. DuckDuckGo served CAPTCHAs and Bing's HTML endpoint frequently dropped quoted terms, so coverage of the tail of ARCH's 2026 activity is likely incomplete rather than exhaustive. Several publishers (Business Wire, Endpoints News, Fierce Biotech/Healthcare, Ecosia, Mojeek, ArcticStartup, FinSMEs, Sleep Review, MobiHealthNews) returned HTTP 403 to direct fetches.

---

### ARCH Venture Partners

**HQ finding:** Chicago, IL. Confirmed via SEC Form D for ARCH Venture Fund XIV, L.P. (CIK 0002138046), issuer address 8755 W. Higgins Road, Suite 1025, Chicago, IL 60631. All ARCH Venture Fund entities VIII–XIV are registered in Illinois. **In scope.**

#### URLs opened
- https://www.archventure.com/news — 2026 news items enumerated
- https://www.archventure.com/news/ — full listing incl. pagination
- https://www.archventure.com/news/page/2/ — 2024–2025 items only
- https://www.archventure.com/companies/ — HTTP 404
- https://www.archventure.com/arch-backed-sonothera-secures-series-b-funding-to-advance-safer-gene-therapies/ (referenced from news index)
- https://vizgen.com/vizgen-announces-48-million-financing/ — fetched OK
- https://www.prnewswire.com/news-releases/create-medicines-announces-122-million-series-b-financing-to-advance-in-vivo-car-pipeline-in-autoimmune-disease-and-oncology-302771778.html — fetched OK
- https://ollin.bio/press-releases/ollin-biosciences-announces-oversubscribed-330-million-series-b-financing-to-advance-global-phase-3-development-of-oln324-in-dme-and-wet-amd-studies-commencing-in-second-half-of-2026/ — fetched OK
- https://www.biospace.com/press-releases/salma-health-launches-integrated-brain-health-center-of-excellence-ushering-in-a-new-era-for-comprehensive-brain-care-technology-and-research — fetched OK
- https://briefglance.com/articles/moleculent-secures-20m-to-map-the-secret-conversations-between-cells — fetched OK
- https://pulse2.com/trase-raises-107-million-seed-round-led-by-arch-venture-partners/ — fetched OK
- https://medcitynews.com/2026/08/happy-health-snags-75m-to-support-home-based-care/ — fetched OK
- https://dealroom.co/news/145590-happy-health-lands-75m-series-a-to-move-care-into-the-home-starting-with/ — fetched OK
- https://www.moleculent.com/news and /newsroom/ — pages render without article text
- https://www.fiercebiotech.com/biotech/fierce-biotech-fundraising-tracker-26 — HTTP 403
- https://www.fiercehealthcare.com/finance/happy-health-secures-75m-ai-driven-home-based-care-platform — HTTP 403
- https://endpoints.news/arch-venture-partners-targets-3-billion-raise-for-latest-fund/ — HTTP 403
- https://arcticstartup.com/moleculent-raises-20m/ — HTTP 403
- https://www.businesswire.com/news/home/20260625167565/... (Trase) — HTTP 403
- https://www.finsmes.com/2026/08/happy-health-raises-75m-in-series-a-funding.html — HTTP 403
- https://www.mobihealthnews.com/news/trase-lands-107m-scale-ai-agents-healthcare-and-high-stakes-industries — HTTP 403
- https://r.jina.ai/https://endpoints.news/... — HTTP 401
- https://www.sec.gov/cgi-bin/browse-edgar?company=ARCH+Venture&type=D&... — fetched OK
- https://efts.sec.gov/LATEST/search-index?q=%22ARCH%20Venture%20Fund%20XIV%22... — fetched OK
- https://www.sec.gov/Archives/edgar/data/2138046/000101297526000844/0001012975-26-000844-index.htm — fetched OK
- https://www.sec.gov/Archives/edgar/data/2138046/000101297526000844/primary_doc.xml — fetched OK

#### Searches run (before budget exhaustion)
"ARCH Venture Partners led Series A 2026"; "ARCH Venture Partners led Series B 2026"; "ARCH Venture Partners led 2026"; "ARCH Venture Partners participated round 2026"; "ARCH Venture Partners" site:businesswire.com 2026 financing; "ARCH Venture" 2026 "Series A" biotech financing; ARCH Venture Partners Fund XIV $3 billion 2026 SEC filing; ARCH Venture Partners 14th fund $3 billion August 2026; SonoThera $125M Series B; Trase $107M seed; Oratomic $300M Series A; Happy Health $75M Series A; CREATE Medicines $122M Series B; AIRNA $155M Series B; Vizgen $48M.

#### 2026 deals found (10 recorded)
| Date | Company | Round | Amount | ARCH role |
|---|---|---|---|---|
| 2026-01-08 | Vizgen (Waltham, MA) | growth financing | $48M | lead |
| 2026-02-23 | Syndex Bio (Cambridge, UK) | seed | $15.5M | lead |
| 2026-02-26 | Salma Health (San Mateo, CA) | Series A | $80M | co-lead (with Mubadala Capital) |
| 2026-04-30 | Moleculent AB (Stockholm) | financing | $20M | participant (lead: Rubicon Healthcare Partners) |
| 2026-05-14 | CREATE Medicines (Cambridge, MA) | Series B | $122M | co-lead (with Newpath, Hatteras) |
| 2026-06-10 | SonoThera | Series B | $125M | participant (lead: Vida Ventures) |
| 2026-06-24 | Ollin Biosciences (Austin, TX) | Series B | $330M | co-lead (with TCGX) |
| 2026-06-25 | Trase | seed | $107M | lead |
| 2026-07-07 | Oratomic (Pasadena, CA) | Series A | $300M | co-lead (with Spark, Khosla) |
| 2026-08-18 | Happy Health (Austin, TX) | Series A | $75M | co-lead (with OpenLoop) |

#### Fund event
- **ARCH Venture Fund XIV, L.P.** — Form D filed 2026-08-31 with SEC. $3.0B total offering amount, $0 sold, first sale yet to occur. Recorded in g7-funds.json with evidence_class `filing`.

#### 2026 items deliberately EXCLUDED from deployments (exits/IPOs/non-financings, not capital deployed by ARCH)
- 2026-01-07 — D-Wave Quantum acquires ARCH-backed Quantum Circuits (exit)
- 2026-02-27 — Generate Biomedicines IPO, $400M (exit/public offering, not an ARCH round)
- 2026-04-28 — Paradigm Health FDA partnership (no financing)
- 2026-05-01 — Seaport Therapeutics public debut, $225M (IPO)
- 2026-05-26 — ARCH-backed vaccine company to be acquired by Lilly for up to $1.55B (exit)
- 2026-06-10 — Parabilis Medicines IPO, $670M (IPO)
- 2026-06-17 — Kardigan IPO, $400M (IPO)
- 2026-04-11 / 2026-02-19 — personnel/recognition items (Carol Suh 40 Under 40; NVCA Rising Stars)

#### Out-of-window items checked and rejected
- **AIRNA $155M Series B** — surfaced repeatedly in searches with ARCH as a participant, but Business Wire release is dated **2025-04-01**. Outside the 2026-01-01..2026-09-04 window. Not recorded.
- Tenvie Therapeutics $200M launch financing (January 2025) — out of window.
- ARCH Venture Fund XIII $3B+ close (September 2024) — out of window.

#### Known coverage gaps
Aggregator summaries indicated ARCH made roughly 13 investments in calendar 2026 as of August. Ten are documented above; the remainder could not be enumerated once the search budget ran out and DuckDuckGo/Bing HTML endpoints stopped returning usable results. Anything not confirmed against a fetched primary or outlet page was left out rather than guessed.

---

### Polsky Center funds at the University of Chicago (George Shultz Innovation Fund, Transform, Duality)

**HQ finding:** Chicago, IL — Polsky Center for Entrepreneurship and Innovation, University of Chicago (Hyde Park / Hyde Park Labs). **In scope.**

#### URLs opened
- https://polsky.uchicago.edu/ — no direct fund links on homepage
- https://polsky.uchicago.edu/news/ — 2026 items, page 1
- https://polsky.uchicago.edu/news/page/2/ — 2026 items
- https://polsky.uchicago.edu/news/page/3/ — 2026 items
- https://polsky.uchicago.edu/news/page/4/ — 2026 items
- https://polsky.uchicago.edu/news/page/5/ — Jan–Feb 2026 items
- https://polsky.uchicago.edu/programs-events/ — full program/fund index
- https://polsky.uchicago.edu/programs-events/innovation-fund/ — George Shultz Innovation Fund overview
- https://polsky.uchicago.edu/programs-events/george-shultz-innovation-fund/ — HTTP 404 (redirect target is /innovation-fund/)
- https://polsky.uchicago.edu/programs-events/duality/ — Duality accelerator overview
- https://polsky.uchicago.edu/get-funding/ — HTTP 404
- https://polsky.uchicago.edu/?s=Transform+fund — site search for "Transform"
- https://polsky.uchicago.edu/2026/06/17/george-shultz-innovation-fund-awards-250k-to-parasol-medtech-and-signl/
- https://polsky.uchicago.edu/2026/03/26/george-shultz-innovation-fund-announces-4-finalists-pitching-for-potential-investment/ (indexed, headline read)
- https://polsky.uchicago.edu/2026/04/02/cavilinq-secures-8-8m-seed-round-to-unlock-utility-scale-quantum-computing/
- https://polsky.uchicago.edu/2026/03/31/memq-closes-10m-series-a-funding-round/

#### George Shultz Innovation Fund
Seed-stage fund investing up to $250,000 in ventures out of UChicago, Argonne National Laboratory, Fermilab and the Marine Biological Laboratory. Lifetime: $10.4M across 83 startups over 15 years; awardees have raised $327M+ in follow-on.

**2026 investments (recorded):**
- **2026-06-17 — Parasol Medtech, $250,000.** Minimally invasive device to reduce stroke risk in atrial fibrillation. Founder Atman Shah (UChicago Medicine); CEO Evan Singer.
- **2026-06-17 — Signl, $250,000.** Immune-modulating medicines to cut vaccine side effects. Cofounders Aaron Esser-Kahn (UChicago PME) and Jeremiah Kim.
- 2026-03-26 — four finalists announced for pitch; the June 17 article is the outcome. No other 2026 awards found.

**Portfolio follow-on rounds noted but NOT recorded as 2026 Polsky deployments:**
- **CavilinQ, $8.8M seed, 2026-04-02** — led by QVT with Safar Partners, MFV Partners, Serendipity Capital, Harper Court Ventures. The Shultz Fund's $150,000 was awarded in **2025** and was explicitly not part of this round. Excluded.
- **memQ, $10M Series A, 2026-03-31, Chicago IL** — the Polsky article notes the Shultz Fund invested in memQ in **2022**; the Series A investor list is not disclosed and no 2026 Polsky participation is stated. Excluded.

#### Transform (Transform Accelerator for Data Science & Emerging AI Startups)
Site search returned cohort announcements for 2023 (launch, cohort 2) and 2025 (cohort 4). **No 2026 activity found.** It is an accelerator program rather than a capital-deploying fund; no 2026 cohort announcement or investment appears in the Polsky news index for Jan–Sep 2026.

#### Duality
12-month accelerator for quantum and enabling-technology startups, run by the Polsky Center with the Chicago Quantum Exchange, UIUC, Argonne and P33. The program page does not state that Duality makes direct capital investments, and no 2026 cohort or investment announcement appears. **No 2026 activity found.** (One related 2026 item — "Corporate Collision Connects Quantum Startups and Corporate Partners", 2026-04-10 — is an event, not an investment.)

#### Other 2026 Polsky awards deliberately excluded (prize money, not venture investment)
- 2026-06-05 — Edward L. Kaplan New Venture Challenge, $2.1M awarded across winners (Slideflow Labs first place)
- 2026-06-05 — Global New Venture Challenge, $435,000 awarded (Phinorm and Morton Labs tied)
- 2026-03-06 — College New Venture Challenge, $330,000 (Paytera first place)
- 2026-08-13 — 8 Polsky Founders' Fund Fellowships awarded

---

### Northwestern University N.XT Fund

**HQ finding:** Evanston, IL (Chicago metro) — Northwestern University, run out of the Office for Research / INVO. Recorded as Chicago per this group's assignment, with the Evanston address noted in each record. **In scope.**

#### URLs opened
- https://nxt.northwestern.edu/ — fund overview page, fetched OK
- https://nxt.northwestern.edu/portfolio/ — portfolio by funding year, fetched OK
- https://nxt.northwestern.edu/news/ — HTTP 404 (no news page exists)
- https://invo.northwestern.edu/ — no N.XT link
- https://invo.northwestern.edu/nxt-fund/ — HTTP 404
- https://www.invo.northwestern.edu/innovation-commercialization/ — no N.XT reference
- https://www.northwestern.edu/nxt/ — HTTP 403
- https://www.northwestern.edu/nxtfund/ — HTTP 404
- https://www.research.northwestern.edu/nxt-fund/ — HTTP 404
- https://news.northwestern.edu/?s=N.XT+Fund — no matching results returned
- https://www.bing.com/search?q=%22N.XT+Fund%22... and site:northwestern.edu variants — Bing dropped the quoted term and returned unrelated results

#### Findings
The N.XT Fund is Northwestern's pre-seed/seed vehicle for faculty-initiated ventures, described as self-sustaining and sector-agnostic, focused on de-risking university assets past the "valley of death". Fund size and manager names are not published. Aggregate portfolio metrics on the site: 94 employees, 30 products, $94.7M raised across the portfolio.

**2026 funding-year portfolio companies (recorded, investor-attested):**
- **Amino** — regenerative peptide technology for skincare
- **AtomoAi** — AI-powered tumor segmentation platform
- **GoEco** — PFAS-free graphene oxide coating for food packaging

The portfolio page groups companies by funding year only. **No announcement dates and no investment amounts are published anywhere on the N.XT site, and no independent press coverage of these three investments was found.** `date_announced` and `amount_usd` are therefore null in g7-deployments.json. Because the site lists them under funding year 2026, they are within the calendar year, but it cannot be confirmed from the source that each fell on or before 2026-09-04.

---

### Ampersand Capital Partners — EXCLUDED

**HQ finding:** **Boston, MA** — One Post Office Square, Suite 2900, Boston, MA 02109. Additional offices in Amsterdam, Netherlands and London, UK. Confirmed from the firm's own site.

The brief flagged a believed HQ of Wellesley, MA; the current HQ of record is Boston, MA (the firm appears to have moved from Wellesley). Either way it is **not a Chicago firm**, and there is no Chicago office. **Marked excluded. No deals researched or included.**

#### URLs opened
- https://www.ampersandcapital.com/ — fetched OK

---

### Level Equity — EXCLUDED

**HQ finding:** **New York, NY** — 140 East 45th Street, 42nd Floor, New York, NY 10017. Confirmed from the firm's own site. No Chicago office listed.

Matches the brief's stated belief. **Marked excluded. No deals researched or included.**

#### URLs opened
- https://www.levelequity.com/ — fetched OK

---

### 1871 fund vehicles / 1871 Ventures

**HQ finding:** Chicago, IL (1871 is a Chicago non-profit tech incubator; the site notes an office relocation in 2026). **In scope by geography.**

#### URLs opened
- https://1871.com/ — homepage, fetched OK
- https://1871.com/blog/ — blog index, fetched OK
- https://1871.com/news/ — HTTP 404 (no such path)

#### Findings
1871 presents itself as a 501(c)(3) non-profit innovation hub built around membership, innovation labs, events and community programming. **Neither the homepage nor the blog index makes any reference to "1871 Ventures", a fund, or any investment vehicle**, and no portfolio, LP, or capital-deployment page exists on the site. The only 2026 content surfaced was the 2026 Momentum Awards finalists announcement and a note about the office relocation — neither is an investment.

**No 2026 activity found.**

Caveat: the site's search could not be exercised and third-party search was unavailable at this point in the session, so the existence of a separate, differently-branded 1871-affiliated fund entity cannot be ruled out — it simply is not present on 1871's own web properties.

---

### Other Chicago investors discovered

Turned up incidentally while researching this group. Not part of g7 and not researched further; listed for possible assignment elsewhere.

- **Harper Court Ventures** — Chicago (Hyde Park). Participated in CavilinQ's $8.8M seed round announced 2026-04-02. Source: https://polsky.uchicago.edu/2026/04/02/cavilinq-secures-8-8m-seed-round-to-unlock-utility-scale-quantum-computing/
- **ARCH Development Partners** — a separate Illinois firm distinct from ARCH Venture Partners; surfaced repeatedly in searches as a near-name collision. Worth de-duplicating in any Chicago investor list.
- **P33** — Chicago civic tech non-profit; founding collaborator on the Polsky/Chicago Quantum Exchange Duality accelerator. Programmatic rather than an investor, but Chicago-based.
- **Chicago Quantum Exchange** — UChicago-anchored consortium co-directing Duality; not a capital deployer.
- **Alchemist Chicago** — Polsky-run deep-tech accelerator (Phase 2 cohort announced 2026-01-21); may make small investments as part of the Alchemist model. Not verified.

#### Name-collision warnings for downstream deduping
- **"Arch"** (arch.co), an alternative-investments wealthtech platform, raised a $52M Series B in 2026 led by Oak HC/FT and added MUFG Innovation Partners and Franklin Templeton in July 2026. **Unrelated to ARCH Venture Partners.** Do not merge.
- **ARK Venture Fund** SEC filings (CIK 0001905088) surface on "ARCH Venture" fund searches. Unrelated.

---


# Lane g8 — LongJump, Purple Arch, Bluestein, Great North, Chicago Early Growth, GreatPoint, Cultivation, Chicago angels

## Group g8 research notes — Chicago investors, 2026-01-01 through 2026-09-04

Research date: 2026-09-04. Window enforced strictly: nothing before 2026-01-01 or after 2026-09-04 was recorded as an in-window event.

### Method / tooling caveat (read this first)

The session's WebSearch budget (200 calls) was exhausted globally partway through this task. After that point all research was done with WebFetch, using **Brave Search** (`search.brave.com`, worked until it began returning HTTP 429) and **Yahoo Search** (`search.yahoo.com`, worked reliably) as fetchable search front-ends. Several target domains refuse WebFetch:

- `nosh.com` — HTTP 403
- `foodbusinessnews.net` — HTTP 403
- `finsmes.com` — HTTP 403
- `chicagobusiness.com` (Crain's) — HTTP 403 (paywall)
- `markets.businessinsider.com` — blocked by the fetch tool
- `mojeek.com`, `ecosia.org` — HTTP 403; `duckduckgo.com` — CAPTCHA

Where a URL could not be fetched, the entry says so and relies on search-result titles/snippets from independent publishers. Nothing was recorded from memory, and no deal, amount, date, or role was invented — unverifiable fields are `null` or empty with an explanation.

---

### LongJump

URLs opened:
- https://longjump.vc/ (fetched — portfolio + HQ)
- https://longjump.vc/updates (HTTP 404)
- https://search.brave.com/search?q=%22LongJump%22+VC+Chicago+2026+pre-seed+invested+round
- https://search.yahoo.com/search?p=%22LongJump%22+venture+2026+pre-seed+investment+announced
- WebSearch: "LongJump ventures Chicago pre-seed 2026 investment"; "LongJump Chicago VC 2026 pre-seed round invested"; "LongJump investor 2026 seed funding announced Chicago startup"

**HQ finding: Chicago, IL — CONFIRMED** (site self-describes as "a first-check venture fund, based in Chicago"; Midwest focus with a strong bias toward Chicago). Fund invests ~$110K first checks; $50K–$110K per aggregator profiles. Founded by Aimee Schuster, Brian Golinvaux, Matt Meltzer, Jennifer Fried, Jeremie Bacon, Jeffrey Eschbach, David Kalt.

Portfolio names visible on longjump.vc (no dates attached, so none can be placed in the 2026 window): Avant Health, Eventnoire, DeepWalk Research, Evergreen, Bilin Academy, Blip Energy, Science on Call, Freshx, Rivet. Site claims 48 investments and $79M raised by portfolio companies post-investment.

Aggregator signals on last-known deal are inconsistent and all pre-window: PitchBook snippet says latest investment **2025-12-16 in Rise Reforming**; another aggregator says GridLink, Seed, 2025-05-14; another says Fovionics, $120K seed, March 2025. All before 2026-01-01.

One 2026-dated LongJump page exists — `https://longjump.vc/updates/the-raise-2026-a-look-back` (2026-03-30), which is a recap of "The Raise," LongJump's pre-seed fundraising *program* for founders. It is not an investment announcement and no company/amount could be extracted (the `/updates` index 404s).

**No 2026 activity found.** (No 2026 deal or fund with a datable, publisher-sourced record.)

---

### Purple Arch Ventures

URLs opened:
- https://www.av.vc/funds/purplearch (fetched)
- https://search.brave.com/search?q=%22Purple+Arch+Ventures%22+2026+investment
- https://search.brave.com/search?q=Qumis+funding+round+2026+seed+insurance+AI
- https://www.globenewswire.com/news-release/2026/02/19/3241222/0/en/qumis-raises-4-3m-to-bring-attorney-grade-coverage-intelligence-to-commercial-insurance.html (fetched)
- https://search.brave.com/search?q=%22Hopscotch+Primary+Care%22+funding+2026+round+raises
- WebSearch: "Purple Arch Ventures Northwestern 2026 investment"

**HQ finding: Evanston / Chicago-area affiliation, but the *manager* is not Chicago-HQ.** Purple Arch Ventures is an Alumni Ventures fund for Northwestern alumni. Alumni Ventures' own office address on the fund page is **670 N. Commercial Street, Suite 403, Manchester, NH 03101**. Some directories list Purple Arch at Evanston, IL. Treat as an alumni-affiliated vehicle, not an independent Chicago GP — flagging for the orchestrator to decide whether it belongs in a Chicago-HQ dataset.

Three 2026-dated deals are attributed to Purple Arch funds by **PitchBook fund pages only** (surfaced as Brave snippets). I chased each and could NOT find any publisher or press release naming Purple Arch or Alumni Ventures as a participant, so **none are in the JSON**:

1. **Qumis** — 2026-02-19, attributed to Purple Arch Ventures Fund 6 by PitchBook (https://pitchbook.com/profiles/fund/21069-01F). The underlying round is real and well-documented: Qumis (Chicago, qumis.ai) raised a **$4.3M oversubscribed seed led by MTech Capital**, with new strategic investor American Family Ventures and "all prior investors," announced 2026-02-19 via GlobeNewswire (release fetched directly and read in full). Also covered by FinTech Global (2026-02-20) and Chicago Business Journal (2026-02-19). **The release does not name Purple Arch or Alumni Ventures.** Total funding to date $6.75M including a $2.2M pre-seed in Jan 2025. *This is a legitimate Chicago-company 2026 seed round if the orchestrator wants it under MTech Capital / American Family Ventures — neither of which is Chicago-HQ.*
2. **Hopscotch Primary Care** — 2026-08-18, attributed to Purple Arch Fund 7 by PitchBook (https://pitchbook.com/profiles/fund/23579-20F). Underlying round is real: **$53M Series D led by 8VC and Townhall Ventures**, with AIF, John Doerr, Richard Merkin and the Leon Levine Foundation; covered by PR Newswire, Fierce Healthcare, FinSMEs and the company's own newsroom (hellohopscotch.com, 2026-08-18). Purple Arch is not named in any of them.
3. **BeatpulseLabs** — 2026-06-08, attributed to Purple Arch Fund 9 by PitchBook (https://pitchbook.com/profiles/fund/27297-64F). No publisher coverage located at all; not pursued further.

Alumni Ventures funds typically invest via SPVs and are routinely omitted from round press releases, which is the likely explanation. Recommend the orchestrator treat these as PitchBook-only leads needing a paid-database confirmation.

**No 2026 activity found that meets the evidence bar.**

---

### Bluestein Ventures

URLs opened:
- https://www.bluesteinventures.com/ (fetched — HQ + portfolio)
- https://www.bluesteinventures.com/news (HTTP 404)
- https://bluesteinventures.substack.com/archive (fetched — full post list)
- https://www.greenqueen.com.hk/mezcla-plant-based-protein-bar-vegan-funding/ (fetched)
- https://www.nosh.com/news/2026/mezcla-raises-9-5m-series-b-to-fuel-brand-building-distribution-expansion/ (403)
- https://www.foodbusinessnews.net/articles/29957-mezcla-raises-95-million (403)
- https://natlawreview.com/press-releases/aux-labs-secures-4m-commercialize-precision-fermentation-cheese-platform (fetched)
- https://search.yahoo.com/search?p=%22Bluestein+Ventures%22+2026+led+seed+round+invests
- WebSearch: "Bluestein Ventures 2026 investment round food"; "Mezcla Series B 2026 funding Bluestein Ventures"; "Auxlabs funding round 2026 Bluestein"

**HQ finding: Chicago, IL — CONFIRMED.** 415 N LaSalle Drive, Suite 700A, Chicago, IL 60654. Founded 2014. Food/ag thesis across four areas: high-growth consumer brands, proprietary foodtech, next-gen commerce, value-add digital technology. Pre-seed through Series A, checks $250K–$1M.

#### Deals found (both in JSON)

1. **Mezcla — $9.5M Series B, announced 2026-03-02, Bluestein LED.** Co-investors Santatera Capital, Grupo DMI, Lever VC, Habitat Partners, Tonic Ventures, angel Steve Platt; SG Credit Partners debt. Bluestein venture partner Lindsay Levin (ex-RXBAR CMO) joined the board. Company HQ New York, NY. Total raised $16.5M; 128% CAGR since 2022; ~9,000 retail doors. Three publishers (NOSH, Green Queen, Food Business News) — `two_sources`.
2. **AuX Labs — $4M, announced 2026-04-21, Bluestein PARTICIPANT.** Led by NYA Ventures and Nàdarra Ventures; also Verdex Capital, Builders VC, Congruent Ventures. Company HQ Toronto (precision-fermentation dairy proteins for cheese; CEO Ted Jin). Round type not stated in the release, so not invented. Marked `single_source`: National Law Review and Globe and Mail are both carriers of the same GlobeNewswire release, and Private Capital Journal restates it.

#### Funds
Fund III ($45M) closed **February 2024** — outside the window. The Substack archive's most recent post is 2025-01-14 ("Microplastics Everywhere"); there are **no 2026 posts**. **No 2026 fund event found.**

---

### Great North Ventures — EXCLUDED

URLs opened:
- https://greatnorthventures.com/ (via search result)
- WebSearch: "Great North Ventures headquarters Minneapolis fund 2026"

**HQ finding: Maple Grove, MN (Minneapolis metro) — NOT Chicago.** Founded 2017 by twin brothers Rob and Ryan Weber. Fund I $23.7M; Fund II $40M closed May 2022. Aggregators show a 2026-08-27 investment in Yardstik.

**EXCLUDED per instructions — Minnesota-HQ, not Chicago. No deals included in the JSON files.**

---

### Chicago Early Growth Ventures (CEGV)

URLs opened:
- https://chicagoearly.com/ (fetched)
- https://search.brave.com/search?q=%22Low+Rate%22+startup+funding+2026+%22Chicago+Early+Growth+Ventures%22
- WebSearch: "Chicago Early Growth Ventures 2026 investment"

**HQ finding: Chicago, IL — CONFIRMED.** Founded 2019; seed-stage angel-style vehicle, diversification thesis ("a wider portfolio of careful bets"), invests nationwide from a Chicago base. Roughly 113 investments per PitchBook.

Portfolio listed on chicagoearly.com (no dates on the site, so nothing datable to 2026): VKTRY Gear (exit), Albiware, Adrenaline, Bridge Money, Flow Medical Solutions, Houndsy, Hypernym, Inhabitr, Juxta, Pacas, Reloshare, Taelor, When, Workbox, SpaceX, Science On Call, Synopsis, Quicklly.

Aggregators conflict: PitchBook snippet says latest investment **2026-04-16 in Low Rate Co.** (thrifts/mortgage finance); Tracxn says CEGV has made **no** investments in 2026. No publisher coverage of a "Low Rate Co." round could be found under any spelling, so it is not recorded. Two portfolio-level 2026 events surfaced from aggregators but are not CEGV deployments: portfolio company **Anthill acquired by Humanly (April 2026)**, and a claimed **SpaceX NASDAQ listing (June 2026)** — the latter is an unverified aggregator claim and should not be relied on.

**No 2026 activity found** (no publisher-sourced 2026 deployment).

---

### GreatPoint Ventures — EXCLUDED

URLs opened:
- WebSearch: "GreatPoint Ventures San Francisco headquarters 2026"
- Tracxn / PitchBook / ZoomInfo profile snippets

**HQ finding: San Francisco, CA — 744 Montgomery St, Suite 500, San Francisco, CA 94111. NOT Chicago.** Founded 2015. Aggregators indicate ~4 investments in 2026 as of July 2026.

**EXCLUDED per instructions — California-HQ. No deals included in the JSON files.**

---

### Cultivation Capital — EXCLUDED (documented only)

URLs opened:
- https://cultivationcapital.com/contact/ (via search result)
- WebSearch: "Cultivation Capital St. Louis headquarters 2026"

**HQ finding: St. Louis, MO — CONFIRMED. 911 Washington Avenue, Suite 801, St. Louis, MO 63101.** Founded 2012. ~$416M AUM per FINTRX. 48 team members, 31 partners. Initial checks $100K–$3.5M; leads roughly half its rounds; 150+ companies across 25+ states/countries. Sector focus: technology, life sciences, agriculture, geospatial.

**It does operate a Chicago office** (satellite offices listed in Greenville, Philadelphia and Chicago), which is presumably why it landed on the list — but the HQ is unambiguously St. Louis.

**CONFIRMED AND EXCLUDED per instructions. Documented here only; no deals collected or included.**

---

### Chicago Angels / Chicago-area angel groups

#### IrishAngels (Notre Dame–affiliated, Chicago-HQ)

URLs opened:
- https://irishangels.com/portfolio/ (fetched)
- https://search.yahoo.com/search?p=%22IrishAngels%22+2026+funding+round+led+participated
- WebSearch: "Irish Angels / IrishAngels Chicago angel group 2026 investment"; "Snag funding round 2026 IrishAngels seed"

**HQ finding: Chicago, IL** (Notre Dame–affiliated angel network founded 2012; Built In Chicago lists a Chicago office; Managing Director Caroline Gash). Note the portfolio page also advertises a Business Insider nod as an important VC in the Rocky Mountain region and a Colorado connection through Gash — so the team is at least partly distributed. ~300 members, $53M–$70M deployed across 80–110+ companies, average check $250K–$350K, targets seed rounds of $1M–$3M.

One 2026 lead, unconfirmed: PitchBook/Tracxn snippets say IrishAngels' latest investment was **2026-07-01 in "Snag"** (social/platform software). There are multiple companies named Snag and no publisher coverage of the round could be located; PitchBook's own description points to an NFT-marketplace company founded 2022, which does not obviously match. **Not recorded** — aggregator-only, ambiguous company identity.

**No 2026 activity found** that meets the evidence bar.

#### Wintrust Ventures

URLs opened:
- https://www.wintrust.com/business-solutions/mid-market/lending/ventures.html (via search results)
- https://search.yahoo.com/search?p=%22Wintrust+Ventures%22+2026+investment
- WebSearch: "Wintrust Ventures 2026 investment Chicago"

**HQ finding: Rosemont, IL (Chicago metro) — corporate venture arm of Wintrust Financial.** Founded 2015. Typical investment $1–5M, sector-agnostic, requires a Chicago-area HQ or nexus. Known portfolio: OneCause, Packback, The Mom Project, Megalytics. Crunchbase showed a 5-company portfolio and 0 exits as of 2026-07-13.

The only 2026-dated Wintrust news located was `https://www.wintrust.com/articles/2026/07/wintrust-investments-expands-financial-advisor-team-in-q2-2026.html`, which is about the wealth-management advisor team, not venture investing.

**No 2026 activity found.**

#### Sixty8 Capital

Not researched in depth — searched only incidentally and no 2026 Chicago-relevant result surfaced before the search budget ran out. **Note for the orchestrator: Sixty8 Capital is an Indianapolis, IN–based fund (Allos Ventures affiliate), not Chicago-HQ**, so on the stated exclusion rule it would be out of scope anyway. Flagged as unverified in this pass — worth a 5-minute HQ confirmation if it matters.

#### Hyde Park Angels
Not researched — covered by another group per the assignment.

---

### Other Chicago investors discovered

This is the discovery pass. Items marked **[IN JSON]** were well-sourced enough to include; the rest are leads for the orchestrator to follow up.

#### Funds / fundraises

1. **Jump Capital — $350M fund, ~2026-07-28 [IN JSON: g8-funds.json]**
   Chicago-HQ (600 W Chicago Ave). Largest-to-date; AI, fintech, blockchain/crypto infrastructure, cybersecurity, vertical B2B software. Ordinal disputed: Chicago Business Journal says "eighth institutional fund," Cryptonomist and Value Add Pulse say "seventh venture fund."
   - https://www.bizjournals.com/chicago/news/2026/07/29/jump-capital-venture-capital-firm-350-million-fund.html (2026-07-29)
   - https://www.theinformation.com/newsletters/dealmaker/jump-capital-raises-350-million-fund-ai-investments (2026-07-28)
   - https://en.cryptonomist.ch/2026/07/29/jump-capital-crypto-fund/ (2026-07-29)
   - https://valueaddvc.com/pulse/jump-capital-350-million-ai-fund-2026 (2026-07-28)
   - https://pro.edgex.exchange/en-US/news/article/jump-capital-350m-fund-crypto-focus (2026-07-30)

2. **Permanent Capital Ventures — Fund II, $200M, closed 2026-08-27 [IN JSON: g8-funds.json]**
   Chicago-HQ, founded early 2024 by Mike Gamson (ex-Relativity CEO) and Jason Duboe. Series A applied-AI focus, technical founders building go-to-market. $350M+ raised total since inception.
   - https://www.chicagobusiness.com/technology/ccb-gamson-permanent-capital-ventures-raises-200m/ (Crain's, 2026-08-27)
   - https://www.bizjournals.com/chicago/news/2026/08/27/mike-gamson-permanent-capital-ventures-capital.html (2026-08-27)
   - https://vcwire.tech/2026/08/28/permanent-capital-ventures-closes-second-200m-fund/ (2026-08-28)
   - https://fundmomentum.vc/blog/permanent-capital-ventures-200m-fund-ii-applied-ai-series-a-2026 (2026-08-27)

3. **G Squared — G Squared VII, $2.3B final close, 2026-08-05 [IN JSON: g8-funds.json]**
   Chicago-HQ; private secondary market / growth-stage tech. Largest fund in firm history, roughly its prior two funds combined. Counsel: Goodwin Procter.
   - https://markets.businessinsider.com/news/stocks/g-squared-announces-final-close-of-2-3b-g-squared-vii-its-largest-flagship-fund-1036413054 (GlobeNewswire via Business Insider, 2026-08-05)
   - https://vcwire.tech/2026/08/06/g-squared-closes-2-3b-fund-vii/ (2026-08-06)
   - https://www.goodwinlaw.com/en/news-and-events/news/2026/08/announcements-privateequity-goodwin-advises-g-squared-final-close-2-3-billion-flagship-fund (2026-08-12)
   - https://pulse2.com/g-squared-closes-2-3-billion-fund-vii (2026-08-14)
   - https://angelinvestorsnetwork.com/venture-capital/g-squared-2-3-billion-fund-venture-secondaries-signal (2026-08-06)

4. **GTCR — inaugural Capital Solutions Fund, $1.25B final close, 2026-07-29 [IN JSON: g8-funds.json, flagged]**
   Chicago-HQ but a private equity / private credit manager, not venture. Drop if the dataset is venture-only.
   - https://www.prnewswire.com/news-releases/gtcr-closes-1-25-billion-capital-solutions-fund-302837130.html (2026-07-29)

5. **Orange & Blue Ventures — launched 2026-02-13 (NOT in JSON)**
   Illinois' first student-led venture capital fund, at UIUC's Gies College of Business, funded by a donation from alumni Douglas and Deborah Ackerman. Champaign, IL — not Chicago; size not disclosed in the source. Single source.
   - https://uif.uillinois.edu/news/221/gies-business-launches-illinois-first-student-led-venture-capital-fund (2026-02-13)

6. **X-Labs Fast Fund — $3M, 2026-07-08 (NOT in JSON)**
   State-of-Illinois-backed vehicle for quantum startups, tied to the Pritzker administration's quantum push; a public program rather than a private investor. Single source.
   - https://www.bizjournals.com/chicago/news/2026/07/08/illinois-quantum-startups-x-labs-pritzker.html (2026-07-08)

7. **Chicago Ventures — NO 2026 fund event.** The Crain's headline "Chicago Ventures raising $75 million fund" that surfaces in searches is **dated 2019-05-24**, not 2026 — a dating trap worth flagging. Fund V closed at $75M in 2023; Fund IV at $60M in 2020. Aggregators show Chicago Ventures is active in 2026 (111 companies, 5 new investments in the trailing 12 months) but no 2026 fundraise was found. HQ 220 N Green St, Chicago; chicagoventures.com carries no news section.

#### Deals by Chicago-HQ firms not on the g8 list

8. **ARCH Venture Partners (Chicago) led Trase Systems' $107M seed, 2026-06-25 [IN JSON: g8-deployments.json]**
   Trase (McLean, VA) builds an agentic OS / AI agents for healthcare, federal government and defense. Participation from Red Cell Partners. Confirm ARCH isn't already assigned to another group before merging.
   - https://www.businesswire.com/news/home/20260625167565/en/ (2026-06-25)
   - https://thesaasnews.com/news/trase-raises-107m-seed/ (2026-06-25)
   - https://startuprise.io/trase-raises-107m-in-seed-funding-led-by-arch-venture-partners/ (2026-06-26)
   - https://www.theinformation.com/briefings/startup-trase-raises-107-million-help-large-firms-adopt-ai (2026-06-24)

9. **Chicago Ventures led Guthrie AI's $4M seed, July 2026 (NOT in JSON — needs a second source and an exact date)**
   Construction tech; Virtual Bid Assistants for the glazing industry. FinSMEs is the only outlet located and finsmes.com returns 403 to WebFetch, so amount/date/lead come from the search snippet only.
   - https://www.finsmes.com/2026/07/guthrie-ai-raises-4m-in-seed-funding.html

10. **Air Energy Inc. (Chicago) closed an undisclosed seed round, July 2026 (NOT in JSON — no amount, no exact date)**
    Solid-state lithium-air batteries for electric aircraft and drones. Round "initiated by" Leslie Ventures with Resolute Venture Partners, **Illinois INVENT**, **Illinois Tech**, and **Evergreen Climate Innovations** (all Illinois-connected investors worth their own follow-up) plus angels. FinSMEs only; 403 to WebFetch.
    - https://www.finsmes.com/2026/07/air-energy-closes-seed-funding-round.html

11. **Qumis (Chicago) $4.3M seed, 2026-02-19 — no Chicago-HQ investor identified (NOT in JSON)**
    Well-documented round (GlobeNewswire release read in full) but led by MTech Capital with American Family Ventures — neither Chicago-HQ. Included here because it is a notable Chicago *company* round and because PitchBook attributes participation to Purple Arch Fund 6 (see Purple Arch section).
    - https://www.globenewswire.com/news-release/2026/02/19/3241222/0/en/qumis-raises-4-3m-to-bring-attorney-grade-coverage-intelligence-to-commercial-insurance.html
    - https://fintech.global/2026/02/20/commercial-insurtech-qumis-raises-4-3m-to-scale-ai-platform/
    - https://www.bizjournals.com/chicago/news/2026/02/19/qumis-chicago-startup-ai-seed-round.html

12. **Other Chicago-area seed investors named in passing, not yet researched:** Bridge Venture Fund (seed-stage, software/marketplaces/consumer brands), Illinois Ventures (its $48M Deep Tech Strategic Fund closed **October 2024** — outside the window, do not record as 2026), Evergreen Climate Innovations, Illinois INVENT, Illinois Tech, Leslie Ventures, Resolute Venture Partners.

#### Macro context for the window
Crain's reports venture capital invested in Chicago-area companies fell to a **seven-year low in 2025**, with Chicago "missing the rebound in venture funding," even as several local firms raised new funds heading into 2026 (https://www.chicagobusiness.com/finance-banking/chicago-missing-rebound-venture-funding). The state is also deploying capital into local funds via the Treasurer's Growth and Innovation Fund (e.g. $7.5M into a Chicago Ventures fund) — a possible thread for finding first closes not covered by the press.

#### Gaps / recommended follow-up
- Re-run the wire-specific queries that the exhausted search budget cut short: `"<investor>" site:prnewswire.com 2026` and `site:businesswire.com 2026` for Bluestein, LongJump, CEGV, IrishAngels and Wintrust.
- Confirm or kill the three PitchBook-only Purple Arch attributions (Qumis, Hopscotch Primary Care, BeatpulseLabs) against a paid database.
- Confirm or kill CEGV's "Low Rate Co." 2026-04-16 attribution and IrishAngels' "Snag" 2026-07-01 attribution.
- Retrieve the FinSMEs Guthrie AI and Air Energy articles from a non-403 path to firm up dates and amounts.
- Confirm Sixty8 Capital's HQ (believed Indianapolis) to formally exclude it.

---

