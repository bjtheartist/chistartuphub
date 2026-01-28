-- ===========================================
-- Chicago Tech Events Aggregation System
-- ===========================================
-- Standardized schema for aggregating events from multiple sources
-- Sources: Meetup, Eventbrite, Luma, Manual entries

-- ===========================================
-- AGGREGATED EVENTS TABLE
-- ===========================================
-- Core fields standardized across all platforms
CREATE TABLE IF NOT EXISTS aggregated_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Source identification
  source TEXT NOT NULL,                         -- 'meetup', 'eventbrite', 'luma', 'manual'
  external_id TEXT NOT NULL,                    -- ID from source platform
  source_url TEXT NOT NULL,                     -- Direct link to event on source platform
  
  -- Core event info (REQUIRED - displayed in UI)
  title TEXT NOT NULL,
  description TEXT,
  
  -- Date & Time (REQUIRED - standardized to Chicago timezone)
  event_date DATE NOT NULL,                     -- Date of event (YYYY-MM-DD)
  start_time TIMESTAMPTZ NOT NULL,              -- Start time with timezone
  end_time TIMESTAMPTZ,                         -- End time (optional)
  timezone TEXT DEFAULT 'America/Chicago',
  
  -- Location (REQUIRED - venue name + address)
  is_virtual BOOLEAN DEFAULT FALSE,
  venue_name TEXT,                              -- e.g., "1871", "MATTER", "Online"
  venue_address TEXT,                           -- Full street address
  city TEXT DEFAULT 'Chicago',
  state TEXT DEFAULT 'IL',
  
  -- Virtual event details
  virtual_url TEXT,                             -- Zoom/Meet link for virtual events
  
  -- Organizer
  organizer_name TEXT,
  organizer_url TEXT,
  
  -- Categorization
  category TEXT,                                -- 'ai-ml', 'networking', 'workshop', 'pitch', 'web3', 'conference'
  tags TEXT[],                                  -- Additional tags from source
  
  -- Media
  image_url TEXT,                               -- Event banner/thumbnail
  
  -- Registration
  registration_url TEXT,                        -- Where to RSVP (may differ from source_url)
  is_free BOOLEAN DEFAULT TRUE,
  price_info TEXT,                              -- Free-form price text
  
  -- Status
  status TEXT DEFAULT 'upcoming',               -- 'upcoming', 'live', 'past', 'cancelled'
  
  -- Deduplication
  dedup_hash TEXT,                              -- MD5 hash for detecting duplicates
  is_duplicate BOOLEAN DEFAULT FALSE,
  canonical_event_id UUID,                      -- Points to the "main" event if duplicate
  
  -- Metadata
  raw_data JSONB,                               -- Original data from source for debugging
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(source, external_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agg_events_date ON aggregated_events(event_date);
CREATE INDEX IF NOT EXISTS idx_agg_events_source ON aggregated_events(source);
CREATE INDEX IF NOT EXISTS idx_agg_events_status ON aggregated_events(status);
CREATE INDEX IF NOT EXISTS idx_agg_events_category ON aggregated_events(category);
CREATE INDEX IF NOT EXISTS idx_agg_events_dedup ON aggregated_events(dedup_hash);
CREATE INDEX IF NOT EXISTS idx_agg_events_upcoming ON aggregated_events(event_date, start_time) 
  WHERE status = 'upcoming' AND is_duplicate = FALSE;

-- RLS
ALTER TABLE aggregated_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aggregated events are viewable by everyone" ON aggregated_events
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage aggregated events" ON aggregated_events
  FOR ALL USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE TRIGGER update_aggregated_events_updated_at 
  BEFORE UPDATE ON aggregated_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- EVENT SOURCES CONFIG TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS event_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,                    -- 'meetup', 'eventbrite', 'luma'
  display_name TEXT NOT NULL,
  source_type TEXT NOT NULL,                    -- 'api', 'scraper', 'manual'
  is_active BOOLEAN DEFAULT TRUE,
  
  -- API configuration
  api_base_url TEXT,
  api_endpoint TEXT,
  requires_auth BOOLEAN DEFAULT FALSE,
  
  -- Scraping configuration  
  scrape_url TEXT,
  scrape_selectors JSONB,
  
  -- Field mapping (source field -> our field)
  field_mapping JSONB NOT NULL DEFAULT '{}',
  
  -- Sync settings
  sync_frequency_minutes INTEGER DEFAULT 60,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,                        -- 'success', 'error', 'partial'
  last_sync_count INTEGER DEFAULT 0,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event sources viewable by everyone" ON event_sources
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage event sources" ON event_sources
  FOR ALL USING (auth.role() = 'service_role');

CREATE TRIGGER update_event_sources_updated_at 
  BEFORE UPDATE ON event_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- SYNC LOGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS event_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',                -- 'running', 'success', 'error', 'partial'
  
  -- Stats
  events_found INTEGER DEFAULT 0,
  events_created INTEGER DEFAULT 0,
  events_updated INTEGER DEFAULT 0,
  events_skipped INTEGER DEFAULT 0,
  duplicates_found INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sync logs viewable by authenticated" ON event_sync_logs
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage sync logs" ON event_sync_logs
  FOR ALL USING (auth.role() = 'service_role');

-- ===========================================
-- SEED EVENT SOURCES WITH FIELD MAPPINGS
-- ===========================================
INSERT INTO event_sources (name, display_name, source_type, api_base_url, field_mapping) VALUES
(
  'meetup',
  'Meetup',
  'api',
  'https://api.meetup.com',
  '{
    "id": "external_id",
    "name": "title",
    "description": "description",
    "local_date": "event_date",
    "local_time": "start_time",
    "duration": "duration_ms",
    "venue.name": "venue_name",
    "venue.address_1": "venue_address",
    "venue.city": "city",
    "venue.state": "state",
    "is_online_event": "is_virtual",
    "link": "source_url",
    "group.name": "organizer_name",
    "group.link": "organizer_url",
    "featured_photo.photo_link": "image_url"
  }'::jsonb
),
(
  'eventbrite',
  'Eventbrite',
  'api',
  'https://www.eventbriteapi.com/v3',
  '{
    "id": "external_id",
    "name.text": "title",
    "description.text": "description",
    "start.local": "start_time",
    "end.local": "end_time",
    "venue.name": "venue_name",
    "venue.address.localized_address_display": "venue_address",
    "online_event": "is_virtual",
    "url": "source_url",
    "organizer.name": "organizer_name",
    "logo.url": "image_url",
    "is_free": "is_free"
  }'::jsonb
),
(
  'luma',
  'Luma',
  'scraper',
  'https://lu.ma',
  '{
    "event_id": "external_id",
    "name": "title",
    "description": "description",
    "start_at": "start_time",
    "end_at": "end_time",
    "geo_address_json.place_name": "venue_name",
    "geo_address_json.full_address": "venue_address",
    "url": "source_url",
    "cover_url": "image_url",
    "hosts[0].name": "organizer_name"
  }'::jsonb
),
(
  'manual',
  'Manual Entry',
  'manual',
  NULL,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  field_mapping = EXCLUDED.field_mapping,
  updated_at = NOW();

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Generate dedup hash from title + date + venue
CREATE OR REPLACE FUNCTION generate_event_dedup_hash(
  p_title TEXT,
  p_event_date DATE,
  p_venue_name TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN MD5(
    LOWER(REGEXP_REPLACE(TRIM(COALESCE(p_title, '')), '[^a-z0-9]', '', 'g')) || 
    COALESCE(p_event_date::TEXT, '') || 
    LOWER(REGEXP_REPLACE(TRIM(COALESCE(p_venue_name, '')), '[^a-z0-9]', '', 'g'))
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-categorize events based on title/description keywords
CREATE OR REPLACE FUNCTION auto_categorize_event(
  p_title TEXT,
  p_description TEXT
) RETURNS TEXT AS $$
DECLARE
  combined_text TEXT;
BEGIN
  combined_text := LOWER(COALESCE(p_title, '') || ' ' || COALESCE(p_description, ''));
  
  IF combined_text ~ '(artificial intelligence|machine learning|ai/ml|llm|gpt|neural|deep learning)' THEN
    RETURN 'ai-ml';
  ELSIF combined_text ~ '(web3|blockchain|crypto|defi|nft|ethereum|solana)' THEN
    RETURN 'web3';
  ELSIF combined_text ~ '(workshop|hands-on|tutorial|bootcamp|training)' THEN
    RETURN 'workshop';
  ELSIF combined_text ~ '(pitch|demo day|investor|funding|venture|angel)' THEN
    RETURN 'pitch';
  ELSIF combined_text ~ '(conference|summit|expo|convention)' THEN
    RETURN 'conference';
  ELSIF combined_text ~ '(networking|mixer|social|happy hour|meetup)' THEN
    RETURN 'networking';
  ELSE
    RETURN 'networking'; -- Default category
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update event statuses based on current time
CREATE OR REPLACE FUNCTION update_event_statuses() RETURNS void AS $$
BEGIN
  -- Mark past events
  UPDATE aggregated_events 
  SET status = 'past', updated_at = NOW()
  WHERE status IN ('upcoming', 'live')
    AND (event_date < CURRENT_DATE 
      OR (event_date = CURRENT_DATE AND end_time < NOW()));
  
  -- Mark live events
  UPDATE aggregated_events 
  SET status = 'live', updated_at = NOW()
  WHERE status = 'upcoming' 
    AND event_date = CURRENT_DATE 
    AND start_time <= NOW() 
    AND (end_time IS NULL OR end_time > NOW());
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- VIEW: Public upcoming events (non-duplicates)
-- ===========================================
CREATE OR REPLACE VIEW public_upcoming_events AS
SELECT 
  id,
  source,
  source_url,
  title,
  description,
  event_date,
  start_time,
  end_time,
  timezone,
  is_virtual,
  venue_name,
  venue_address,
  city,
  virtual_url,
  organizer_name,
  category,
  image_url,
  registration_url,
  is_free,
  price_info,
  status,
  last_synced_at
FROM aggregated_events
WHERE status = 'upcoming'
  AND is_duplicate = FALSE
  AND event_date >= CURRENT_DATE
ORDER BY event_date, start_time;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================
DO $$
BEGIN
  RAISE NOTICE 'Event aggregation system created successfully!';
  RAISE NOTICE 'Tables: aggregated_events, event_sources, event_sync_logs';
  RAISE NOTICE 'Views: public_upcoming_events';
  RAISE NOTICE 'Functions: generate_event_dedup_hash, auto_categorize_event, update_event_statuses';
END $$;
