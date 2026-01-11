-- ===========================================
-- Capital Access Project - Hot Deals Import
-- January 2026
-- ===========================================
-- Adding verified funding opportunities from Capital Access Project research

-- Microsoft Imagine Cup
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Microsoft Imagine Cup',
  'Microsoft',
  'Launch path: $50K | Scale path: $100K. Must have limited external funding. Student founders using Microsoft AI.',
  'competition',
  50000, 100000,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['AI', 'Technology', 'Student Founders'],
  'https://imaginecup.microsoft.com/',
  '2026-01-09',
  true, false, true
) ON CONFLICT DO NOTHING;

-- Amex Shop Small Grants
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Amex Shop Small Grants',
  'American Express / Main Street America',
  'Over 500 grants of $20K each | $10M+ total available. For-profit business started before Jan 2024 with 20 or fewer employees and permanent brick-and-mortar location.',
  'grant',
  20000, 20000,
  ARRAY['Early Stage'],
  ARRAY['Small Business', 'Retail'],
  'https://mainstreet.org/about/partner-collaborations/amex-shop-small-grant-program',
  '2026-01-16',
  true, false, false
) ON CONFLICT DO NOTHING;

-- Google for Startups Accelerator Canada
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Google for Startups Accelerator Canada',
  'Google',
  '10-week hybrid program March-May 2026. Equity-free plus credits. Canadian startups with 5+ employees, AI/ML focus preferred.',
  'accelerator_application',
  0, 0,
  ARRAY['Seed', 'Series A'],
  ARRAY['AI', 'Technology', 'SaaS'],
  'https://startup.google.com/programs/accelerator/canada/',
  '2026-01-22',
  true, false, false
) ON CONFLICT DO NOTHING;

-- Rice Business Plan Competition
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Rice Business Plan Competition',
  'Rice University',
  'All teams receive at least one cash prize | 2025 awarded $1.5M+. For collegiate entrepreneurs (undergrad/grad/MBA).',
  'competition',
  50000, 1000000,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['Student Founders', 'Technology', 'All sectors'],
  'https://rbpc.rice.edu/',
  '2026-01-31',
  true, false, true
) ON CONFLICT DO NOTHING;

-- Y Combinator Spring 2026
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Y Combinator Spring 2026',
  'Y Combinator',
  '$125K for 7% equity + $375K uncapped SAFE with MFN. Standard deal: 7% equity on post-money SAFE | Total dilution 8-15%.',
  'accelerator_application',
  500000, 500000,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['Technology', 'SaaS', 'AI', 'FinTech', 'Healthcare', 'All sectors'],
  'https://www.ycombinator.com/apply',
  '2026-02-09',
  true, false, true
) ON CONFLICT DO NOTHING;

-- Founder Institute Chicago 2026
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Founder Institute Chicago 2026',
  'Founder Institute',
  '13-week program Apr 21 - Jul 22 2026. Equity-based ($599-$699 fee). Less than 40% complete program. Pre-seed founders.',
  'accelerator_application',
  0, 0,
  ARRAY['Pre-Seed'],
  ARRAY['Technology', 'All sectors'],
  'https://fi.co/apply',
  '2026-03-01',
  true, true, true
) ON CONFLICT DO NOTHING;

-- Chloe Capital NYC Founder Fellowship
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Chloe Capital NYC Founder Fellowship',
  'Chloe Capital / NYCEDC',
  '4-month accelerator. Min $300K invested in 3 companies. Part of NYCEDC Founder Fellowship. Underrepresented founders.',
  'vc',
  100000, 300000,
  ARRAY['Seed', 'Series A'],
  ARRAY['CleanTech', 'Healthcare', 'EdTech', 'Social Impact'],
  'https://chloecapital.com/nyc-2025/',
  '2025-12-31',
  true, false, false
) ON CONFLICT DO NOTHING;

-- VHNYC by Visible Hands
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'VHNYC by Visible Hands',
  'Visible Hands / NYCEDC',
  'Hybrid fellowship Mar-Jun 2026. $10K non-dilutive. Part of NYCEDC Founder Fellowship. NYC-based underrepresented founders at earliest stage.',
  'grant',
  10000, 10000,
  ARRAY['Pre-Seed'],
  ARRAY['Technology', 'Social Impact'],
  'https://www.visiblehands.vc/program-vhnyc',
  '2025-12-31',
  true, false, false
) ON CONFLICT DO NOTHING;

-- Greylock Edge
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Greylock Edge',
  'Greylock Partners',
  '3-month program. $500K+ in partner credits. Can raise full round or no capital at all. Flexible custom terms. No prerequisites.',
  'accelerator_application',
  0, 500000,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['Technology', 'SaaS', 'AI', 'All sectors'],
  'https://greylock.com/edge/',
  NULL,
  true, false, true
) ON CONFLICT DO NOTHING;

-- 500 Global Flagship Accelerator
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  '500 Global Flagship Accelerator',
  '500 Global',
  '4-month in-person program in Palo Alto. $150K for 6% equity. $37.5K program fee deducted from investment. Batch 37 Q1 2026.',
  'accelerator_application',
  150000, 150000,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['Technology', 'All sectors'],
  'https://flagship.aplica.500.co/',
  NULL,
  true, false, true
) ON CONFLICT DO NOTHING;

-- Liveability Challenge 2026
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Liveability Challenge 2026',
  'Temasek Foundation / Eco-Business',
  'S$4M total pool (~$3.1M USD). Top winners receive S$1M each. Grand Finale during Ecosperity Week Singapore. Global startups with decarbonisation or cooling solutions.',
  'competition',
  500000, 1000000,
  ARRAY['Seed', 'Early Stage', 'Growth'],
  ARRAY['CleanTech', 'Social Impact'],
  'https://www.theliveabilitychallenge.org/',
  '2026-02-09',
  true, false, true
) ON CONFLICT DO NOTHING;

-- Braze Tech for an Equitable Future
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Braze Tech for an Equitable Future',
  'Braze',
  '12 months free Braze access (product grant). 10 companies selected. Includes CSM onboarding. Worth tens of thousands in product value. Black/women founders with less than $30M funding.',
  'grant',
  0, 0,
  ARRAY['Seed', 'Series A', 'Growth'],
  ARRAY['Technology', 'Social Impact'],
  'https://www.braze.com/techforequitablefuture',
  '2026-01-16',
  true, false, false
) ON CONFLICT DO NOTHING;

-- a16z New Media Fellowship
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'a16z New Media Fellowship',
  'Andreessen Horowitz',
  '8-week program starting Jan 2026. No funding but resources/community. Access to a16z ecosystem and New Media Summit. For creators and operators at intersection of tech, media, culture.',
  'accelerator_application',
  0, 0,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['Consumer', 'Technology'],
  'https://www.a16z.news/p/introducing-the-a16z-new-media-fellowship',
  '2025-12-31',
  true, false, false
) ON CONFLICT DO NOTHING;

-- Update any existing opportunities that may have stale deadlines
UPDATE funding_opportunities
SET is_active = false
WHERE deadline < CURRENT_DATE AND deadline IS NOT NULL;

-- Create index for better hot deals queries
CREATE INDEX IF NOT EXISTS idx_funding_deadline ON funding_opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_funding_deadline_active ON funding_opportunities(deadline, is_active) WHERE is_active = true;
