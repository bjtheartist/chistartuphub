-- Co-investment graph: tracks which investors appeared together in Form D filings
-- This enables "investors who co-invest with X" queries and network analysis

-- Table: tracks each Form D filing as a "deal" (startup raising capital)
CREATE TABLE IF NOT EXISTS form_d_deals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  accession_number TEXT UNIQUE NOT NULL,
  issuer_name TEXT NOT NULL,
  issuer_cik TEXT,
  filing_date DATE,
  total_offering_amount NUMERIC,
  total_amount_sold NUMERIC,
  industry_group TEXT,
  fund_type TEXT,
  hq_city TEXT,
  hq_state TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: maps investors to deals they participated in (as related persons)
CREATE TABLE IF NOT EXISTS deal_participants (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  deal_id BIGINT REFERENCES form_d_deals(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES investors(id) ON DELETE SET NULL,
  person_name TEXT,
  relationship TEXT, -- 'Executive Officer', 'Director', 'Promoter'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deal_id, person_name)
);

-- Materialized view: pre-computed co-investment pairs
-- Refresh after new deal data is loaded
CREATE MATERIALIZED VIEW IF NOT EXISTS coinvestment_pairs AS
SELECT
  a.investor_id AS investor_a,
  b.investor_id AS investor_b,
  COUNT(DISTINCT a.deal_id) AS shared_deals,
  ARRAY_AGG(DISTINCT d.issuer_name ORDER BY d.issuer_name) AS shared_companies
FROM deal_participants a
JOIN deal_participants b ON a.deal_id = b.deal_id AND a.investor_id < b.investor_id
JOIN form_d_deals d ON d.id = a.deal_id
WHERE a.investor_id IS NOT NULL AND b.investor_id IS NOT NULL
GROUP BY a.investor_id, b.investor_id
HAVING COUNT(DISTINCT a.deal_id) >= 1;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deals_accession ON form_d_deals(accession_number);
CREATE INDEX IF NOT EXISTS idx_deals_filing_date ON form_d_deals(filing_date);
CREATE INDEX IF NOT EXISTS idx_participants_deal ON deal_participants(deal_id);
CREATE INDEX IF NOT EXISTS idx_participants_investor ON deal_participants(investor_id);
CREATE INDEX IF NOT EXISTS idx_coinvest_a ON coinvestment_pairs(investor_a);
CREATE INDEX IF NOT EXISTS idx_coinvest_b ON coinvestment_pairs(investor_b);

-- RPC function: get co-investors for a given investor
CREATE OR REPLACE FUNCTION get_coinvestors(target_investor_id UUID, min_shared_deals INT DEFAULT 1)
RETURNS TABLE (
  investor_id UUID,
  shared_deals BIGINT,
  shared_companies TEXT[]
) AS $$
  SELECT
    CASE WHEN investor_a = target_investor_id THEN investor_b ELSE investor_a END AS investor_id,
    shared_deals,
    shared_companies
  FROM coinvestment_pairs
  WHERE (investor_a = target_investor_id OR investor_b = target_investor_id)
    AND shared_deals >= min_shared_deals
  ORDER BY shared_deals DESC;
$$ LANGUAGE SQL STABLE;
