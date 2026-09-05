-- Add completeness_score column to funding_opportunities
-- Integer 0-100 based on weighted field coverage
-- Used internally to prioritize enrichment efforts

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'funding_opportunities' AND column_name = 'completeness_score') THEN
    ALTER TABLE funding_opportunities ADD COLUMN completeness_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- Backfill all records with computed scores
-- Weights: name(15) org(10) description(20) website(15) check_size(15) location(10) sectors(5) stage(5) embedding(5) = 100
UPDATE funding_opportunities SET completeness_score = (
  CASE WHEN name IS NOT NULL AND length(name) > 2 THEN 15 ELSE 0 END
  + CASE WHEN organization IS NOT NULL AND length(organization) > 0 THEN 10 ELSE 0 END
  + CASE WHEN description IS NOT NULL AND length(description) >= 50 THEN 20
         WHEN description IS NOT NULL AND length(description) >= 20 THEN 10
         ELSE 0 END
  + CASE WHEN website IS NOT NULL AND website LIKE 'http%' THEN 15 ELSE 0 END
  + CASE WHEN check_size_min IS NOT NULL OR check_size_max IS NOT NULL THEN 15 ELSE 0 END
  + CASE WHEN location IS NOT NULL AND length(location) > 2 THEN 10 ELSE 0 END
  + CASE WHEN sectors IS NOT NULL AND array_length(sectors, 1) > 0 THEN 5 ELSE 0 END
  + CASE WHEN stage IS NOT NULL AND array_length(stage, 1) > 0 THEN 5 ELSE 0 END
  + CASE WHEN embedding IS NOT NULL THEN 5 ELSE 0 END
);

-- Index for efficient filtering/sorting by completeness
CREATE INDEX IF NOT EXISTS idx_funding_completeness ON funding_opportunities (completeness_score DESC);
