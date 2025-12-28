const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// New opportunities data
const newOpportunities = [
  {
    name: "Cybersecurity & Defence Accelerator",
    opportunity_type: "accelerator",
    description: "Elevate B2B startup program with mentorship included. For B2B startups in cybersecurity/defence sectors.",
    deadline: "2026-01-01",
    sectors: ["Cybersecurity", "Defense", "B2B"],
    website: "https://fundsforngos.org",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Breva Thrive Grant",
    opportunity_type: "grant",
    description: "Quarterly grant program preferring underserved communities. For US small businesses with 1+ year generating revenue.",
    check_size_min: 5000,
    check_size_max: 5000,
    deadline: "2026-01-01",
    sectors: ["General", "Community Impact"],
    website: "https://breva.co",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Secretsos Small Business Grant",
    opportunity_type: "grant",
    description: "Designed for overlooked entrepreneurs. For business owners 21+, US-based.",
    check_size_min: 2500,
    check_size_max: 2500,
    deadline: "2026-01-01",
    sectors: ["General"],
    website: "https://secretsos.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Penn Startup Challenge",
    opportunity_type: "pitch_competition",
    description: "Flagship Penn entrepreneurship event with $200,000+ in prizes. For Penn students/alumni.",
    check_size_min: 200000,
    deadline: "2026-01-11",
    sectors: ["General Tech"],
    website: "https://venturelab.upenn.edu",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Space Symposium Innovate Pitch",
    opportunity_type: "pitch_competition",
    description: "Pitch live April 15, 2026. For global companies at TRL 4-7 in space/aerospace.",
    deadline: "2026-01-15",
    sectors: ["Space", "Aerospace"],
    website: "https://spacesymposium.org",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "YALI Africa Startup Accelerator",
    opportunity_type: "accelerator",
    description: "Fully funded 3-week program at University of Iowa for young East African entrepreneurs.",
    deadline: "2026-01-15",
    sectors: ["General"],
    website: "https://opportunitiesforafricans.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "South Summit Madrid",
    opportunity_type: "pitch_competition",
    description: "100 finalist startups compete with 3-min pitches. Multiple awards available for startups globally, all sectors.",
    deadline: "2026-01-15",
    sectors: ["General Tech"],
    website: "https://southsummit.io",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Amex Shop Small Grants",
    opportunity_type: "grant",
    description: "250 grants available through Main Street America partner. For for-profit, brick-and-mortar businesses with ≤20 employees, operating before 2025.",
    check_size_min: 20000,
    check_size_max: 20000,
    deadline: "2026-01-16",
    sectors: ["Small Business", "Retail"],
    website: "https://americanexpress.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Horizon Europe AI Road Safety",
    opportunity_type: "grant",
    description: "€4-6M projects for predicting and avoiding road crashes. For EU-based consortiums.",
    check_size_min: 4000000,
    check_size_max: 6000000,
    deadline: "2026-01-20",
    sectors: ["AI", "Transportation"],
    website: "https://ec.europa.eu",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Horizon Europe Battery Development",
    opportunity_type: "grant",
    description: "€4-6M projects for sustainable battery development. For EU-based consortiums.",
    check_size_min: 4000000,
    check_size_max: 6000000,
    deadline: "2026-01-20",
    sectors: ["Clean Energy", "Manufacturing"],
    website: "https://ec.europa.eu",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "AgeTech Open Mic Challenge",
    opportunity_type: "pitch_competition",
    description: "From AARP AgeTech Collaborative. For AgeTech startups in longevity space.",
    deadline: "2026-01-22",
    sectors: ["AgeTech", "Longevity", "HealthTech"],
    website: "https://agetechcollaborative.org",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Google for Startups MENA",
    opportunity_type: "accelerator",
    description: "10-week equity-free program with Google mentorship and Cloud credits. For MENA region tech startups using AI/ML.",
    deadline: "2026-01-30",
    sectors: ["Tech", "AI", "ML"],
    website: "https://startup.google.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Capital One Mobility Program",
    opportunity_type: "accelerator",
    description: "Mentorship and resources program kicking off late March 2026. For idea-stage and growth startups in mobility/transportation.",
    deadline: "2026-01-31",
    sectors: ["Mobility", "Transportation"],
    website: "https://capitalone.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Startmate Accelerator",
    opportunity_type: "accelerator",
    description: "12-week program offering $75,000 for 7.5% equity. For Australia/New Zealand startups in EdTech, FinTech, HealthTech.",
    check_size_min: 75000,
    check_size_max: 75000,
    deadline: "2026-01-31",
    sectors: ["EdTech", "FinTech", "HealthTech"],
    website: "https://startmate.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Santander Cultivate Small Business Grant",
    opportunity_type: "grant",
    description: "12-week virtual education program included. For food businesses with 1+ year, $25K-$1M revenue, 1-10 employees.",
    check_size_min: 10000,
    check_size_max: 10000,
    deadline: "2026-02-02",
    sectors: ["Food Industry"],
    website: "https://santander.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Desai Accelerator (U-M Alumni)",
    opportunity_type: "accelerator",
    description: "June-September 2026 program with mentorship and resources. For startups with U-M alum founder.",
    deadline: "2026-02-08",
    sectors: ["General Tech"],
    website: "https://desaiaccelerator.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "The Liveability Challenge 2026",
    opportunity_type: "grant",
    description: "Up to S$1M for global innovators focused on carbon emission reduction and decarbonisation.",
    check_size_min: 700000,
    check_size_max: 700000,
    deadline: "2026-02-09",
    sectors: ["Climate", "Decarbonisation", "Sustainability"],
    website: "https://liveabilitychallenge.sg",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "QuickBooks Small Business Hero",
    opportunity_type: "grant",
    description: "Must be nominated; 3 winners per quarter. For US businesses with 1+ year, ≤99 employees.",
    check_size_min: 20000,
    check_size_max: 20000,
    deadline: "2026-02-14",
    sectors: ["General"],
    website: "https://quickbooks.intuit.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "EDA Tech Hubs Phase 2",
    opportunity_type: "grant",
    description: "Stage II deadline for implementation grants. Up to $220M total for 19 designated Tech Hub regions in critical technologies.",
    check_size_min: 10000000,
    check_size_max: 220000000,
    deadline: "2026-02-18",
    sectors: ["Critical Technologies"],
    website: "https://eda.gov",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "HHS SBIR/STTR",
    opportunity_type: "grant",
    description: "Pending reauthorization - check status. For US small businesses <500 employees in health/biomedical.",
    check_size_min: 150000,
    check_size_max: 1000000,
    deadline: "2026-02-24",
    sectors: ["Health", "Biomedical"],
    website: "https://seed.nih.gov",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "AgeTech February Open Mic",
    opportunity_type: "pitch_competition",
    description: "Applications open Dec 12, 2025. For AgeTech startups in longevity space.",
    deadline: "2026-02-26",
    sectors: ["AgeTech", "Longevity"],
    website: "https://agetechcollaborative.org",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "ViVE Health AgeTech Pitch",
    opportunity_type: "pitch_competition",
    description: "Cash + exposure at ViVE Event in LA (Feb 22-25, 2026). For AgeTech MVP-stage startups.",
    deadline: "2026-02-25",
    sectors: ["HealthTech", "AgeTech"],
    website: "https://viveevent.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Ilitch School Tech Pitch",
    opportunity_type: "pitch_competition",
    description: "Cash prizes for WSU students. Finalists announced Feb 27.",
    deadline: "2026-02-27",
    sectors: ["Technology"],
    website: "https://ilitchbusiness.wayne.edu",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "EDA Industry Transformation Grants",
    opportunity_type: "grant",
    description: "Part of EDA funding opportunities for US-based organizations in industry/workforce development.",
    deadline: "2026-03-03",
    sectors: ["Industry", "Workforce"],
    website: "https://eda.gov",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "SXSW Pitch Competition",
    opportunity_type: "pitch_competition",
    description: "Part of SXSW Conference in Austin (March 12-18, 2026). For early-stage startups in general tech.",
    deadline: "2026-03-12",
    sectors: ["General Tech"],
    website: "https://sxsw.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Faire Small Business Grant",
    opportunity_type: "grant",
    description: "Quarterly deadline; $5,000 Faire credit for inventory. For independent US/Canada retailers.",
    check_size_min: 5000,
    check_size_max: 5000,
    deadline: "2026-03-31",
    sectors: ["Retail"],
    website: "https://faire.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "NASE Growth Grants",
    opportunity_type: "grant",
    description: "Over $1M distributed historically. Quarterly reviews (Jan, Apr, Jul, Oct). For NASE members with 90+ days membership.",
    check_size_min: 1000,
    check_size_max: 4000,
    deadline: null,
    sectors: ["General"],
    website: "https://nase.org",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Freed Fellowship",
    opportunity_type: "grant",
    description: "$500 monthly + $2,500 annual grant with strategy session + community included. Rolling monthly applications for US micro/small business owners.",
    check_size_min: 500,
    check_size_max: 2500,
    deadline: null,
    sectors: ["General"],
    website: "https://freedfellowship.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "HerSuiteSpot Hustler's Microgrant",
    opportunity_type: "grant",
    description: "Monthly awards for US small businesses. Women-focused program.",
    check_size_min: 1000,
    check_size_max: 1000,
    deadline: null,
    sectors: ["General", "Women-focused"],
    website: "https://hersuitespot.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Awesome Foundation",
    opportunity_type: "grant",
    description: "84 independent chapters providing monthly $1,000 grants for individuals and groups in general/creative projects.",
    check_size_min: 1000,
    check_size_max: 1000,
    deadline: null,
    sectors: ["General", "Creative"],
    website: "https://awesomefoundation.org",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "TechRise Pitch Competition",
    opportunity_type: "pitch_competition",
    description: "Weekly Friday competitions on Zoom. $25,000-$50,000 prizes for Chicagoland early-stage entrepreneurs.",
    check_size_min: 25000,
    check_size_max: 50000,
    deadline: null,
    sectors: ["General"],
    website: "https://techrise.me",
    is_active: true,
    chicago_focused: true,
    featured: true
  },
  {
    name: "IL Small Business Capital Grant",
    opportunity_type: "grant",
    description: "Focus on underrepresented groups. For SEDI-owned or VSB (<10 employees) businesses. Check DCEO website for current deadlines.",
    check_size_min: 10000,
    check_size_max: 245000,
    deadline: null,
    sectors: ["General", "Infrastructure"],
    website: "https://dceo.illinois.gov",
    is_active: true,
    chicago_focused: true,
    featured: true
  },
  {
    name: "Chicago SBIF Grant",
    opportunity_type: "grant",
    description: "Reimbursable permanent improvements for Chicago businesses in TIF districts. Rolling applications.",
    deadline: null,
    sectors: ["Building Improvement"],
    website: "https://somercor.com",
    is_active: true,
    chicago_focused: true,
    featured: true
  },
  {
    name: "IL Federal Grant Match Program",
    opportunity_type: "grant",
    description: "Matches federal grant applications. Up to $15M total for IL businesses seeking federal grants.",
    check_size_min: 100000,
    check_size_max: 15000000,
    deadline: null,
    sectors: ["General"],
    website: "https://dceo.illinois.gov",
    is_active: true,
    chicago_focused: true
  },
  {
    name: "Chicago CDG Large Grant",
    opportunity_type: "grant",
    description: "For retail, office, industrial projects. Up to $5M for business/property owners and nonprofits.",
    check_size_min: 100000,
    check_size_max: 5000000,
    deadline: null,
    sectors: ["Community Development", "Real Estate"],
    website: "https://chicago.gov",
    is_active: true,
    chicago_focused: true,
    featured: true
  },
  {
    name: "Aurora Finish Line Grant",
    opportunity_type: "grant",
    description: "Gap financing for commercial businesses in Aurora. <50 employees required. Rolling applications.",
    deadline: null,
    sectors: ["Property Improvement"],
    website: "https://aurora-il.org",
    is_active: true,
    chicago_focused: true
  },
  {
    name: "SoGal Black Founder Grant",
    opportunity_type: "grant",
    description: "Partnership with Walmart. $5,000-$10,000 for Black women & nonbinary entrepreneurs.",
    check_size_min: 5000,
    check_size_max: 10000,
    deadline: null,
    sectors: ["General"],
    website: "https://sogalfoundation.org",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Google Black Founders Fund",
    opportunity_type: "grant",
    description: "Up to $150,000 plus Cloud credits + mentorship. Typically opens Q2. For Black-led startups with traction.",
    check_size_min: 50000,
    check_size_max: 150000,
    deadline: null,
    sectors: ["Tech"],
    website: "https://startup.google.com",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "NAACP Powershift Grant",
    opportunity_type: "grant",
    description: "Resources beyond funding. $25,000 grants for Black entrepreneurs. Check NAACP website for deadlines.",
    check_size_min: 25000,
    check_size_max: 25000,
    deadline: null,
    sectors: ["General"],
    website: "https://naacp.org",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Black Girl Ventures Pitch",
    opportunity_type: "pitch_competition",
    description: "Audience-voted pitch competition. Varies by city. For Black/Brown women founders.",
    deadline: null,
    sectors: ["General"],
    website: "https://blackgirlventures.org",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Harlem Capital",
    opportunity_type: "standard",
    description: "Equity investment (not grant) of $250K-$1M for minority/women founders at Seed-Series A stage in tech-enabled businesses.",
    check_size_min: 250000,
    check_size_max: 1000000,
    stage: ["Seed", "Series A"],
    deadline: null,
    sectors: ["Tech-enabled"],
    website: "https://harlem.capital",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "National Black MBA Scale-Up Pitch",
    opportunity_type: "pitch_competition",
    description: "Live pitch in Atlanta. $50,000 for 1st place. For Black entrepreneurs. Check NBMBAA website for dates.",
    check_size_min: 50000,
    check_size_max: 50000,
    deadline: null,
    sectors: ["General"],
    website: "https://nbmbaa.org",
    is_active: true,
    chicago_focused: false
  },
  {
    name: "Kinetic Black Business Support",
    opportunity_type: "grant",
    description: "Up to $2,500 for Black-owned businesses in Midwest/Northeast with <25 employees. Must be in service area.",
    check_size_min: 1000,
    check_size_max: 2500,
    deadline: null,
    sectors: ["General"],
    website: "https://kineticbyboe.com",
    is_active: true,
    chicago_focused: true
  }
];

async function addOpportunities() {
  console.log(`\nPreparing to add ${newOpportunities.length} funding opportunities...\n`);

  // First, check for existing opportunities to avoid duplicates
  const { data: existing, error: fetchError } = await supabase
    .from('funding_opportunities')
    .select('name');

  if (fetchError) {
    console.error('Error fetching existing opportunities:', fetchError);
    return;
  }

  const existingNames = new Set(existing.map(o => o.name.toLowerCase()));

  // Filter out duplicates
  const toAdd = newOpportunities.filter(opp => {
    const isDuplicate = existingNames.has(opp.name.toLowerCase());
    if (isDuplicate) {
      console.log(`⏭️  Skipping duplicate: ${opp.name}`);
    }
    return !isDuplicate;
  });

  console.log(`\n${toAdd.length} new opportunities to add (${newOpportunities.length - toAdd.length} duplicates skipped)\n`);

  if (toAdd.length === 0) {
    console.log('No new opportunities to add.');
    return;
  }

  // Insert in batches of 10
  const batchSize = 10;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toAdd.length; i += batchSize) {
    const batch = toAdd.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('funding_opportunities')
      .insert(batch)
      .select();

    if (error) {
      console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
      errorCount += batch.length;
    } else {
      successCount += data.length;
      batch.forEach(opp => {
        const chicagoTag = opp.chicago_focused ? '🏙️ ' : '';
        const featuredTag = opp.featured ? '⭐ ' : '';
        console.log(`✅ Added: ${featuredTag}${chicagoTag}${opp.name}`);
      });
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ Successfully added: ${successCount} opportunities`);
  if (errorCount > 0) {
    console.log(`❌ Failed to add: ${errorCount} opportunities`);
  }

  // Get new total count
  const { count } = await supabase
    .from('funding_opportunities')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total opportunities in database: ${count}`);

  // Count Chicago-focused
  const { count: chicagoCount } = await supabase
    .from('funding_opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('chicago_focused', true);

  console.log(`🏙️  Chicago-focused opportunities: ${chicagoCount}`);
}

addOpportunities().catch(console.error);
