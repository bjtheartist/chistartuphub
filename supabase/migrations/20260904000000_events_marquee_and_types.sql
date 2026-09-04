-- ===========================================
-- Events: marquee spotlight tier + event-type taxonomy
-- ===========================================
-- Why:
--   1. The Events page needs to spotlight marquee gatherings (summits,
--      conferences, awards) regardless of what the scrapers happen to
--      return. Marquee events are curated rows (source = 'manual') with
--      is_marquee = TRUE, a rank, a one-line tagline, and an end_date
--      so multi-day events stay visible until they finish.
--   2. `category` mixes topic (ai-ml, web3) with format (workshop, pitch).
--      `event_type` is a clean FORMAT taxonomy the UI filters on.
--
-- event_type values (format, not topic):
--   summit, conference, expo, demo_day, pitch, awards, hackathon,
--   workshop, office_hours, panel, meetup
--
-- Safe to re-run: every statement is IF NOT EXISTS / OR REPLACE / ON CONFLICT.

-- -------------------------------------------
-- 1. Columns
-- -------------------------------------------
ALTER TABLE aggregated_events
  ADD COLUMN IF NOT EXISTS event_type   TEXT,
  ADD COLUMN IF NOT EXISTS end_date     DATE,
  ADD COLUMN IF NOT EXISTS is_marquee   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marquee_rank INTEGER,
  ADD COLUMN IF NOT EXISTS tagline      TEXT;

COMMENT ON COLUMN aggregated_events.event_type   IS 'Format taxonomy: summit, conference, expo, demo_day, pitch, awards, hackathon, workshop, office_hours, panel, meetup';
COMMENT ON COLUMN aggregated_events.end_date     IS 'Last day of a multi-day event. NULL means same day as event_date.';
COMMENT ON COLUMN aggregated_events.is_marquee   IS 'Curated spotlight tier shown at the top of the Events page.';
COMMENT ON COLUMN aggregated_events.marquee_rank IS 'Lower = more prominent within the spotlight. NULL sorts last.';
COMMENT ON COLUMN aggregated_events.tagline      IS 'One-line editorial blurb for spotlight cards.';

ALTER TABLE aggregated_events
  DROP CONSTRAINT IF EXISTS aggregated_events_event_type_check;
ALTER TABLE aggregated_events
  ADD CONSTRAINT aggregated_events_event_type_check
  CHECK (event_type IS NULL OR event_type IN (
    'summit','conference','expo','demo_day','pitch','awards',
    'hackathon','workshop','office_hours','panel','meetup'
  ));

CREATE INDEX IF NOT EXISTS idx_agg_events_type ON aggregated_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agg_events_marquee
  ON aggregated_events(marquee_rank, event_date)
  WHERE is_marquee = TRUE AND is_duplicate = FALSE;

-- -------------------------------------------
-- 2. Classifier: title + description -> event_type
-- -------------------------------------------
-- Order matters: the most specific / most marquee formats win first.
CREATE OR REPLACE FUNCTION classify_event_type(
  p_title TEXT,
  p_description TEXT
) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  t TEXT := LOWER(COALESCE(p_title, ''));
  d TEXT := LOWER(COALESCE(p_description, ''));
  combined TEXT := t || ' ' || d;
BEGIN
  -- Title-only checks first: the title is the strongest signal.
  IF t ~ '\m(summit)\M'                                        THEN RETURN 'summit';      END IF;
  IF t ~ '\m(conference|convention|forum|congress)\M'          THEN RETURN 'conference';  END IF;
  IF t ~ '\m(expo|exposition|trade show|showcase)\M'           THEN RETURN 'expo';        END IF;
  IF t ~ '\m(demo day|demoday)\M'                              THEN RETURN 'demo_day';    END IF;
  IF t ~ '\m(awards?|gala|honors)\M'                           THEN RETURN 'awards';      END IF;
  IF t ~ '\m(hackathon|hack day|buildathon|game jam)\M'        THEN RETURN 'hackathon';   END IF;
  IF t ~ '\m(office hours?|ama|ask me anything|clinic)\M'      THEN RETURN 'office_hours';END IF;
  IF t ~ '\m(pitch|pitching|pitch night|startup competition)\M' THEN RETURN 'pitch';      END IF;
  IF t ~ '\m(workshop|bootcamp|boot camp|hands-on|training|masterclass|tutorial|course)\M'
                                                               THEN RETURN 'workshop';    END IF;
  IF t ~ '\m(panel|fireside|keynote|talk|talks|lecture|webinar|speaker series)\M'
                                                               THEN RETURN 'panel';       END IF;

  -- Fall back to the description for weaker signals.
  IF combined ~ '\m(summit)\M'                                     THEN RETURN 'summit';      END IF;
  IF combined ~ '\m(conference|convention)\M'                      THEN RETURN 'conference';  END IF;
  IF combined ~ '\m(demo day)\M'                                   THEN RETURN 'demo_day';    END IF;
  IF combined ~ '\m(hackathon)\M'                                  THEN RETURN 'hackathon';   END IF;
  IF combined ~ '\m(pitch)\M'                                      THEN RETURN 'pitch';       END IF;
  IF combined ~ '\m(workshop|bootcamp|hands-on)\M'                 THEN RETURN 'workshop';    END IF;

  RETURN 'meetup';
END;
$$;

-- Backfill every row that has no type yet.
UPDATE aggregated_events
SET event_type = classify_event_type(title, description)
WHERE event_type IS NULL;

-- Keep new rows classified without touching the sync edge function.
CREATE OR REPLACE FUNCTION set_event_type_if_null()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type IS NULL THEN
    NEW.event_type := classify_event_type(NEW.title, NEW.description);
  END IF;
  IF NEW.end_date IS NOT NULL AND NEW.end_date < NEW.event_date THEN
    NEW.end_date := NEW.event_date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_event_type ON aggregated_events;
CREATE TRIGGER trg_set_event_type
  BEFORE INSERT OR UPDATE OF title, description, event_type, end_date, event_date
  ON aggregated_events
  FOR EACH ROW EXECUTE FUNCTION set_event_type_if_null();

-- -------------------------------------------
-- 3. Status roll-over must respect end_date (multi-day events)
-- -------------------------------------------
CREATE OR REPLACE FUNCTION update_event_statuses()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Mark past: only once the LAST day has passed.
  UPDATE aggregated_events
  SET status = 'past', updated_at = NOW()
  WHERE status IN ('upcoming', 'live')
    AND (
      COALESCE(end_date, event_date) < CURRENT_DATE
      OR (COALESCE(end_date, event_date) = CURRENT_DATE AND end_time IS NOT NULL AND end_time < NOW())
    );

  -- Mark live: anywhere inside the [event_date, end_date] window once started.
  UPDATE aggregated_events
  SET status = 'live', updated_at = NOW()
  WHERE status = 'upcoming'
    AND event_date <= CURRENT_DATE
    AND COALESCE(end_date, event_date) >= CURRENT_DATE
    AND start_time <= NOW()
    AND (end_time IS NULL OR end_time > NOW());
END;
$$;

-- -------------------------------------------
-- 4. Public view gains the new columns
-- -------------------------------------------
DROP VIEW IF EXISTS public_upcoming_events;
CREATE VIEW public_upcoming_events AS
SELECT
  id, source, source_url, title, description,
  event_date, end_date, start_time, end_time, timezone,
  is_virtual, venue_name, venue_address, city, virtual_url,
  organizer_name, category, event_type, tags, image_url,
  registration_url, is_free, price_info, status,
  is_marquee, marquee_rank, tagline, last_synced_at
FROM aggregated_events
WHERE status IN ('upcoming', 'live')
  AND is_duplicate = FALSE
  AND COALESCE(end_date, event_date) >= CURRENT_DATE
ORDER BY event_date, start_time;

GRANT SELECT ON public_upcoming_events TO anon, authenticated;

-- -------------------------------------------
-- 5. Seed: verified marquee events (source = 'manual')
-- -------------------------------------------
-- Dates verified 2026-09-04 against organizer pages / press releases.
-- Re-running updates the row in place (UNIQUE(source, external_id)).
-- Start/end times for all-day events are placeholders (09:00-17:00 CT);
-- the spotlight card shows the date range, not the clock time.
INSERT INTO aggregated_events (
  source, external_id, source_url, title, description, tagline,
  event_date, end_date, start_time, end_time, timezone,
  is_virtual, venue_name, venue_address, city, state,
  organizer_name, organizer_url,
  category, event_type, tags,
  registration_url, is_free, price_info,
  status, is_marquee, marquee_rank, dedup_hash
) VALUES
(
  'manual', 'chicago-venture-summit-2026',
  'https://worldbusinesschicago.com/chicago-venture-summit/',
  'Chicago Venture Summit: Future of Health',
  'World Business Chicago''s flagship investor and startup conference returns with a focus on healthcare and life sciences. Two days in Fulton Market connecting founders with capital, customers, and strategic partners. Invite-only; general admission tickets open September 1.',
  'The city''s flagship founder-investor summit, this year on the future of health.',
  '2026-10-19', '2026-10-20',
  '2026-10-19 09:00:00-05', '2026-10-20 17:00:00-05', 'America/Chicago',
  FALSE, '167 North Green', '167 N Green St, Chicago, IL 60607', 'Chicago', 'IL',
  'World Business Chicago', 'https://worldbusinesschicago.com',
  'conference', 'summit', ARRAY['healthtech','life sciences','venture'],
  'https://worldbusinesschicago.com/chicago-venture-summit/', FALSE, 'Invite-only; general admission on sale Sept 1',
  'upcoming', TRUE, 1,
  generate_event_dedup_hash('Chicago Venture Summit: Future of Health', '2026-10-19', '167 North Green')
),
(
  'manual', 'chicago-innovation-awards-2026',
  'https://www.eventbrite.com/e/the-25th-annual-chicago-innovation-awards-tickets-1998915251326',
  'The 25th Annual Chicago Innovation Awards',
  'The largest and longest-running celebration of innovation across industries in the Chicago region. Roughly 700 founders, executives, and civic leaders gather at UIC Forum to honor the year''s winners.',
  'Twenty-five years of honoring the region''s best new products and companies.',
  '2026-11-17', NULL,
  '2026-11-17 17:00:00-06', '2026-11-17 20:30:00-06', 'America/Chicago',
  FALSE, 'UIC Forum', '1213 S Halsted St, Chicago, IL 60607', 'Chicago', 'IL',
  'Chicago Innovation', 'https://chicagoinnovation.com',
  'conference', 'awards', ARRAY['awards','innovation'],
  'https://www.eventbrite.com/e/the-25th-annual-chicago-innovation-awards-tickets-1998915251326', FALSE, 'Ticketed',
  'upcoming', TRUE, 2,
  generate_event_dedup_hash('The 25th Annual Chicago Innovation Awards', '2026-11-17', 'UIC Forum')
),
(
  'manual', 'techchicago-week-2027',
  'https://gotechchicago.com/week/',
  'TechChicago Week 2027',
  'A citywide week of founder, investor, and builder programming across Chicago''s innovation hubs. Venues and full schedule are announced closer to the date.',
  'A full week of the Chicago tech ecosystem in one place.',
  '2027-07-19', '2027-07-25',
  '2027-07-19 09:00:00-05', '2027-07-25 17:00:00-05', 'America/Chicago',
  FALSE, 'Citywide', 'Chicago, IL', 'Chicago', 'IL',
  'TechChicago', 'https://gotechchicago.com',
  'conference', 'conference', ARRAY['tech week','ecosystem'],
  'https://gotechchicago.com/week/', FALSE, 'Mix of free and ticketed events',
  'upcoming', TRUE, 3,
  generate_event_dedup_hash('TechChicago Week 2027', '2027-07-19', 'Citywide')
)
ON CONFLICT (source, external_id) DO UPDATE SET
  source_url       = EXCLUDED.source_url,
  title            = EXCLUDED.title,
  description      = EXCLUDED.description,
  tagline          = EXCLUDED.tagline,
  event_date       = EXCLUDED.event_date,
  end_date         = EXCLUDED.end_date,
  start_time       = EXCLUDED.start_time,
  end_time         = EXCLUDED.end_time,
  is_virtual       = EXCLUDED.is_virtual,
  venue_name       = EXCLUDED.venue_name,
  venue_address    = EXCLUDED.venue_address,
  organizer_name   = EXCLUDED.organizer_name,
  organizer_url    = EXCLUDED.organizer_url,
  category         = EXCLUDED.category,
  event_type       = EXCLUDED.event_type,
  tags             = EXCLUDED.tags,
  registration_url = EXCLUDED.registration_url,
  is_free          = EXCLUDED.is_free,
  price_info       = EXCLUDED.price_info,
  status           = EXCLUDED.status,
  is_marquee       = EXCLUDED.is_marquee,
  marquee_rank     = EXCLUDED.marquee_rank,
  is_duplicate     = FALSE,
  updated_at       = NOW();

-- -------------------------------------------
-- 6. Data hygiene: quarantine obviously bogus far-future rows
-- -------------------------------------------
-- Scrapers occasionally emit placeholder dates years out (2031, 2032 seen
-- in prod). Mark them duplicate so they drop out of every public query
-- without deleting the raw rows.
UPDATE aggregated_events
SET is_duplicate = TRUE, updated_at = NOW()
WHERE is_duplicate = FALSE
  AND is_marquee = FALSE
  AND event_date > CURRENT_DATE + INTERVAL '18 months';
