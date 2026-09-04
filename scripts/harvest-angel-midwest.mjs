#!/usr/bin/env node
/**
 * Harvest investor data from angel networks and Midwest-specific VC directories
 * Sources: Angel networks, IVCA, MichVCA, and curated Midwest firm list
 */
import { insertToStaging, fetchWithRetry, sleep, getExistingNames, isDuplicate, normalizeName, supabase } from './harvester-utils.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Curated Seed Lists ─────────────────────────────────────────────────────

const CURATED_CHICAGO_ANGELS = [
  {
    name: 'Hyde Park Angels',
    organization: 'Hyde Park Angels',
    description: 'One of the most active and largest angel investing groups in the US, based in Chicago. Invests in early-stage companies across sectors.',
    website: 'https://hydeparkangels.com',
    location: 'Chicago, IL',
    opportunity_type: 'angel',
    stage: ['pre-seed', 'seed'],
    check_size_min: 100000,
    check_size_max: 500000,
    chicago_focused: true,
    confidence_score: 90,
  },
  {
    name: 'IrishAngels',
    organization: 'IrishAngels',
    description: 'Notre Dame alumni angel investing network based in Chicago, investing in early-stage startups.',
    website: 'https://irishangels.com',
    location: 'Chicago, IL',
    opportunity_type: 'angel',
    stage: ['seed', 'series-a'],
    check_size_min: 100000,
    check_size_max: 500000,
    chicago_focused: true,
    confidence_score: 90,
  },
  {
    name: 'Blue Sage Capital',
    organization: 'Blue Sage Capital',
    description: 'Chicago-based angel group focused on early-stage technology companies.',
    website: 'https://bluesagecapital.com',
    location: 'Chicago, IL',
    opportunity_type: 'angel',
    stage: ['seed'],
    chicago_focused: true,
    confidence_score: 75,
  },
  {
    name: 'Illinois Angels',
    organization: 'Illinois Angels',
    description: 'Angel investing network connecting accredited investors with Illinois-based startups.',
    location: 'Illinois',
    opportunity_type: 'angel',
    stage: ['pre-seed', 'seed'],
    chicago_focused: true,
    confidence_score: 70,
  },
];

const CURATED_CHICAGO_VCS = [
  {
    name: 'Pritzker Group',
    organization: 'Pritzker Group',
    description: 'Chicago-based investment firm with venture capital, private capital, and asset management arms. Invests across stages in technology companies.',
    website: 'https://pritzkergroup.com',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a', 'series-b', 'growth'],
    chicago_focused: true,
    confidence_score: 90,
  },
  {
    name: 'Lightbank',
    organization: 'Lightbank',
    description: 'Chicago-based venture capital firm founded by Groupon co-founders. Invests in early-stage technology companies.',
    website: 'https://lightbank.com',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    check_size_min: 500000,
    check_size_max: 5000000,
    chicago_focused: true,
    confidence_score: 90,
  },
  {
    name: 'MATH Venture Partners',
    organization: 'MATH Venture Partners',
    description: 'Chicago-based venture capital firm investing in early-stage B2B software and technology companies.',
    website: 'https://mathventurepartners.com',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    sectors: ['B2B', 'SaaS', 'Technology'],
    chicago_focused: true,
    confidence_score: 90,
  },
  {
    name: 'OCA Ventures',
    organization: 'OCA Ventures',
    description: 'Chicago-based early-stage venture capital firm investing in technology-driven companies.',
    website: 'https://ocaventures.com',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    check_size_min: 500000,
    check_size_max: 3000000,
    sectors: ['Technology', 'Healthcare', 'FinTech'],
    chicago_focused: true,
    confidence_score: 90,
  },
  {
    name: 'Chicago Ventures',
    organization: 'Chicago Ventures',
    description: 'Venture capital firm focused exclusively on Chicago-based startups at the pre-seed and seed stage.',
    website: 'https://chicagoventures.com',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['pre-seed', 'seed'],
    check_size_min: 100000,
    check_size_max: 1000000,
    chicago_focused: true,
    confidence_score: 90,
  },
  {
    name: 'Valor Equity Partners',
    organization: 'Valor Equity Partners',
    description: 'Chicago-based growth equity firm known for early investments in Tesla and SpaceX. Focus on operational improvement.',
    website: 'https://valorep.com',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['series-b', 'growth'],
    check_size_min: 10000000,
    check_size_max: 100000000,
    chicago_focused: true,
    confidence_score: 85,
  },
  {
    name: 'Origin Ventures',
    organization: 'Origin Ventures',
    description: 'Chicago-based seed and early-stage venture capital firm investing in technology companies.',
    website: 'https://originventures.com',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    check_size_min: 250000,
    check_size_max: 3000000,
    chicago_focused: true,
    confidence_score: 90,
  },
  {
    name: 'Cleveland Avenue',
    organization: 'Cleveland Avenue',
    description: "Chicago-based venture fund founded by former McDonald's CEO Don Thompson. Focused on food, beverage, and restaurant technology.",
    website: 'https://clevelandavenue.com',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a', 'series-b'],
    sectors: ['Food & Beverage', 'Restaurant Tech', 'Consumer'],
    chicago_focused: true,
    confidence_score: 90,
  },
  {
    name: 'M25',
    organization: 'M25',
    description: 'One of the most active pre-seed and seed stage venture funds in the Midwest. Based in Chicago.',
    website: 'https://m25.vc',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['pre-seed', 'seed'],
    check_size_min: 50000,
    check_size_max: 500000,
    chicago_focused: true,
    confidence_score: 90,
  },
  {
    name: 'Left Lane Capital',
    organization: 'Left Lane Capital',
    description: 'Growth-stage consumer internet investor with Chicago roots.',
    website: 'https://leftlanecap.com',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['series-b', 'growth'],
    chicago_focused: true,
    confidence_score: 75,
  },
  {
    name: 'Portage Ventures',
    organization: 'Portage Ventures',
    description: 'Chicago-based venture firm investing in fintech companies globally.',
    website: 'https://portagevc.com',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a', 'series-b'],
    sectors: ['FinTech'],
    chicago_focused: true,
    confidence_score: 85,
  },
  {
    name: 'Vistara Growth',
    organization: 'Vistara Growth',
    description: 'Chicago-based growth equity firm investing in B2B technology companies.',
    website: 'https://vistaragrowth.com',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['growth'],
    sectors: ['B2B', 'Technology'],
    chicago_focused: true,
    confidence_score: 80,
  },
  {
    name: 'Impact Engine',
    organization: 'Impact Engine',
    description: 'Chicago-based impact investing firm focused on companies creating positive social and environmental outcomes.',
    website: 'https://theimpactengine.com',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    sectors: ['Impact', 'Social Enterprise'],
    chicago_focused: true,
    confidence_score: 85,
  },
  {
    name: 'Serra Ventures',
    organization: 'Serra Ventures',
    description: 'Illinois-based early-stage venture fund investing in Midwest tech startups.',
    website: 'https://serraventures.com',
    location: 'Champaign, IL',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    chicago_focused: true,
    confidence_score: 85,
  },
  {
    name: 'Corazon Capital',
    organization: 'Corazon Capital',
    description: 'Chicago-based venture firm investing in diverse founders and Midwest startups.',
    website: 'https://corazoncapital.co',
    location: 'Chicago, IL',
    opportunity_type: 'vc',
    stage: ['pre-seed', 'seed'],
    chicago_focused: true,
    confidence_score: 80,
  },
];

const CURATED_MIDWEST_VCS = [
  {
    name: 'Invest Detroit',
    organization: 'Invest Detroit',
    description: 'Community development financial institution and venture capital firm investing in Detroit-area startups and real estate.',
    website: 'https://investdetroit.com',
    location: 'Detroit, MI',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    sectors: ['Technology', 'Real Estate', 'Community Development'],
    chicago_focused: false,
    confidence_score: 85,
  },
  {
    name: 'Michigan Angel Fund',
    organization: 'Michigan Angel Fund',
    description: 'Michigan-based angel fund investing in early-stage companies with ties to Michigan.',
    website: 'https://miangelfund.com',
    location: 'Ann Arbor, MI',
    opportunity_type: 'angel',
    stage: ['seed'],
    chicago_focused: false,
    confidence_score: 85,
  },
  {
    name: 'Rev1 Ventures',
    organization: 'Rev1 Ventures',
    description: 'Columbus-based venture development firm providing capital, talent, and mentorship to startups.',
    website: 'https://rev1ventures.com',
    location: 'Columbus, OH',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    check_size_min: 100000,
    check_size_max: 1000000,
    chicago_focused: false,
    confidence_score: 85,
  },
  {
    name: 'JumpStart Inc',
    organization: 'JumpStart Inc',
    description: 'Cleveland-based venture development organization investing in and supporting Ohio and Midwest startups.',
    website: 'https://jumpstartinc.org',
    location: 'Cleveland, OH',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    chicago_focused: false,
    confidence_score: 85,
  },
  {
    name: 'Drive Capital',
    organization: 'Drive Capital',
    description: 'Columbus-based venture capital firm focused on Midwest tech companies. One of the largest Midwest VC firms.',
    website: 'https://drivecapital.com',
    location: 'Columbus, OH',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a', 'series-b'],
    check_size_min: 500000,
    check_size_max: 25000000,
    chicago_focused: false,
    confidence_score: 90,
  },
  {
    name: 'NCT Ventures',
    organization: 'NCT Ventures',
    description: 'Cincinnati-based venture capital firm investing in early-stage technology companies in the Midwest.',
    website: 'https://nctventures.com',
    location: 'Cincinnati, OH',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    chicago_focused: false,
    confidence_score: 85,
  },
  {
    name: 'Gener8tor',
    organization: 'Gener8tor',
    description: 'Milwaukee-based nationally-ranked accelerator and venture fund investing in high-growth startups.',
    website: 'https://gener8tor.com',
    location: 'Milwaukee, WI',
    opportunity_type: 'vc',
    stage: ['pre-seed', 'seed'],
    check_size_min: 50000,
    check_size_max: 150000,
    sectors: ['Technology', 'Healthcare', 'Consumer'],
    chicago_focused: false,
    confidence_score: 90,
  },
  {
    name: 'Northwestern Mutual Future Ventures',
    organization: 'Northwestern Mutual Future Ventures',
    description: 'Corporate venture arm of Northwestern Mutual, investing in fintech, insurtech, and related technologies.',
    website: 'https://northwesternmutual.com/future-ventures',
    location: 'Milwaukee, WI',
    opportunity_type: 'vc',
    stage: ['series-a', 'series-b'],
    sectors: ['FinTech', 'InsurTech'],
    chicago_focused: false,
    confidence_score: 85,
  },
  {
    name: 'Great North Ventures',
    organization: 'Great North Ventures',
    description: 'Minneapolis-based venture fund investing in pre-seed and seed stage startups in the Upper Midwest.',
    website: 'https://greatnorthventures.com',
    location: 'Minneapolis, MN',
    opportunity_type: 'vc',
    stage: ['pre-seed', 'seed'],
    check_size_min: 100000,
    check_size_max: 500000,
    chicago_focused: false,
    confidence_score: 85,
  },
  {
    name: 'Rally Ventures',
    organization: 'Rally Ventures',
    description: 'Enterprise technology-focused venture capital firm with presence in Minneapolis.',
    website: 'https://rallyventures.com',
    location: 'Minneapolis, MN',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    sectors: ['Enterprise Technology', 'B2B'],
    chicago_focused: false,
    confidence_score: 85,
  },
  {
    name: 'Elevate Ventures',
    organization: 'Elevate Ventures',
    description: 'Indiana-based venture development organization and fund, investing in Indiana startups at all stages.',
    website: 'https://elevateventures.com',
    location: 'Indianapolis, IN',
    opportunity_type: 'vc',
    stage: ['pre-seed', 'seed', 'series-a'],
    check_size_min: 25000,
    check_size_max: 1000000,
    chicago_focused: false,
    confidence_score: 85,
  },
  {
    name: 'High Alpha',
    organization: 'High Alpha',
    description: 'Indianapolis-based venture studio that conceives, launches, and scales enterprise cloud companies.',
    website: 'https://highalpha.com',
    location: 'Indianapolis, IN',
    opportunity_type: 'vc',
    stage: ['pre-seed', 'seed'],
    sectors: ['Enterprise SaaS', 'Cloud'],
    chicago_focused: false,
    confidence_score: 90,
  },
  {
    name: 'Allos Ventures',
    organization: 'Allos Ventures',
    description: 'Indianapolis-based early-stage venture capital firm investing in B2B technology companies in the Midwest.',
    website: 'https://allosventures.com',
    location: 'Indianapolis, IN',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    sectors: ['B2B', 'Technology'],
    chicago_focused: false,
    confidence_score: 85,
  },
  {
    name: 'Dundee Venture Capital',
    organization: 'Dundee Venture Capital',
    description: 'Omaha-based venture capital firm investing in Midwest and flyover country startups.',
    website: 'https://dundeevc.com',
    location: 'Omaha, NE',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    chicago_focused: false,
    confidence_score: 80,
  },
  {
    name: 'Lewis & Clark Ventures',
    organization: 'Lewis & Clark Ventures',
    description: 'St. Louis-based venture capital firm investing in Midwest B2B software companies.',
    website: 'https://lewisandclarkventures.com',
    location: 'St. Louis, MO',
    opportunity_type: 'vc',
    stage: ['series-a', 'series-b'],
    sectors: ['B2B', 'Software'],
    chicago_focused: false,
    confidence_score: 80,
  },
  {
    name: 'Cultivation Capital',
    organization: 'Cultivation Capital',
    description: 'St. Louis-based venture fund investing in biotech, ag-tech, and technology companies.',
    website: 'https://cultivationcapital.com',
    location: 'St. Louis, MO',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    sectors: ['BioTech', 'AgTech', 'Technology'],
    chicago_focused: false,
    confidence_score: 80,
  },
  {
    name: 'Ludlow Ventures',
    organization: 'Ludlow Ventures',
    description: 'Detroit-based seed-stage venture fund backing founders across the Midwest and beyond.',
    website: 'https://ludlowventures.com',
    location: 'Detroit, MI',
    opportunity_type: 'vc',
    stage: ['pre-seed', 'seed'],
    check_size_min: 100000,
    check_size_max: 500000,
    chicago_focused: false,
    confidence_score: 85,
  },
  {
    name: 'Renaissance Venture Capital',
    organization: 'Renaissance Venture Capital',
    description: 'Michigan-based fund of funds investing in venture capital funds with Michigan exposure.',
    website: 'https://renvcf.com',
    location: 'Ann Arbor, MI',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a', 'series-b'],
    chicago_focused: false,
    confidence_score: 80,
  },
  {
    name: 'Huron River Ventures',
    organization: 'Huron River Ventures',
    description: 'Ann Arbor-based early-stage venture fund investing in Midwest tech companies.',
    website: 'https://huronriverventures.com',
    location: 'Ann Arbor, MI',
    opportunity_type: 'vc',
    stage: ['seed'],
    chicago_focused: false,
    confidence_score: 80,
  },
  {
    name: 'Ohio Innovation Fund',
    organization: 'Ohio Innovation Fund',
    description: 'Ohio-based venture fund investing in startups with ties to Ohio universities and research institutions.',
    website: 'https://ohioinnovationfund.com',
    location: 'Columbus, OH',
    opportunity_type: 'vc',
    stage: ['pre-seed', 'seed'],
    sectors: ['DeepTech', 'Healthcare', 'Technology'],
    chicago_focused: false,
    confidence_score: 80,
  },
  {
    name: 'CincyTech',
    organization: 'CincyTech',
    description: 'Cincinnati-based seed-stage investor supporting startups in Southwest Ohio.',
    website: 'https://cincytech.com',
    location: 'Cincinnati, OH',
    opportunity_type: 'vc',
    stage: ['pre-seed', 'seed'],
    check_size_min: 50000,
    check_size_max: 500000,
    chicago_focused: false,
    confidence_score: 85,
  },
  {
    name: 'Capital Midwest',
    organization: 'Capital Midwest',
    description: 'Midwest-focused venture fund investing in early-stage technology companies.',
    website: 'https://capitalmidwest.com',
    location: 'Midwest',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    chicago_focused: false,
    confidence_score: 75,
  },
  {
    name: 'Startup Moxie',
    organization: 'Startup Moxie',
    description: 'Wisconsin-focused angel investing group and startup support organization.',
    location: 'Madison, WI',
    opportunity_type: 'angel',
    stage: ['pre-seed', 'seed'],
    chicago_focused: false,
    confidence_score: 70,
  },
  {
    name: 'Wisconsin Investment Partners',
    organization: 'Wisconsin Investment Partners',
    description: 'Angel investment group based in Madison, WI, investing in early-stage Wisconsin startups.',
    location: 'Madison, WI',
    opportunity_type: 'angel',
    stage: ['seed'],
    chicago_focused: false,
    confidence_score: 70,
  },
  {
    name: 'Sofia Fund',
    organization: 'Sofia Fund',
    description: 'Minnesota-based venture fund investing in women-led early-stage companies.',
    website: 'https://sofiafund.com',
    location: 'Minneapolis, MN',
    opportunity_type: 'vc',
    stage: ['seed', 'series-a'],
    chicago_focused: false,
    confidence_score: 80,
  },
];

const CURATED_ANGEL_NETWORKS = [
  {
    name: 'Keiretsu Forum',
    organization: 'Keiretsu Forum',
    description: 'One of the largest angel investor networks in the world, with chapters across North America, Europe, and Asia. Members invest in early-stage companies.',
    website: 'https://keiretsuforum.com',
    location: 'National (chapters nationwide)',
    opportunity_type: 'angel',
    stage: ['seed', 'series-a'],
    check_size_min: 25000,
    check_size_max: 2000000,
    chicago_focused: false,
    confidence_score: 80,
  },
  {
    name: 'Golden Seeds',
    organization: 'Golden Seeds',
    description: 'Angel investment firm focused on women-led businesses. One of the most active angel groups in the US.',
    website: 'https://goldenseeds.com',
    location: 'New York, NY (national)',
    opportunity_type: 'angel',
    stage: ['seed', 'series-a'],
    check_size_min: 25000,
    check_size_max: 1000000,
    sectors: ['Women-Led'],
    chicago_focused: false,
    confidence_score: 80,
  },
  {
    name: 'Tech Coast Angels',
    organization: 'Tech Coast Angels',
    description: 'One of the largest and most active angel investing groups in the United States, based in Southern California.',
    website: 'https://techcoastangels.com',
    location: 'Southern California',
    opportunity_type: 'angel',
    stage: ['seed'],
    check_size_min: 50000,
    check_size_max: 1500000,
    chicago_focused: false,
    confidence_score: 80,
  },
  {
    name: 'Angel Capital Association',
    organization: 'Angel Capital Association',
    description: 'Professional association for angel investors and angel groups in North America. Provides resources, education, and a directory of angel groups.',
    website: 'https://angelcapitalassociation.org',
    location: 'National',
    opportunity_type: 'angel',
    stage: ['pre-seed', 'seed'],
    chicago_focused: false,
    confidence_score: 75,
  },
  {
    name: 'New World Angels',
    organization: 'New World Angels',
    description: 'Angel investing group based in South Florida providing capital and mentorship to early-stage companies.',
    website: 'https://newworldangels.com',
    location: 'Florida',
    opportunity_type: 'angel',
    stage: ['seed'],
    chicago_focused: false,
    confidence_score: 70,
  },
  {
    name: 'Sand Hill Angels',
    organization: 'Sand Hill Angels',
    description: 'Silicon Valley angel investment group investing in early-stage technology companies.',
    website: 'https://sandhillangels.com',
    location: 'Menlo Park, CA',
    opportunity_type: 'angel',
    stage: ['seed'],
    chicago_focused: false,
    confidence_score: 70,
  },
];

// ─── Web Scraping Functions ──────────────────────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFirmsFromHtml(html, baseUrl, defaults = {}) {
  const firms = [];

  // Try JSON-LD structured data
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonMatch;
  while ((jsonMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (data['@type'] === 'Organization' || data['@type'] === 'LocalBusiness') {
        firms.push({
          name: data.name,
          description: data.description,
          website: data.url,
          location: data.address?.addressLocality
            ? `${data.address.addressLocality}, ${data.address.addressRegion || ''}`
            : null,
          ...defaults,
        });
      }
    } catch {}
  }

  // Try extracting from common portfolio/member card patterns
  const cardPatterns = [
    /<(?:div|article|li)[^>]*class="[^"]*(?:portfolio|member|company|card|team|investor)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi,
    /<(?:div|article)[^>]*class="[^"]*(?:grid-item|col-|wp-block)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article)>/gi,
  ];

  for (const pattern of cardPatterns) {
    let cardMatch;
    while ((cardMatch = pattern.exec(html)) !== null) {
      const cardHtml = cardMatch[1];
      const nameMatch = cardHtml.match(/<h[2-5][^>]*>([\s\S]*?)<\/h[2-5]>/i);
      if (nameMatch) {
        const name = stripHtml(nameMatch[1]).trim();
        if (name && name.length > 2 && name.length < 100) {
          const descMatch = cardHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
          const desc = descMatch ? stripHtml(descMatch[1]).trim() : null;
          const linkMatch = cardHtml.match(/<a[^>]+href=["']([^"']+)["']/i);
          let website = null;
          if (linkMatch) {
            try { website = new URL(linkMatch[1], baseUrl).toString(); } catch {}
          }
          firms.push({
            name,
            description: desc && desc.length > 10 ? desc : null,
            website: website && !website.includes(baseUrl) ? website : null,
            ...defaults,
          });
        }
      }
    }
  }

  return firms;
}

async function scrapeWebsite(url, label) {
  console.log(`  Fetching ${label}: ${url}`);
  try {
    const res = await fetchWithRetry(url, {}, 2, 2000);
    if (!res || !res.ok) {
      console.log(`  [${label}] HTTP ${res?.status || 'no response'} - using fallback data`);
      return null;
    }
    const html = await res.text();
    console.log(`  [${label}] Got ${html.length} bytes`);
    return html;
  } catch (err) {
    console.log(`  [${label}] Error: ${err.message} - using fallback data`);
    return null;
  }
}

async function scrapeAngelCapitalAssociation() {
  const records = [];
  const html = await scrapeWebsite('https://www.angelcapitalassociation.org/directory/', 'ACA Directory');
  if (!html) return records;

  const firms = extractFirmsFromHtml(html, 'https://www.angelcapitalassociation.org', {
    opportunity_type: 'angel',
    confidence_score: 70,
  });

  const text = stripHtml(html);
  const groupPattern = /([A-Z][A-Za-z\s&'.-]+(?:Angels?|Ventures?|Capital|Fund|Network|Group))\s*[-\u2013\u2014|,]\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?,?\s*[A-Z]{2})/g;
  let gMatch;
  while ((gMatch = groupPattern.exec(text)) !== null) {
    const name = gMatch[1].trim();
    const location = gMatch[2].trim();
    if (name.length > 3 && name.length < 80) {
      records.push({
        name,
        organization: name,
        location,
        opportunity_type: 'angel',
        stage: ['seed'],
        chicago_focused: location.includes('IL') || location.toLowerCase().includes('chicago'),
        confidence_score: 65,
      });
    }
  }

  records.push(...firms);
  console.log(`  [ACA] Extracted ${records.length} groups from directory`);
  return records;
}

async function scrapeIVCA() {
  const records = [];
  const urls = [
    'https://www.ivca.org/members/',
    'https://www.ivca.org/member-directory/',
    'https://illinoisvc.org/members/',
    'https://illinoisvc.org/member-directory/',
  ];

  for (const url of urls) {
    const html = await scrapeWebsite(url, 'IVCA');
    if (html) {
      const firms = extractFirmsFromHtml(html, new URL(url).origin, {
        opportunity_type: 'vc',
        chicago_focused: true,
        confidence_score: 75,
      });
      records.push(...firms);
      if (firms.length > 0) break;

      const text = stripHtml(html);
      const venturePattern = /([A-Z][A-Za-z\s&'.-]+(?:Ventures?|Capital|Partners?|Fund|Group|Equity|Management|Advisors?))/g;
      let vMatch;
      while ((vMatch = venturePattern.exec(text)) !== null) {
        const name = vMatch[1].trim();
        if (name.length > 5 && name.length < 60) {
          records.push({
            name,
            organization: name,
            location: 'Illinois',
            opportunity_type: 'vc',
            stage: ['seed', 'series-a'],
            chicago_focused: true,
            confidence_score: 65,
          });
        }
      }
      if (records.length > 0) break;
    }
    await sleep(1500);
  }

  console.log(`  [IVCA] Extracted ${records.length} members`);
  return records;
}

async function scrapeKeiretsu() {
  const records = [];
  const html = await scrapeWebsite('https://keiretsuforum.com/portfolio/', 'Keiretsu Portfolio');
  if (html) {
    const firms = extractFirmsFromHtml(html, 'https://keiretsuforum.com', {
      opportunity_type: 'angel',
      confidence_score: 70,
    });
    records.push(...firms);
  }
  return records;
}

// ─── SQL Generation ──────────────────────────────────────────────────────────

function escapeSQL(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function formatArray(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  const escaped = arr.map(v => '"' + String(v).replace(/"/g, '\\"') + '"').join(',');
  return "'{" + escaped + "}'";
}

function recordToSQL(r) {
  return `(${[
    escapeSQL(r.name),
    escapeSQL(r.organization || r.name),
    escapeSQL(r.description),
    escapeSQL(r.opportunity_type || 'vc'),
    escapeSQL(r.website),
    escapeSQL(r.website),  // application_link = website
    r.check_size_min || 'NULL',
    r.check_size_max || 'NULL',
    formatArray(r.stage),
    formatArray(r.sectors),
    r.chicago_focused ? 'true' : 'false',
    'false',
    'true',
  ].join(', ')})`;
}

function generateSQL(records, batchLabel) {
  const columns = [
    'name', 'organization', 'description', 'opportunity_type',
    'website', 'application_link', 'check_size_min', 'check_size_max',
    'stage', 'sectors', 'chicago_focused', 'featured', 'is_active'
  ];
  let sql = `-- ${batchLabel}: ${records.length} records\n`;
  sql += `-- Generated ${new Date().toISOString()}\n\n`;
  sql += `INSERT INTO funding_opportunities (\n  ${columns.join(',\n  ')}\n)\nVALUES\n`;
  sql += records.map(r => '  ' + recordToSQL(r)).join(',\n');
  sql += ';\n';
  return sql;
}

/** Filter out junk scraped entries that are clearly not investor/firm names */
function isJunkEntry(name) {
  if (!name || name.length < 3) return true;
  const junkPatterns = [
    /^(menu|nav|footer|header|sidebar|search|subscribe|sign up|log ?in|contact|about|home|privacy|terms|cookie)/i,
    /^(quick links|member benefits|membership|newsletter|learn more|find out|from a bold)/i,
    /^(get started|apply now|read more|see all|view all|load more|show more|next|prev)/i,
    /^(learn about|find out if|from a bold idea)/i,
  ];
  return junkPatterns.some(p => p.test(name.trim()));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Angel Network & Midwest VC Harvester ===\n');

  // Step 1: Collect all curated records
  const allSources = {
    chicago_angels: CURATED_CHICAGO_ANGELS,
    chicago_vcs: CURATED_CHICAGO_VCS,
    midwest_vcs: CURATED_MIDWEST_VCS,
    angel_networks: CURATED_ANGEL_NETWORKS,
  };

  // Step 2: Attempt web scraping for supplemental data
  console.log('--- Web Scraping Supplemental Sources ---\n');

  console.log('[Scraping] Angel Capital Association directory...');
  const acaRecords = await scrapeAngelCapitalAssociation();
  if (acaRecords.length > 0) allSources.aca_scraped = acaRecords;
  await sleep(1500);

  console.log('\n[Scraping] Illinois Venture Capital Association...');
  const ivcaRecords = await scrapeIVCA();
  if (ivcaRecords.length > 0) allSources.ivca_scraped = ivcaRecords;
  await sleep(1500);

  console.log('\n[Scraping] Keiretsu Forum portfolio...');
  const keiretsuRecords = await scrapeKeiretsu();
  if (keiretsuRecords.length > 0) allSources.keiretsu_scraped = keiretsuRecords;
  await sleep(1500);

  console.log('\n[Scraping] Golden Seeds portfolio...');
  const gsHtml = await scrapeWebsite('https://goldenseeds.com/portfolio/', 'Golden Seeds');
  if (gsHtml) {
    const gsRecords = extractFirmsFromHtml(gsHtml, 'https://goldenseeds.com', {
      opportunity_type: 'angel', confidence_score: 70,
    });
    if (gsRecords.length > 0) allSources.golden_seeds_scraped = gsRecords;
  }
  await sleep(1500);

  console.log('\n[Scraping] Tech Coast Angels...');
  const tcaHtml = await scrapeWebsite('https://techcoastangels.com/portfolio/', 'TCA');
  if (tcaHtml) {
    const tcaRecords = extractFirmsFromHtml(tcaHtml, 'https://techcoastangels.com', {
      opportunity_type: 'angel', confidence_score: 70,
    });
    if (tcaRecords.length > 0) allSources.tca_scraped = tcaRecords;
  }

  // Step 3: Dedup against existing funding_opportunities
  console.log('\n\n--- Deduplication ---');
  const existingNames = await getExistingNames();
  console.log(`  Found ${existingNames.size} existing names in funding_opportunities + staging`);

  const dedupedBySource = {};
  let totalNew = 0;
  let totalSkipped = 0;

  for (const [source, records] of Object.entries(allSources)) {
    const newRecords = records.filter(r => {
      if (!r.name || r.name.trim() === '') return false;
      if (isJunkEntry(r.name)) return false;
      if (isDuplicate(r.name, existingNames)) return false;
      existingNames.add(normalizeName(r.name));
      return true;
    });
    const skipped = records.length - newRecords.length;
    dedupedBySource[source] = newRecords;
    totalNew += newRecords.length;
    totalSkipped += skipped;
    console.log(`  [${source}] ${records.length} total -> ${newRecords.length} new (${skipped} duplicates)`);
  }

  console.log(`\n  TOTAL: ${totalNew} new records, ${totalSkipped} duplicates skipped`);

  // Step 4: Flatten all deduped records
  const allRecords = [];
  for (const [source, records] of Object.entries(dedupedBySource)) {
    for (const r of records) {
      allRecords.push({ ...r, _source: source });
    }
  }

  if (allRecords.length === 0) {
    console.log('\nNo new records to insert. All entries are duplicates of existing data.');
    return;
  }

  // Step 5: Try staging table insert first
  console.log('\n--- Attempting staging table insert ---');
  let stagingSuccess = false;
  const stagingStats = {};

  for (const [source, records] of Object.entries(dedupedBySource)) {
    if (records.length === 0) {
      stagingStats[source] = { inserted: 0, skipped: 0, errors: 0 };
      continue;
    }
    const result = await insertToStaging(records, source);
    stagingStats[source] = result;
    if (result.inserted > 0) stagingSuccess = true;
  }

  // Step 6: Generate SQL + JSON output regardless
  const outputDir = join(__dirname, '..', 'tools', 'investor-harvester', 'results');
  try { mkdirSync(outputDir, { recursive: true }); } catch {}

  // JSON output
  const jsonPath = join(outputDir, 'angel-midwest-harvest.json');
  writeFileSync(jsonPath, JSON.stringify(allRecords, null, 2));
  console.log(`\nJSON output: ${jsonPath} (${allRecords.length} records)`);

  // SQL output — split into batches of 50
  const BATCH_SIZE = 50;
  let batchNum = 0;
  let combinedSQL = '';
  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    batchNum++;
    const batch = allRecords.slice(i, i + BATCH_SIZE);
    const sql = generateSQL(batch, `angel-midwest batch ${batchNum}`);
    combinedSQL += sql + '\n';
  }
  const sqlPath = join(outputDir, 'angel-midwest-harvest.sql');
  writeFileSync(sqlPath, combinedSQL);
  console.log(`SQL output:  ${sqlPath} (${batchNum} batches)`);

  // Step 7: Try direct insert with service role key if available
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (allRecords.length > 0 && SERVICE_ROLE_KEY) {
    console.log('\nUsing service role key for direct funding_opportunities insert...');
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const adminSupabase = createAdminClient(
      'https://fbgxeinarhbrqatrsuoj.supabase.co',
      SERVICE_ROLE_KEY
    );

    let directInserted = 0;
    let directErrors = 0;

    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
      const batch = allRecords.slice(i, i + BATCH_SIZE).map(r => ({
        name: r.name?.trim(),
        organization: r.organization?.trim() || r.name?.trim(),
        description: r.description?.trim() || null,
        opportunity_type: r.opportunity_type || 'vc',
        website: r.website?.trim() || null,
        application_link: r.website?.trim() || null,
        check_size_min: r.check_size_min || null,
        check_size_max: r.check_size_max || null,
        stage: Array.isArray(r.stage) ? r.stage : [],
        sectors: Array.isArray(r.sectors) ? r.sectors : [],
        chicago_focused: r.chicago_focused || false,
        featured: false,
        is_active: true,
      }));

      const { error } = await adminSupabase.from('funding_opportunities').insert(batch);
      if (error) {
        console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`);
        directErrors += batch.length;
      } else {
        directInserted += batch.length;
      }
    }

    console.log(`  Direct insert: ${directInserted} inserted, ${directErrors} errors`);
  } else if (allRecords.length > 0 && !SERVICE_ROLE_KEY) {
    console.log('\nNo SUPABASE_SERVICE_ROLE_KEY set. Records saved to files only.');
    console.log('To insert, either:');
    console.log(`  1. Run SQL in Supabase SQL Editor: ${sqlPath}`);
    console.log('  2. Re-run with: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/harvest-angel-midwest.mjs');
  }

  // Summary
  console.log('\n\n========== FINAL SUMMARY ==========');
  console.log('\nRecords by source:');
  for (const [source, records] of Object.entries(dedupedBySource)) {
    const stg = stagingStats[source] || { inserted: 0, skipped: 0, errors: 0 };
    console.log(`  ${source.padEnd(25)} ${records.length} new records (staging: ${stg.inserted} inserted, ${stg.errors} errors)`);
  }
  console.log(`\n  TOTAL NEW RECORDS: ${allRecords.length}`);
  console.log(`  Output files:`);
  console.log(`    JSON: ${jsonPath}`);
  console.log(`    SQL:  ${sqlPath}`);
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
