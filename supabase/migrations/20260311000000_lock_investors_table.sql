-- Revoke direct SELECT on investors table from public roles
-- Users must go through public_investors view which gates Pro-only columns
REVOKE SELECT ON public.investors FROM anon, authenticated;

-- Recreate the view WITHOUT security_invoker so it runs as the owner (postgres)
-- This allows the view to read from investors even though anon/authenticated can't
DROP VIEW IF EXISTS public.public_investors;

CREATE VIEW public.public_investors AS
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
       ELSE regexp_replace(regexp_replace(description, '\[Phone:[^\]]*\]', '', 'g'), '\[Location:[^\]]*\]', '', 'g')
  END AS description,
  source,
  mvip_score,
  completeness_score,
  confidence_score,
  created_at,
  updated_at
FROM investors;

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.public_investors TO anon, authenticated;
