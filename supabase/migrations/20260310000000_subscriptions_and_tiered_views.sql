-- ============================================================
-- FREEMIUM MODEL MIGRATION - March 2026
-- Adds subscriptions table and tiered data access
-- Free users: names, types, stages, sectors (no contact info)
-- Pro users: websites, phone numbers, business addresses
-- ============================================================

-- 1. Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'inactive',
  plan TEXT NOT NULL DEFAULT 'free',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role manages all subscriptions (via Stripe webhooks)
CREATE POLICY "Service role manages subscriptions"
  ON subscriptions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Helper function: check if current user is Pro
CREATE OR REPLACE FUNCTION public.is_pro_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND plan = 'pro'
      AND current_period_end > NOW()
  );
$$;

-- 3. Replace public_investors view with tiered data access
-- Free: names, types, stages, sectors, cleaned descriptions
-- Pro: + websites, domains, full addresses, phone numbers in descriptions
DROP VIEW IF EXISTS public.public_investors;

CREATE VIEW public.public_investors
WITH (security_invoker = true)
AS
SELECT
    id,
    canonical_name,
    CASE WHEN is_pro_user() THEN website ELSE NULL END AS website,
    CASE WHEN is_pro_user() THEN domain ELSE NULL END AS domain,
    CASE WHEN is_pro_user() THEN hq_location ELSE NULL END AS hq_location,
    hq_city,
    hq_state,
    hq_country,
    is_midwest,
    investor_type,
    stage_focus,
    sectors,
    check_size_min,
    check_size_max,
    CASE WHEN is_pro_user() THEN description
         ELSE regexp_replace(
                regexp_replace(description, '\[Phone:[^\]]*\]', '', 'g'),
                '\[Location:[^\]]*\]', '', 'g'
              )
    END AS description,
    source,
    mvip_score,
    completeness_score,
    confidence_score,
    created_at,
    updated_at
FROM investors;

GRANT SELECT ON public.public_investors TO anon, authenticated;

COMMENT ON VIEW public.public_investors IS
  'Tiered investor data. Free users see names/types/stages. Pro users see websites, phones, addresses.';

-- 4. Grant read on subscriptions table to authenticated users
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
