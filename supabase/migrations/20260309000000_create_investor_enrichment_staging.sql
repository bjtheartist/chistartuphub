-- Create investor_enrichment_staging table for harvester data
-- Run this in the Supabase SQL Editor if not applied via CLI

CREATE TABLE IF NOT EXISTS public.investor_enrichment_staging (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  organization text,
  description text,
  website text,
  location text,
  opportunity_type text DEFAULT 'vc',
  check_size_min integer,
  check_size_max integer,
  stage text[] DEFAULT '{}',
  sectors text[] DEFAULT '{}',
  chicago_focused boolean DEFAULT false,
  confidence_score integer DEFAULT 70,
  enrichment_source text DEFAULT 'web',
  needs_review boolean DEFAULT true,
  match_type text DEFAULT 'new',
  status text DEFAULT 'pending',
  raw_input text,
  field_sources jsonb DEFAULT '{}',
  matched_funding_opportunity_id uuid REFERENCES public.funding_opportunities(id),
  match_score float,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS with permissive policies for harvester access
ALTER TABLE public.investor_enrichment_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read staging" ON public.investor_enrichment_staging
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert staging" ON public.investor_enrichment_staging
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update staging" ON public.investor_enrichment_staging
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staging_name ON public.investor_enrichment_staging (name);
CREATE INDEX IF NOT EXISTS idx_staging_status ON public.investor_enrichment_staging (status);
CREATE INDEX IF NOT EXISTS idx_staging_source ON public.investor_enrichment_staging (enrichment_source);
CREATE INDEX IF NOT EXISTS idx_staging_confidence ON public.investor_enrichment_staging (confidence_score);

-- Also create supporting tables referenced by the enrich-investors edge function
CREATE TABLE IF NOT EXISTS public.enrichment_batches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_type text DEFAULT 'manual',
  source text,
  config jsonb DEFAULT '{}',
  total_records integer DEFAULT 0,
  processed_records integer DEFAULT 0,
  enriched_records integer DEFAULT 0,
  review_queued_records integer DEFAULT 0,
  failed_records integer DEFAULT 0,
  skipped_records integer DEFAULT 0,
  status text DEFAULT 'running',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrichment_review_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staging_id uuid REFERENCES public.investor_enrichment_staging(id),
  review_type text DEFAULT 'new_record',
  priority integer DEFAULT 5,
  review_reason text,
  existing_record_id uuid,
  field_conflicts jsonb,
  resolved boolean DEFAULT false,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrichment_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  actor_type text DEFAULT 'system',
  actor_id uuid,
  changes jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS for supporting tables (permissive for system access)
ALTER TABLE public.enrichment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read batches" ON public.enrichment_batches FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert batches" ON public.enrichment_batches FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update batches" ON public.enrichment_batches FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon read review_queue" ON public.enrichment_review_queue FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert review_queue" ON public.enrichment_review_queue FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon read audit_log" ON public.enrichment_audit_log FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert audit_log" ON public.enrichment_audit_log FOR INSERT TO anon WITH CHECK (true);
