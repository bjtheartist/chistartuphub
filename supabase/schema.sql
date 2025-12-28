-- ===========================================
-- ChiStartup Hub - Supabase Database Schema
-- ===========================================
-- Run this in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- COMMUNITIES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  featured BOOLEAN DEFAULT FALSE,
  logo_url TEXT,
  category TEXT,
  member_count INTEGER,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Communities are viewable by everyone" ON communities
  FOR SELECT USING (true);

-- ===========================================
-- STORIES TABLE (Chicago Blueprints)
-- ===========================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  tagline TEXT,
  description TEXT,
  founders TEXT[], -- Array of founder names
  founded_year INTEGER,
  sector TEXT,
  funding_raised TEXT,
  valuation TEXT,
  is_unicorn BOOLEAN DEFAULT FALSE,
  competitive_moat TEXT,
  moat_description TEXT,
  key_insights TEXT[],
  milestones JSONB, -- Array of {year, event} objects
  website TEXT,
  linkedin TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories are viewable by everyone" ON stories
  FOR SELECT USING (true);

-- ===========================================
-- ACCELERATORS/INCUBATORS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS accelerators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  program_type TEXT, -- 'accelerator', 'incubator', 'studio'
  focus_areas TEXT[],
  stage TEXT, -- 'pre-seed', 'seed', 'series-a'
  investment_range TEXT,
  duration TEXT,
  application_deadline DATE,
  is_active BOOLEAN DEFAULT TRUE,
  location TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE accelerators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accelerators are viewable by everyone" ON accelerators
  FOR SELECT USING (true);

-- ===========================================
-- EVENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT, -- 'meetup', 'conference', 'workshop', 'pitch', 'networking'
  date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  address TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  virtual_link TEXT,
  registration_link TEXT,
  organizer TEXT,
  cost TEXT,
  image_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone" ON events
  FOR SELECT USING (true);

-- ===========================================
-- WORKSPACES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  address TEXT,
  neighborhood TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  workspace_type TEXT, -- 'coworking', 'private-office', 'innovation-hub'
  amenities TEXT[],
  pricing TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  image_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspaces are viewable by everyone" ON workspaces
  FOR SELECT USING (true);

-- ===========================================
-- FUNDING OPPORTUNITIES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS funding_opportunities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  organization TEXT,
  description TEXT,
  opportunity_type TEXT, -- 'vc', 'angel', 'grant', 'competition', 'non-dilutive'
  check_size_min INTEGER,
  check_size_max INTEGER,
  stage TEXT[], -- Array of stages they invest in
  sectors TEXT[],
  website TEXT,
  contact_email TEXT,
  application_link TEXT,
  deadline DATE,
  is_active BOOLEAN DEFAULT TRUE,
  chicago_focused BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE funding_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Funding opportunities are viewable by everyone" ON funding_opportunities
  FOR SELECT USING (true);

-- ===========================================
-- FUNDING NEWS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS funding_news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  company_name TEXT,
  amount TEXT,
  round_type TEXT,
  investors TEXT[],
  source_url TEXT,
  source_name TEXT,
  date DATE,
  image_url TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE funding_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Funding news is viewable by everyone" ON funding_news
  FOR SELECT USING (true);

-- ===========================================
-- UPCOMING OPPORTUNITIES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS upcoming_opportunities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  organization TEXT,
  description TEXT,
  opportunity_type TEXT,
  deadline DATE,
  application_link TEXT,
  requirements TEXT[],
  prize_amount TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE upcoming_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Upcoming opportunities are viewable by everyone" ON upcoming_opportunities
  FOR SELECT USING (true);

-- ===========================================
-- EMAIL SIGNUPS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS email_signups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT, -- where they signed up from
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_signups ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (for signup forms)
CREATE POLICY "Anyone can sign up" ON email_signups
  FOR INSERT WITH CHECK (true);

-- ===========================================
-- RESOURCE SUBMISSIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS resource_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  resource_type TEXT,
  resource_name TEXT NOT NULL,
  resource_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE resource_submissions ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone
CREATE POLICY "Anyone can submit resources" ON resource_submissions
  FOR INSERT WITH CHECK (true);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_communities_featured ON communities(featured);
CREATE INDEX IF NOT EXISTS idx_communities_created ON communities(created_date DESC);

CREATE INDEX IF NOT EXISTS idx_stories_featured ON stories(featured);
CREATE INDEX IF NOT EXISTS idx_stories_sector ON stories(sector);
CREATE INDEX IF NOT EXISTS idx_stories_unicorn ON stories(is_unicorn);
CREATE INDEX IF NOT EXISTS idx_stories_created ON stories(created_date DESC);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

CREATE INDEX IF NOT EXISTS idx_workspaces_neighborhood ON workspaces(neighborhood);
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON workspaces(workspace_type);

CREATE INDEX IF NOT EXISTS idx_funding_type ON funding_opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_funding_active ON funding_opportunities(is_active);

CREATE INDEX IF NOT EXISTS idx_funding_news_date ON funding_news(date DESC);

CREATE INDEX IF NOT EXISTS idx_upcoming_deadline ON upcoming_opportunities(deadline);

-- ===========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accelerators_updated_at BEFORE UPDATE ON accelerators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funding_opportunities_updated_at BEFORE UPDATE ON funding_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upcoming_opportunities_updated_at BEFORE UPDATE ON upcoming_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
