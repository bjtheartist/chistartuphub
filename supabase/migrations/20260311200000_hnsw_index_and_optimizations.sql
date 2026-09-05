-- HNSW index for faster semantic search on investors (66K+ records)
-- HNSW is significantly faster than IVFFlat for this dataset size
-- Uses cosine distance operator since search uses cosine similarity

-- Drop existing flat/ivfflat index if any
DROP INDEX IF EXISTS idx_investors_embedding;
DROP INDEX IF EXISTS investors_embedding_idx;

-- Create HNSW index (build can take a few minutes for 66K vectors)
CREATE INDEX IF NOT EXISTS idx_investors_embedding_hnsw
  ON investors
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Same for funding_opportunities (smaller table, ~2.8K)
DROP INDEX IF EXISTS idx_funding_embedding;
DROP INDEX IF EXISTS funding_opportunities_embedding_idx;

CREATE INDEX IF NOT EXISTS idx_funding_embedding_hnsw
  ON funding_opportunities
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Add last_enriched_at timestamp for data freshness tracking
ALTER TABLE investors ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMPTZ;
ALTER TABLE funding_opportunities ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMPTZ;

-- Make completeness_score a generated column (investors)
-- Can't alter existing column to generated, so add a comment noting it should be computed
COMMENT ON COLUMN investors.completeness_score IS 'Should be recomputed after enrichment runs. Not auto-generated due to existing data.';

-- Index for common investor directory queries
CREATE INDEX IF NOT EXISTS idx_investors_type_midwest
  ON investors (investor_type, is_midwest)
  WHERE investor_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_investors_completeness
  ON investors (completeness_score DESC);

-- Partial index for records needing enrichment (completeness < 50)
CREATE INDEX IF NOT EXISTS idx_investors_needs_enrichment
  ON investors (completeness_score)
  WHERE completeness_score < 50;
