# Events: Marquee Tier and Event Types

The Events page has two layers:

1. **Spotlight** at the top: curated marquee events (summits, conferences, awards). These are rows in `aggregated_events` with `is_marquee = TRUE`. They do not depend on the scrapers.
2. **Timeline** below: everything upcoming, filterable by event type, format (in person / virtual), and free only. Recurring series (same title + organizer) collapse into one card that lists the other dates.

Migration: `supabase/migrations/20260904000000_events_marquee_and_types.sql`.

## Columns added to `aggregated_events`

| Column | Purpose |
|---|---|
| `event_type` | Format taxonomy (see below). Set by trigger from title + description when NULL. |
| `end_date` | Last day of a multi-day event. NULL means same day as `event_date`. |
| `is_marquee` | Shows the row in the Spotlight section. |
| `marquee_rank` | Lower sorts first inside Spotlight. The rank 1 card is rendered large. |
| `tagline` | One-line editorial blurb shown on Spotlight cards. |

## Event types

`summit`, `conference`, `expo`, `demo_day`, `pitch`, `awards`, `hackathon`, `workshop`, `office_hours`, `panel`, `meetup`.

`classify_event_type(title, description)` assigns one by keyword, title first, description second, defaulting to `meetup`. `category` (ai-ml, web3, networking...) is untouched and remains a topic label.

The page groups types into chips: Summits & Conferences, Demo Days & Pitch, Awards, Workshops, Talks & Panels, Hackathons, Office Hours & AMAs, Meetups & Networking. Chips with zero upcoming events are hidden. Filters live in the URL (`/Events?type=summits&format=virtual&free=1`).

## Adding a marquee event

Insert a `manual` row. `external_id` is a stable slug so re-running the statement updates in place.

```sql
INSERT INTO aggregated_events (
  source, external_id, source_url, title, description, tagline,
  event_date, end_date, start_time, end_time,
  is_virtual, venue_name, venue_address,
  organizer_name, organizer_url, event_type,
  registration_url, is_free, price_info,
  status, is_marquee, marquee_rank, dedup_hash
) VALUES (
  'manual', 'mhub-hardtech-summit-2027', 'https://www.mhubchicago.com/events',
  'mHUB HardTech Summit 2027', 'Description...', 'One-line tagline.',
  '2027-03-04', NULL, '2027-03-04 08:00:00-06', '2027-03-04 18:00:00-06',
  FALSE, 'mHUB', '1623 W Fulton St, Chicago, IL 60612',
  'mHUB', 'https://www.mhubchicago.com', 'summit',
  'https://...', FALSE, 'Ticketed',
  'upcoming', TRUE, 4,
  generate_event_dedup_hash('mHUB HardTech Summit 2027', '2027-03-04', 'mHUB')
)
ON CONFLICT (source, external_id) DO UPDATE SET
  title = EXCLUDED.title, tagline = EXCLUDED.tagline,
  event_date = EXCLUDED.event_date, end_date = EXCLUDED.end_date,
  registration_url = EXCLUDED.registration_url, is_marquee = TRUE,
  marquee_rank = EXCLUDED.marquee_rank, status = 'upcoming', updated_at = NOW();
```

Rules of thumb:

- Verify the date on the organizer's page before seeding. The three seeded events were verified 2026-09-04.
- Leave `is_free = FALSE` for mixed or ticketed events and explain in `price_info`.
- Keep `marquee_rank` sparse (1, 2, 3, ...) and reserve rank 1 for the single most important upcoming event.
- To retire an event early, set `is_marquee = FALSE`. Otherwise it drops out of Spotlight automatically after `end_date`.

Currently seeded: Chicago Venture Summit: Future of Health (Oct 19-20, 2026), 25th Chicago Innovation Awards (Nov 17, 2026), TechChicago Week 2027 (Jul 19-25, 2027). Candidates still needing a confirmed 2026/2027 date: 1871 Momentum Awards, mHUB HardTech Summit, Chicago Booth Private Equity Conference, Chicago Ideas Week, Techstars Chicago Demo Day.

## Data hygiene the page applies

- Rows with `event_date` more than 18 months out are treated as placeholder dates. The migration marks existing ones `is_duplicate = TRUE`; the page also caps its query at 18 months.
- Titles matching mailing-list or ticket-giveaway promos are hidden client-side.
- `update_event_statuses()` now uses `COALESCE(end_date, event_date)` so a multi-day event is not marked past after its first day.

## Known pipeline issue (as of 2026-09-04)

The scheduled sync reports success and finds roughly 158 events per run (42 Meetup, 18 Luma, 98 Eventbrite) but creates 0. In `supabase/functions/sync-events/index.ts` the `created` count equals the number of events that pass `isValidEvent()` after `standardizeEvent()`, so every standardized event is being rejected as invalid (missing a NOT NULL field such as `start_time` or `source_url`). The last rows that actually landed are from 2026-01-28. The edge function logs will show `skipping invalid event: <reason>` lines that name the failing field.
