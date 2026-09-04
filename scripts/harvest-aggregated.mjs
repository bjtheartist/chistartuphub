#!/usr/bin/env node
/**
 * Aggregated Investor Data Harvester
 * Combines embedded datasets + runtime fetches for maximum volume.
 * Target: 2000+ unique investor records.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'data', 'harvest-aggregated-sources.json');

// Dedup tracking
const seen = new Set();
const allRecords = [];

function norm(n) {
  if (!n) return '';
  return n.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function add(rec) {
  if (!rec.name || rec.name.trim().length < 3) return;
  const key = norm(rec.name);
  if (seen.has(key)) return;
  seen.add(key);
  allRecords.push({
    name: rec.name.trim(),
    organization: rec.organization || rec.name.trim(),
    description: rec.description || '',
    opportunity_type: rec.opportunity_type || 'vc',
    website: rec.website || '',
    location: rec.location || '',
    chicago_focused: rec.chicago_focused || false,
    confidence_score: rec.confidence_score || 65,
    source: rec.source || 'unknown',
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// SOURCE 1: SBA SBIC Directory (280+ funds)
// ============================================================
function loadSBIC() {
  console.log('[SBIC] Loading embedded SBA SBIC data...');
  const data = [
    {n:"1st Source Capital Corporation",l:"South Bend, IN",t:"Venture"},
    {n:"AAVIN Capital III, LP",l:"Cedar Rapids, IA",t:"Hybrid"},
    {n:"Abacus Finance SBIC Fund I, L.P.",l:"New York, NY",t:"Private Credit"},
    {n:"AE Ventures Fund III, LP",l:"Boca Raton, FL",t:"Venture"},
    {n:"Aldine Capital Fund II, L.P.",l:"Chicago, IL",t:"Hybrid"},
    {n:"Aldine Capital Fund III, LP",l:"Chicago, IL",t:"Hybrid"},
    {n:"Aldine Capital Fund IV, LP",l:"Chicago, IL",t:"Hybrid"},
    {n:"Argentum Capital Partners III, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"Argentum Capital Partners IV, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"Argosy Investment Partners IV, L.P.",l:"Wayne, PA",t:"Hybrid"},
    {n:"Argosy Investment Partners SBIC 7, L.P.",l:"Wayne, PA",t:"PE"},
    {n:"Argosy Investment Partners SBIC VI, L.P.",l:"Wayne, PA",t:"Hybrid"},
    {n:"Argosy Investment Partners V, L.P.",l:"Wayne, PA",t:"Hybrid"},
    {n:"Avante Capital Partners SBIC III, L.P.",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"Avante Capital Partners SBIC III-A, L.P.",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"Avante Capital Partners SBIC IV, L.P.",l:"Los Angeles, CA",t:"Private Credit"},
    {n:"Avante Mezzanine Partners SBIC II, L.P.",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"Avante Mezzanine Partners SBIC, L.P.",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"Balance Point Capital Partners II, L.P.",l:"Westport, CT",t:"Hybrid"},
    {n:"Balance Point Capital Partners IV, L.P.",l:"Westport, CT",t:"Hybrid"},
    {n:"Balance Point Capital Partners VII, L.P.",l:"Westport, CT",t:"Private Credit"},
    {n:"Ballast Point Ventures III, L.P.",l:"Tampa, FL",t:"Venture"},
    {n:"Ballast Point Ventures IV, L.P.",l:"Tampa, FL",t:"Venture"},
    {n:"Barings Small Business Fund, L.P.",l:"Charlotte, NC",t:"Hybrid"},
    {n:"Bayview Capital Partners III LP",l:"Minnetonka, MN",t:"PE"},
    {n:"Bayview Capital Partners IV LP",l:"Minnetonka, MN",t:"PE"},
    {n:"BBK Ventures Fund I, LP",l:"Dallas, TX",t:"Fund of Funds"},
    {n:"BIP III SBIC, LP",l:"McLean, VA",t:"PE"},
    {n:"Blue Sage Capital II, L.P.",l:"Austin, TX",t:"Hybrid"},
    {n:"Blue Sage Strategic Credit Fund, L.P.",l:"Austin, TX",t:"Hybrid"},
    {n:"Bluehenge Capital SBIC II, L.P.",l:"Baton Rouge, LA",t:"Hybrid"},
    {n:"Bluehenge Capital SBIC III, LP",l:"Baton Rouge, LA",t:"Private Credit"},
    {n:"Bluehenge Capital Secured Debt SBIC, LP",l:"Baton Rouge, LA",t:"Private Credit"},
    {n:"Bluhaus Small Business Fund II, LP",l:"Guaynabo, PR",t:"Hybrid"},
    {n:"Bluhaus Small Business Fund, L.P.",l:"Guaynabo, PR",t:"Hybrid"},
    {n:"Boathouse Capital II LP",l:"Wayne, PA",t:"Hybrid"},
    {n:"Boathouse Capital III LP",l:"Wayne, PA",t:"Hybrid"},
    {n:"Boathouse Capital IV LP",l:"Berwyn, PA",t:"PE"},
    {n:"Boathouse Capital LP",l:"Wayne, PA",t:"Hybrid"},
    {n:"BRC Fund IV, LP",l:"Minnetonka, MN",t:"PE"},
    {n:"Brightwood Capital SBIC III, L.P.",l:"New York, NY",t:"Private Credit"},
    {n:"Brightwood Capital SBIC IV, LP",l:"New York, NY",t:"Private Credit"},
    {n:"Brookside Capital Fund V SBIC, L.P.",l:"Stamford, CT",t:"Private Credit"},
    {n:"Brookside Mezzanine Fund III, L.P.",l:"Stamford, CT",t:"Hybrid"},
    {n:"Brookside Mezzanine Fund IV, L.P.",l:"Stamford, CT",t:"Hybrid"},
    {n:"BSCP SBIC I, LP",l:"Alexandria, VA",t:"Hybrid"},
    {n:"BSCP SBIC II, LP",l:"Alexandria, VA",t:"Hybrid"},
    {n:"C3 Capital Partners II, L.P.",l:"Kansas City, MO",t:"Hybrid"},
    {n:"C3 Capital Partners III, L.P.",l:"Kansas City, MO",t:"Hybrid"},
    {n:"C3 Capital Partners, LP",l:"Kansas City, MO",t:"Hybrid"},
    {n:"Caltius Equity Partners V, LP",l:"Los Angeles, CA",t:"PE"},
    {n:"Caltius Partners V (SBIC), L.P.",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"Caltius Partners VI (SBIC), L.P.",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"Cambridge Ventures, LP",l:"Indianapolis, IN",t:"Hybrid"},
    {n:"Canapi Ventures SBIC Fund II, L.P.",l:"Washington, DC",t:"Venture"},
    {n:"Canapi Ventures SBIC Fund, L.P.",l:"Washington, DC",t:"Venture"},
    {n:"Capital Alignment Partners IV-A, L.P.",l:"Nashville, TN",t:"Hybrid"},
    {n:"Capital Alignment Partners IV-B, L.P.",l:"Nashville, TN",t:"Hybrid"},
    {n:"Capital Southwest SBIC I, L.P.",l:"Dallas, TX",t:"Private Credit"},
    {n:"Capital Southwest SBIC II, LP",l:"Dallas, TX",t:"Private Credit"},
    {n:"Capitala SBIC Fund VI, L.P.",l:"Charlotte, NC",t:"Hybrid"},
    {n:"CapitalSouth SBIC Fund IV, L.P.",l:"Charlotte, NC",t:"Hybrid"},
    {n:"CapitalSpring SBIC II, L.P.",l:"Nashville, TN",t:"Hybrid"},
    {n:"CCP IV-SBIC, L.P.",l:"Indianapolis, IN",t:"Hybrid"},
    {n:"CCP V-SBIC, L.P.",l:"Indianapolis, IN",t:"Hybrid"},
    {n:"CCP VI-SBIC, L.P.",l:"Indianapolis, IN",t:"PE"},
    {n:"Central Valley Fund III (SBIC), L.P.",l:"Davis, CA",t:"Hybrid"},
    {n:"Cephas Capital Partners III, LP",l:"Pittsford, NY",t:"Hybrid"},
    {n:"CFB Venture Fund L.P.",l:"Saint Louis, MO",t:"Growth Equity"},
    {n:"Champlain Capital Partners II, L.P.",l:"San Francisco, CA",t:"Hybrid"},
    {n:"Champlain Capital Partners III, L.P.",l:"San Francisco, CA",t:"Hybrid"},
    {n:"Champlain Capital Partners IV, L.P.",l:"San Francisco, CA",t:"Hybrid"},
    {n:"Charter Growth Capital Fund II, L.P.",l:"Grand Rapids, MI",t:"Hybrid"},
    {n:"Concentric Partners I, L.P.",l:"Raleigh, NC",t:"Hybrid"},
    {n:"Convergent Capital Partners III, L.P.",l:"Scottsdale, AZ",t:"Hybrid"},
    {n:"Convergent Capital Partners IV, LP",l:"Eden Prairie, MN",t:"Hybrid"},
    {n:"Corbel Capital Partners SBIC II, L.P.",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"Corbel Capital Partners SBIC, L.P.",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"Corbel Equity Partners SBIC, L.P.",l:"Los Angeles, CA",t:"PE"},
    {n:"Costella Kirsch SBIC, LP",l:"Menlo Park, CA",t:"Private Credit"},
    {n:"Courage Healthcare SBIC Fund I, L.P.",l:"Nashville, TN",t:"Private Credit"},
    {n:"Crescent Direct Lending SBIC Fund, L.P.",l:"Boston, MA",t:"Private Credit"},
    {n:"Cultivation Capital Seed Fund III GP, LLC",l:"St. Louis, MO",t:"Venture"},
    {n:"Cultivation Twain Seed Fund I, L.P.",l:"St. Louis, MO",t:"Venture"},
    {n:"Cyprium SBIC I, L.P.",l:"Cleveland, OH",t:"Hybrid"},
    {n:"Dauntless Ventures SBIC-A, L.P.",l:"Provo, UT",t:"Venture"},
    {n:"Dauntless Ventures SBIC-B, L.P.",l:"Provo, UT",t:"Venture"},
    {n:"DC Small Business Fund, LP",l:"Jacksonville Beach, FL",t:"PE"},
    {n:"DCA Capital Partners II, L.P.",l:"Roseville, CA",t:"Growth Equity"},
    {n:"DCA Capital Partners III SBIC, L.P.",l:"Roseville, CA",t:"PE"},
    {n:"Deerpath Funding Advantage IV, L.P.",l:"New York, NY",t:"Private Credit"},
    {n:"Deerpath Funding V, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"Diamond State Ventures III, L.P.",l:"Little Rock, AR",t:"Hybrid"},
    {n:"Dos Rios Partners, L.P.",l:"Austin, TX",t:"Hybrid"},
    {n:"Dos Rios Partners-A, L.P.",l:"Austin, TX",t:"Hybrid"},
    {n:"Eagle Fund III, L.P.",l:"Saint Louis, MO",t:"Hybrid"},
    {n:"Eagle Fund IV, LP",l:"Saint Louis, MO",t:"Hybrid"},
    {n:"Eagle Fund V, L.P.",l:"St. Louis, MO",t:"Hybrid"},
    {n:"Eagle Fund VI-A, LP",l:"St. Louis, MO",t:"Hybrid"},
    {n:"East Coast Capital Holdings Ltd.",l:"New York, NY",t:"PE"},
    {n:"Emigrant Capital Corporation",l:"New York, NY",t:"Hybrid"},
    {n:"Energy Impact Credit Fund I LP",l:"New York, NY",t:"Hybrid"},
    {n:"Energy Impact Credit Fund II LP",l:"New York, NY",t:"Hybrid"},
    {n:"Enhanced SBIC II, L.P.",l:"San Francisco, CA",t:"Private Credit"},
    {n:"Enlightenment Capital Solutions SBIC Fund, L.P.",l:"Chevy Chase, MD",t:"Hybrid"},
    {n:"EPIC Venture Fund IV, LLC",l:"Salt Lake City, UT",t:"Venture"},
    {n:"Escalate Capital IV, LP",l:"Austin, TX",t:"Private Credit"},
    {n:"Escalate Capital V, LP",l:"Austin, TX",t:"PE"},
    {n:"Everside SBIC I, LP",l:"New York, NY",t:"Hybrid"},
    {n:"Farragut SBIC Fund II, L.P.",l:"Chevy Chase, MD",t:"Hybrid"},
    {n:"Farragut SBIC Fund III, LP",l:"Chevy Chase, MD",t:"Hybrid"},
    {n:"FCP Fund II, L.P.",l:"Omaha, NE",t:"Hybrid"},
    {n:"FCP Fund III, L.P.",l:"Omaha, NE",t:"Hybrid"},
    {n:"Fidus Mezzanine Capital III, L.P.",l:"Evanston, IL",t:"Hybrid"},
    {n:"Fidus Mezzanine Capital IV, L.P.",l:"Evanston, IL",t:"Private Credit"},
    {n:"Firmament Capital Partners SBIC III, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"Firmament Partners SBIC IV, L.P",l:"New York, NY",t:"Private Credit"},
    {n:"Five Points Capital Partners IV, L.P.",l:"Winston-Salem, NC",t:"Hybrid"},
    {n:"Five Points Credit SBIC IV, L.P.",l:"Winston-Salem, NC",t:"Hybrid"},
    {n:"Five Points Credit SBIC V LP",l:"Winston-Salem, NC",t:"Private Credit"},
    {n:"Five Points Mezzanine Fund III, L.P.",l:"Winston-Salem, NC",t:"Hybrid"},
    {n:"Frontier Fund I Alpha, LP",l:"Arlington, VA",t:"Venture"},
    {n:"GarMark SBIC Fund II, L.P.",l:"Stamford, CT",t:"Hybrid"},
    {n:"GarMark SBIC Fund, L.P.",l:"Stamford, CT",t:"Hybrid"},
    {n:"Gemini Investors VII, L.P.",l:"Wellesley, MA",t:"Venture"},
    {n:"Gemini Investors VIII, L.P.",l:"Wellesley, MA",t:"PE"},
    {n:"GMB Mezzanine Capital II, L.P.",l:"Minneapolis, MN",t:"Hybrid"},
    {n:"GMB Mezzanine Capital III, L.P.",l:"Minneapolis, MN",t:"Hybrid"},
    {n:"GMB Mezzanine Capital IV, L.P.",l:"Minneapolis, MN",t:"Hybrid"},
    {n:"GMB Mezzanine Capital V, L.P.",l:"Minneapolis, MN",t:"PE"},
    {n:"GP Capital Partners II, LP",l:"Houston, TX",t:"Hybrid"},
    {n:"GP Capital Partners, LP",l:"Houston, TX",t:"Private Credit"},
    {n:"Granite Creek FlexCap II, L.P.",l:"Chicago, IL",t:"Hybrid"},
    {n:"Granite Creek FlexCap III, L.P.",l:"Chicago, IL",t:"Hybrid"},
    {n:"Graycliff Mezzanine II LP",l:"New York, NY",t:"Hybrid"},
    {n:"Graycliff Mezzanine III (SBIC) LP",l:"New York, NY",t:"Hybrid"},
    {n:"Graycliff Mezzanine IV (SBIC) LP",l:"New York, NY",t:"Hybrid"},
    {n:"Grayhawk Ventures Fund III, L.P.",l:"Scottsdale, AZ",t:"Growth Equity"},
    {n:"Hamilton Lane National Small Business Credit Fund, L.P.",l:"Conshohocken, PA",t:"PE"},
    {n:"Harbert Mezzanine Partners II SBIC, L.P.",l:"Birmingham, AL",t:"Hybrid"},
    {n:"Haven Capital Partners I, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"HCAP Partners IV, L.P.",l:"La Jolla, CA",t:"Hybrid"},
    {n:"HCAP Partners V, L.P.",l:"La Jolla, CA",t:"Hybrid"},
    {n:"HCAP Partners VI, L.P.",l:"La Jolla, CA",t:"Hybrid"},
    {n:"Hercules Capital IV, L.P.",l:"Palo Alto, CA",t:"Hybrid"},
    {n:"Hercules SBIC V, L.P.",l:"San Mateo, CA",t:"Private Credit"},
    {n:"Hidden River Strategic Capital I, LP",l:"Radnor, PA",t:"Hybrid"},
    {n:"High Street Capital V SBIC, L.P.",l:"Chicago, IL",t:"Hybrid"},
    {n:"High Street Capital VI SBIC, L.P.",l:"Chicago, IL",t:"Hybrid"},
    {n:"Hoist Capital Partners SBIC I, L.P.",l:"Birmingham, AL",t:"Hybrid"},
    {n:"Holleway IPA Fund II, LP",l:"St Louis, MO",t:"PE"},
    {n:"Holleway IPA Fund, L.P.",l:"St. Louis, MO",t:"Hybrid"},
    {n:"Hudson Ferry Capital III, L.P.",l:"Stamford, CT",t:"PE"},
    {n:"IMB Partners SBIC I, L.P.",l:"Bethesda, MD",t:"Hybrid"},
    {n:"Independent Bankers Capital Fund III, L.P.",l:"Dallas, TX",t:"Hybrid"},
    {n:"Independent Bankers Capital Fund IV, L.P.",l:"Dallas, TX",t:"Hybrid"},
    {n:"Innovate Capital Growth Fund, L.P.",l:"Philadelphia, PA",t:"Growth Equity"},
    {n:"Invision Capital II, L.P.",l:"Chicago, IL",t:"Hybrid"},
    {n:"Invision Capital III-A, L.P.",l:"Chicago, IL",t:"Hybrid"},
    {n:"Ironwood Capital Partners V SBIC, L.P.",l:"Avon, CT",t:"Hybrid"},
    {n:"Ironwood Mezzanine Fund III-A LP",l:"Avon, CT",t:"Hybrid"},
    {n:"Ironwood Mezzanine Fund IV-A, L.P.",l:"Avon, CT",t:"Hybrid"},
    {n:"Kansas Venture Capital, Inc.",l:"Overland Park, KS",t:"Hybrid"},
    {n:"Keswick Partners Fund I, LP",l:"Tampa, FL",t:"Hybrid"},
    {n:"Kian Growth Partners III, L.P.",l:"Charlotte, NC",t:"Growth Equity"},
    {n:"Kian Mezzanine Partners I, L.P.",l:"Charlotte, NC",t:"Hybrid"},
    {n:"Kian Mezzanine Partners II, L.P.",l:"Charlotte, NC",t:"Hybrid"},
    {n:"Lafayette Square SBIC, LP",l:"Miami, FL",t:"Hybrid"},
    {n:"Lake Country Capital SBIC LP",l:"Edina, MN",t:"Hybrid"},
    {n:"LBC Small Cap SBIC, L.P.",l:"Radnor, PA",t:"Private Credit"},
    {n:"LCM Healthcare Fund I, L.P.",l:"Dallas, TX",t:"Growth Equity"},
    {n:"LFE Growth Fund IV, L.P.",l:"Naples, FL",t:"Venture"},
    {n:"Lightspring Capital I, LP",l:"St. Louis Park, MN",t:"Hybrid"},
    {n:"Lightspring Capital II, LP",l:"Minneapolis, MN",t:"Hybrid"},
    {n:"Lineage Capital II, L.P.",l:"Boston, MA",t:"Hybrid"},
    {n:"Lineage Capital III, L.P.",l:"Boston, MA",t:"Hybrid"},
    {n:"LNC Partners II - SBIC, L.P.",l:"Reston, VA",t:"Hybrid"},
    {n:"LNC Partners III-SBIC, L.P.",l:"Reston, VA",t:"Hybrid"},
    {n:"LO3 SBIC, LP",l:"Nashville, TN",t:"Private Credit"},
    {n:"LongueVue Capital Partners III, L.P",l:"Metairie, LA",t:"Hybrid"},
    {n:"LongueVue Capital Partners IV, L.P.",l:"Metairie, LA",t:"Hybrid"},
    {n:"LongWater SBIC Fund I LP",l:"Fargo, ND",t:"Hybrid"},
    {n:"Main Street Capital III, L.P.",l:"Houston, TX",t:"Private Credit"},
    {n:"Main Street Mezzanine Fund, L.P.",l:"Houston, TX",t:"Hybrid"},
    {n:"Maranon Mezzanine Fund III-B, L.P.",l:"Chicago, IL",t:"Hybrid"},
    {n:"Marquette Capital Fund II, LP",l:"St. Louis Park, MN",t:"Hybrid"},
    {n:"McLarty Capital Partners SBIC II, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"McLarty Capital Partners SBIC, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"MCM Capital Partners III Parallel Fund, L.P.",l:"Beachwood, OH",t:"PE"},
    {n:"MCM Capital Partners IV, LP",l:"Cleveland, OH",t:"Hybrid"},
    {n:"Medallion Capital, Inc.",l:"Excelsior, MN",t:"Private Credit"},
    {n:"Medallion Funding LLC",l:"New York, NY",t:"Private Credit"},
    {n:"Merion Investment Partners III, LP",l:"Wayne, PA",t:"Hybrid"},
    {n:"Merion Investment Partners IV, LP",l:"Wayne, PA",t:"Hybrid"},
    {n:"Michigan Capital Network Venture Fund V, LP",l:"Grand Rapids, MI",t:"Venture"},
    {n:"Midwest Growth Partners IV, LP",l:"West Des Moines, IA",t:"PE"},
    {n:"MidWest Mezzanine Fund V SBIC, L.P.",l:"Chicago, IL",t:"Hybrid"},
    {n:"Midwest Mezzanine Fund VI SBIC, L.P.",l:"Chicago, IL",t:"Hybrid"},
    {n:"Midwest Mezzanine Fund VII SBIC, L.P.",l:"Chicago, IL",t:"Private Credit"},
    {n:"Mizzen Capital III, LP",l:"Stamford, CT",t:"Private Credit"},
    {n:"Mizzen Capital, L.P.",l:"Stamford, CT",t:"Hybrid"},
    {n:"Mosaic Capital Investors I, LP",l:"Charlotte, NC",t:"Hybrid"},
    {n:"Mosaic Capital Investors II SBIC, L.P.",l:"Charlotte, NC",t:"PE"},
    {n:"Mountain State Capital SBIC, L.P.",l:"Morgantown, WV",t:"Venture"},
    {n:"Mountain Ventures, Inc.",l:"London, KY",t:"Private Credit"},
    {n:"Multiplier Capital II, L.P",l:"Washington, DC",t:"Private Credit"},
    {n:"Multiplier Capital III, L.P.",l:"Washington, DC",t:"Private Credit"},
    {n:"MV Fund II SBIC, L.P.",l:"Folsom, CA",t:"Venture"},
    {n:"MV Fund III SBIC, L.P.",l:"Folsom, CA",t:"Venture"},
    {n:"New Canaan Funding Mezzanine VI SBIC, L.P.",l:"New Canaan, CT",t:"Hybrid"},
    {n:"New Canaan Funding Mezzanine VII SBIC, L.P.",l:"Naples, FL",t:"Hybrid"},
    {n:"New Mountain Finance SBIC II, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"New Mountain Finance SBIC III, L.P.",l:"New York, NY",t:"Private Credit"},
    {n:"New Mountain Finance SBIC, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"New North Ventures Fund II SBIC, LP",l:"Portsmouth, NH",t:"Venture"},
    {n:"NewSpring Mezzanine Capital III, L.P.",l:"Radnor, PA",t:"Hybrid"},
    {n:"NewSpring Mezzanine Capital IV, L.P.",l:"Radnor, PA",t:"Hybrid"},
    {n:"NewSpring Mezzanine Capital V, L.P.",l:"Radnor, PA",t:"Hybrid"},
    {n:"North Atlantic Venture Fund V, L.P.",l:"Portland, ME",t:"Hybrid"},
    {n:"NorthCoast Mezzanine SBIC III, L.P.",l:"Minneapolis, MN",t:"Hybrid"},
    {n:"Northcreek Mezzanine Fund II, L.P.",l:"Cincinnati, OH",t:"Hybrid"},
    {n:"Northcreek Mezzanine Fund III, L.P.",l:"Cincinnati, OH",t:"Hybrid"},
    {n:"Northcreek Mezzanine Fund IV, L.P.",l:"Cincinnati, OH",t:"Private Credit"},
    {n:"Northstar Mezzanine Partners SBIC II, LP",l:"Minneapolis, MN",t:"PE"},
    {n:"Northstar Mezzanine Partners SBIC, LP",l:"Minneapolis, MN",t:"Hybrid"},
    {n:"Norwest Strategic Capital, L.P.",l:"Palo Alto, CA",t:"Venture"},
    {n:"o15 Emerging America Credit Opportunities Fund LP",l:"Atlanta, GA",t:"Private Credit"},
    {n:"Oaktree SBIC Fund, L.P.",l:"New York, NY",t:"Private Credit"},
    {n:"ONE Bow River National Defense Fund, LP",l:"Colorado Springs, CO",t:"Growth Equity"},
    {n:"Oxer BCP Mezzanine Fund, L.P.",l:"Columbus, OH",t:"Hybrid"},
    {n:"Oxer Mezzanine Fund II, L.P.",l:"Columbus, OH",t:"Hybrid"},
    {n:"Oxer Mezzanine Fund III, L.P.",l:"Columbus, OH",t:"Hybrid"},
    {n:"Parliament SBIC Growth Fund, LP",l:"San Juan, PR",t:"Private Credit"},
    {n:"Patriot Capital III SBIC, L.P.",l:"Baltimore, MD",t:"Hybrid"},
    {n:"Patriot Capital IV (A), L.P.",l:"Baltimore, MD",t:"Hybrid"},
    {n:"Patriot Capital V, L.P.",l:"Baltimore, MD",t:"Hybrid"},
    {n:"PCI II, L.P.",l:"Lutherville, MD",t:"Hybrid"},
    {n:"PCI III, L.P.",l:"Towson, MD",t:"Private Credit"},
    {n:"Pelham S2K SBIC II, L.P.",l:"New York, NY",t:"Private Credit"},
    {n:"Pelham S2K SBIC, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"Pelion Ventures VII Financial Institutions Fund, L.P.",l:"Salt Lake City, UT",t:"Venture"},
    {n:"Pelion Ventures VIII Financial Institutions Fund L.P.",l:"Salt Lake City, UT",t:"Venture"},
    {n:"Petra Growth Fund II, L.P.",l:"Nashville, TN",t:"Hybrid"},
    {n:"Petra Growth Fund III, L.P.",l:"Nashville, TN",t:"Hybrid"},
    {n:"Petra Growth Fund IV, L.P.",l:"Nashville, TN",t:"Hybrid"},
    {n:"Petra Growth Fund V, L.P.",l:"Nashville, TN",t:"Hybrid"},
    {n:"Pine Street Capital Partners III, LP",l:"Albany, NY",t:"Hybrid"},
    {n:"Pine Street Capital Partners IV, LP",l:"Albany, NY",t:"Private Credit"},
    {n:"Pivotal Capital Fund II, LP",l:"Menlo Park, CA",t:"Hybrid"},
    {n:"Plexus Fund IV-A, L.P.",l:"Raleigh, NC",t:"Hybrid"},
    {n:"Plexus Fund V-A, LP",l:"Raleigh, NC",t:"Hybrid"},
    {n:"Plexus Fund VII-A, L.P.",l:"Raleigh, NC",t:"Private Credit"},
    {n:"Propel Venture Partners US Fund I, L.P.",l:"San Francisco, CA",t:"Venture"},
    {n:"Providence Investment Partners I LP",l:"Dallas, TX",t:"Private Credit"},
    {n:"QS Capital Strategies II, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"RCS SBIC Fund II, L.P.",l:"Boston, MA",t:"Private Credit"},
    {n:"Renovus Capital Partners II, L.P.",l:"Wayne, PA",t:"Hybrid"},
    {n:"Renovus Capital Partners III, L.P.",l:"Wayne, PA",t:"Hybrid"},
    {n:"Renovus Capital Partners IV SBIC, L.P.",l:"Wayne, PA",t:"PE"},
    {n:"Resolute Capital Partners Fund IV, L.P.",l:"Nashville, TN",t:"Hybrid"},
    {n:"Resolute Capital Partners Fund V-A, L.P.",l:"Nashville, TN",t:"Hybrid"},
    {n:"Reynolda Equity Partners V, L.P.",l:"Winston-Salem, NC",t:"PE"},
    {n:"RF Investment Partners SBIC II, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"RF Investment Partners SBIC, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"RFE Investment Partners IX, L.P.",l:"Westport, CT",t:"Hybrid"},
    {n:"Ridgeline Ventures Fund II-S L.P.",l:"Memphis, TN",t:"Venture"},
    {n:"Riverside Micro-Cap Fund III, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"Rochefort Ventures LP",l:"West Palm Beach, FL",t:"Private Credit"},
    {n:"Route 2 Capital Partners SBIC II, L.P.",l:"Greenville, SC",t:"Hybrid"},
    {n:"Route 2 Capital Partners SBIC, L.P.",l:"Charleston, SC",t:"Hybrid"},
    {n:"Salem Investment Partners IV, LP",l:"Greensboro, NC",t:"Hybrid"},
    {n:"Salem Investment Partners V, LP",l:"Greensboro, NC",t:"Hybrid"},
    {n:"Salem Investment Partners VI, LP",l:"Greensboro, NC",t:"Private Credit"},
    {n:"Saratoga Investment Corp. SBIC II LP",l:"New York, NY",t:"Private Credit"},
    {n:"Saratoga Investment Corp. SBIC III LP",l:"New York, NY",t:"Private Credit"},
    {n:"SBJ Elevation Fund, L.P.",l:"Walnut Creek, CA",t:"Hybrid"},
    {n:"SBJ Fund, LP",l:"Walnut Creek, CA",t:"Hybrid"},
    {n:"Seacoast Capital Partners V, L.P.",l:"Danvers, MA",t:"Private Credit"},
    {n:"SharpVue Capital Credit Fund II, L.P.",l:"Raleigh, NC",t:"Hybrid"},
    {n:"SharpVue Capital Credit Fund III, L.P.",l:"Raleigh, NC",t:"Private Credit"},
    {n:"Signal Peak Ventures IV-A, L.P.",l:"Salt Lake City, UT",t:"Venture"},
    {n:"Siguler Guff SBIC Fund II, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"Siguler Guff SBIC Fund, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"Silver Lake Waterman Fund III-S, L.P.",l:"Menlo Park, CA",t:"Private Credit"},
    {n:"SJF Ventures III, LP",l:"Durham, NC",t:"Hybrid"},
    {n:"Skyline Investors I, LP",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"Small Business Community Capital II, L.P.",l:"Norwalk, CT",t:"Hybrid"},
    {n:"Snowpoint Ventures II - S&T, LP",l:"Palm Beach, FL",t:"Venture"},
    {n:"Sound Growth Partners Fund I, LP",l:"Edmonds, WA",t:"PE"},
    {n:"Source Capital Credit Opportunities IV, L.P.",l:"Atlanta, GA",t:"Private Credit"},
    {n:"Source Capital Credit Opportunities V, LP",l:"Atlanta, GA",t:"Private Credit"},
    {n:"Southfield Mezzanine Capital II, L.P.",l:"Greenwich, CT",t:"PE"},
    {n:"Southfield Mezzanine Capital III LP",l:"Greenwich, CT",t:"PE"},
    {n:"Southfield Mezzanine Capital LP",l:"Greenwich, CT",t:"PE"},
    {n:"Spell Capital Mezzanine Partners SBIC II, L.P.",l:"Minneapolis, MN",t:"Hybrid"},
    {n:"Spring Capital Partners III, L.P.",l:"Lutherville, MD",t:"Hybrid"},
    {n:"Spring Capital Partners IV, L.P.",l:"Lutherville, MD",t:"Hybrid"},
    {n:"Spring Capital Partners V, L.P.",l:"Lutherville, MD",t:"Private Credit"},
    {n:"St. Cloud Capital Partners III SBIC, LP",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"St. Cloud Capital Partners IV SBIC, LP",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"Star Mountain SBIC Fund II, L.P.",l:"New York, NY",t:"Private Credit"},
    {n:"Star Mountain SBIC Fund, L.P.",l:"New York, NY",t:"Hybrid"},
    {n:"Stellus Capital SBIC II LP",l:"Houston, TX",t:"Hybrid"},
    {n:"Stellus Capital SBIC LP",l:"Houston, TX",t:"Hybrid"},
    {n:"Stonehenge Community Impact Fund, L.P.",l:"Columbus, OH",t:"Hybrid"},
    {n:"Stonehenge Growth Equity Fund, L.P.",l:"Tampa, FL",t:"Growth Equity"},
    {n:"Stonehenge Opportunity Fund IV, L.P.",l:"Columbus, OH",t:"Hybrid"},
    {n:"Stonehenge Opportunity Fund V, L.P.",l:"Columbus, OH",t:"Hybrid"},
    {n:"Svoboda Capital Fund IV (SBIC), L.P.",l:"Chicago, IL",t:"Growth Equity"},
    {n:"Tamarix Capital Partners II, L.P.",l:"New York, NY",t:"Private Credit"},
    {n:"TCPC SBIC, LP",l:"Santa Monica, CA",t:"Hybrid"},
    {n:"Tecum Capital Partners II, L.P.",l:"Wexford, PA",t:"Hybrid"},
    {n:"Tecum Capital Partners III, L.P.",l:"Wexford, PA",t:"Hybrid"},
    {n:"Tecum Capital Partners IV, L.P.",l:"Wexford, PA",t:"Hybrid"},
    {n:"TGEF III, L.P.",l:"Tampa, FL",t:"Growth Equity"},
    {n:"TR-SOF II LP",l:"New York, NY",t:"PE"},
    {n:"Tree Line SBIC, LP",l:"San Francisco, CA",t:"Private Credit"},
    {n:"True West Capital Partners Fund II, L.P.",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"True West Capital Partners Fund III, L.P.",l:"Los Angeles, CA",t:"Hybrid"},
    {n:"TTGA SBIC Pioneer Fund I, L.P.",l:"Cincinnati, OH",t:"Hybrid"},
    {n:"TZP SBIC Partners I, L.P.",l:"New York, NY",t:"Private Credit"},
    {n:"UMB Capital Corporation",l:"Kansas City, MO",t:"Hybrid"},
    {n:"Valesco Fund II, L.P.",l:"Dallas, TX",t:"Hybrid"},
    {n:"Valesco Fund III, L.P.",l:"Dallas, TX",t:"Hybrid"},
    {n:"Verde Capital Partners, LP",l:"Houston, TX",t:"PE"},
    {n:"Vocap Partners IV SBIC, L.P.",l:"Vero Beach, FL",t:"Venture"},
    {n:"Walden Venture Capital VIII SBIC, L.P.",l:"San Francisco, CA",t:"Venture"},
    {n:"Wasatch Venture Capital VIII SBIC, L.P.",l:"Salt Lake City, UT",t:"Venture"},
    {n:"Wells Fargo Strategic Capital SBIC, L.P.",l:"Charlotte, NC",t:"Hybrid"},
    {n:"Willow Tree Credit Partners SBIC, LP",l:"New York, NY",t:"Hybrid"},
    {n:"Zions SBIC, L.L.C.",l:"Salt Lake City, UT",t:"Hybrid"},
  ];
  for (const d of data) {
    add({
      name: d.n, location: d.l, opportunity_type: 'vc',
      description: 'SBA SBIC licensee (' + d.t + ')',
      source: 'sba_sbic', confidence_score: 85,
      chicago_focused: d.l.includes('Chicago') || d.l.includes('Evanston'),
    });
  }
  console.log('  [SBIC] Loaded ' + data.length + ' records');
}

// ============================================================
// SOURCE 2: Awesome OSS Investors (72 firms)
// ============================================================
function loadOSSInvestors() {
  console.log('[OSS] Loading awesome-oss-investors...');
  const data = [
    {n:"Abstraction Capital",w:"https://abstraction.vc/",l:"US"},
    {n:"Angel Invest",w:"https://www.angelinvest.ventures/",l:"Germany"},
    {n:"Boldstart",w:"https://boldstart.vc/",l:"US"},
    {n:"Crane",w:"https://crane.vc/",l:"UK"},
    {n:"eCAPITAL",w:"https://ecapital.vc/",l:"Germany"},
    {n:"Elaia",w:"https://www.elaia.com",l:"France"},
    {n:"Essence VC",w:"https://www.essencevc.fund/",l:"US"},
    {n:"Serena Capital",w:"https://www.serena.vc/",l:"EU"},
    {n:"Firstminute Capital",w:"https://www.firstminute.capital/",l:"UK"},
    {n:"Fly Ventures",w:"https://fly.vc/",l:"Germany"},
    {n:"Grayscale Ventures",w:"https://grayscale.vc/",l:"India"},
    {n:"Grand Ventures",w:"https://grandvcp.com/",l:"US"},
    {n:"Haystack",w:"https://Haystack.vc/",l:"US"},
    {n:"Heavybit",w:"https://www.heavybit.com/",l:"US"},
    {n:"HorizonVC",w:"https://horizon.vc/",l:"US"},
    {n:"Isai Venture",w:"https://isai.vc/",l:"France"},
    {n:"Kima Ventures",w:"https://www.kimaventures.com/",l:"France"},
    {n:"Lombardstreet Ventures",w:"https://lombardstreet.vc/",l:"US"},
    {n:"Lunar Ventures",w:"https://lunar.vc/",l:"Germany"},
    {n:"Mango Capital",w:"https://www.mangocapitalinc.com/",l:"US"},
    {n:"OpenCapital.vc",w:"https://opencapital.vc/",l:"France"},
    {n:"OSS Capital",w:"https://oss.capital/",l:"US"},
    {n:"Open Core Ventures",w:"https://opencoreventures.com/",l:"US"},
    {n:"Peak",w:"https://peak.capital/",l:"Europe"},
    {n:"Seedcamp",w:"https://seedcamp.com/",l:"UK"},
    {n:"Speedinvest",w:"https://speedinvest.com/",l:"Europe"},
    {n:"Ratio",w:"https://ratio.ventures/",l:"US"},
    {n:"XAnge",w:"https://xange.fr/",l:"France"},
    {n:"Y Combinator",w:"https://www.ycombinator.com/",l:"US"},
    {n:"500 Startups",w:"https://500.co/",l:"Global"},
    {n:"Basis Set",w:"https://www.basisset.com/",l:"US"},
    {n:"btov",w:"https://www.btov.vc/",l:"Switzerland"},
    {n:"Gradient Ventures",w:"https://www.gradient.com/",l:"US"},
    {n:"Unusual Ventures",w:"https://www.unusual.vc/",l:"US"},
    {n:"Amplify Partners",w:"https://amplifypartners.com/",l:"US"},
    {n:"Costanoa",w:"https://www.costanoavc.com/",l:"US"},
    {n:"Decibel",w:"https://decibel.vc/",l:"US"},
    {n:"Felicis Ventures",w:"https://www.felicis.com/",l:"US"},
    {n:"FirstMark",w:"https://firstmark.com/",l:"US"},
    {n:"Innovation Endeavors",w:"https://www.innovationendeavors.com/",l:"US"},
    {n:"MMC Ventures",w:"https://mmc.vc/",l:"UK"},
    {n:"Nauta Capital",w:"https://nautacapital.com/",l:"UK"},
    {n:"Nexus Venture Partners",w:"https://nexusvp.com/",l:"India"},
    {n:"OpenOcean",w:"https://openocean.vc/",l:"UK"},
    {n:"SignalFire",w:"https://signalfire.com/",l:"US"},
    {n:"True Ventures",w:"https://trueventures.com/",l:"US"},
    {n:"Vertex Ventures US",w:"https://vvus.com/",l:"US"},
    {n:"468 Capital",w:"https://www.468cap.com/",l:"Germany"},
    {n:"Runa Capital",w:"https://runacap.com/",l:"Luxembourg"},
    {n:"Bain Capital Ventures",w:"https://baincapitalventures.com/",l:"US"},
    {n:"Balderton Capital",w:"https://www.balderton.com/",l:"Europe"},
    {n:"Coatue",w:"http://www.coatue.com/",l:"US"},
    {n:"CRV",w:"https://www.crv.com/",l:"US"},
    {n:"Insight Partners",w:"https://www.insightpartners.com/",l:"US"},
    {n:"Sapphire Ventures",w:"https://sapphireventures.com/",l:"US"},
    {n:"Altimeter",w:"https://www.altimeter.com/",l:"US"},
  ];
  for (const d of data) {
    add({
      name: d.n, website: d.w, location: d.l,
      description: 'OSS-friendly VC',
      opportunity_type: 'vc', source: 'github_awesome_oss',
      confidence_score: 80,
    });
  }
  console.log('  [OSS] Loaded ' + data.length + ' records');
}

// ============================================================
// SOURCE 3: Curated Major VC / PE / Angel / Accelerator list
// ============================================================
function loadCuratedMajorInvestors() {
  console.log('[Curated] Loading major investor database...');
  const vcs = [
    "Sequoia Capital","Andreessen Horowitz","Accel","Benchmark","Index Ventures",
    "Bessemer Venture Partners","Founders Fund","Lightspeed Venture Partners",
    "Tiger Global Management","New Enterprise Associates","GGV Capital",
    "Battery Ventures","General Catalyst","Khosla Ventures","Union Square Ventures",
    "Spark Capital","Social Capital","Thrive Capital","Ribbit Capital",
    "IVP","General Atlantic","Warburg Pincus","KKR","Blackstone Growth",
    "TPG Capital","Silver Lake","Vista Equity Partners","Thoma Bravo",
    "Francisco Partners","Hellman & Friedman","Advent International",
    "Apax Partners","Bain Capital","Carlyle Group","Apollo Global Management",
    "Permira","EQT Partners","CVC Capital Partners","Cinven","BC Partners",
    "Leonard Green & Partners","Clayton Dubilier & Rice","Welsh Carson Anderson & Stowe",
    "Providence Equity Partners","Summit Partners","TA Associates",
    "Meritech Capital","Iconiq Capital","Addition","Greenoaks Capital",
    "D1 Capital Partners","Dragoneer","Lone Pine Capital","Viking Global",
    "Whale Rock Capital","Durable Capital","Altimeter Capital Management",
    "Steadview Capital","DST Global","SoftBank Vision Fund","Hillhouse Capital",
    "Temasek","GIC","Mubadala","Intel Capital",
    "Google Ventures","Salesforce Ventures","Microsoft M12","Amazon Alexa Fund",
    "Samsung NEXT","Qualcomm Ventures","Cisco Investments","Dell Technologies Capital",
    "Goldman Sachs Growth Equity","JPMorgan Growth Equity",
    "Citi Ventures","American Express Ventures","Visa Ventures",
    "Matrix Partners","Menlo Ventures","Mayfield Fund","Norwest Venture Partners",
    "Scale Venture Partners","Sutter Hill Ventures","US Venture Partners",
    "Canaan Partners","Domain Associates","Versant Ventures","Flagship Pioneering",
    "ARCH Venture Partners","Third Rock Ventures","Polaris Partners","Atlas Venture",
    "Accomplice","Flybridge Capital","Underscore VC","Pillar VC",
    "Lux Capital","Playground Global","Root Ventures",
    "Eclipse Ventures","Fontinalis Partners","Revolution Growth",
    "Revolution Rise of the Rest","Kapor Capital","Backstage Capital","Harlem Capital",
    "Precursor Ventures","MaC Venture Capital","Plexo Capital",
    "Base10 Partners","Chingona Ventures","Golden Seeds","Pipeline Angels",
    "Female Founders Fund","BBG Ventures","Cowboy Ventures","Forerunner Ventures",
    "Initialized Capital","Afore Capital","Hustle Fund",
    "Unpopular Ventures","Founder Collective","Homebrew",
    "Slow Ventures","Collaborative Fund","Betaworks",
    "Lerer Hippeau","Primary Venture Partners","RRE Ventures",
    "BoxGroup","Greycroft","FirstMark Capital",
    "Bowery Capital","Work-Bench","Company Ventures",
    "Equal Ventures","Contour Venture Partners","Notation Capital",
    "Bloomberg Beta","Two Sigma Ventures","Cota Capital",
    "8VC","Correlation Ventures","Foundry Group","Techstars Ventures",
    "Rally Ventures","Crosslink Capital","Storm Ventures","Shasta Ventures",
    "Trinity Ventures","Altos Ventures","Draper Associates",
    "Emergence Capital","Lead Edge Capital","Madrona Ventures","Voyager Capital",
    // Chicago / Midwest
    "Chicago Ventures","Pritzker Group Venture Capital","Hyde Park Venture Partners",
    "MATH Venture Partners","Hyde Park Angels","OCA Ventures",
    "Chicago Atlantic Group","Valor Equity Partners","Lightbank",
    "Portage Ventures","Cleveland Avenue","Impact Engine",
    "IrishAngels","M25","7wire Ventures","Origin Ventures",
    "Sandalphon Capital","Chicago Pacific Founders","Tensility Venture Partners",
    "Jump Capital","Cultivation Capital","Mercury Fund",
    "Drive Capital","NCT Ventures","Rev1 Ventures",
    "Dynamo","Allos Ventures","Elevate Ventures",
    "High Alpha","Meridian Street Capital",
    "Lewis & Clark Ventures","Advantage Capital",
    "Dundee Venture Capital","Great North Labs","Sofia Fund",
    "Arthur Ventures","Matchstick Ventures","Grotech Ventures",
    "Baird Capital","Mason Wells","Huron Capital",
    "Plymouth Growth Partners","Frazier Healthcare Partners",
    "Midwest Growth Partners","Rock Island Capital",
    // Growth Equity
    "Riverwood Capital","JMI Equity","Spectrum Equity","Great Hill Partners",
    "Susquehanna Growth Equity","FTV Capital","LLR Partners",
    "Catalyst Investors","Volition Capital","Level Equity",
    "Frontier Growth","Camden Partners","Noro-Moseley Partners",
    "Stripes","Left Lane Capital","Goodwater Capital",
    "Global Founders Capital","Cherry Ventures","Point Nine Capital",
    "Earlybird Venture Capital","Project A Ventures","HV Capital",
    "Lakestar","Atomico","Northzone","Creandum","EQT Ventures",
    "Dawn Capital","Felix Capital","LocalGlobe","Passion Capital",
    "Hoxton Ventures","Notion Capital","Eight Roads Ventures","Partech",
    "Alven","Breega","Sofinnova Partners","Cathay Innovation","Eurazeo",
  ];
  const chiKeywords = ['Chicago','Hyde Park','Pritzker','Lightbank','OCA',
    'MATH Venture','Cleveland Avenue','Impact Engine','IrishAngels','M25',
    '7wire','Origin Ventures','Portage','Jump Capital','Chicago Atlantic',
    'Valor Equity','Sandalphon','Tensility'];
  for (const name of vcs) {
    add({
      name, opportunity_type: 'vc', source: 'curated_major_vc',
      confidence_score: 75, description: 'Major VC/PE firm',
      chicago_focused: chiKeywords.some(function(k) { return name.includes(k); }),
    });
  }
  console.log('  [Curated VCs] Loaded ' + vcs.length + ' records');

  const angels = [
    "Naval Ravikant","Mark Cuban","Fabrice Grinda","Elad Gil",
    "Jason Calacanis","Alexis Ohanian","Gary Vaynerchuk","Chris Sacca",
    "Peter Thiel","Reid Hoffman","Marc Benioff","Ashton Kutcher",
    "Ron Conway","Esther Dyson","Tim Draper","Dave McClure",
    "Keith Rabois","Vinod Khosla","Max Levchin","David Sacks",
    "Chamath Palihapitiya","Marc Andreessen","Ben Horowitz",
    "Fred Wilson","Brad Feld","Josh Kopelman","Howard Morgan",
    "Troy Carter","Patrick Collison","John Collison",
    "Stewart Butterfield","Daniel Ek","Sam Altman",
    "Paul Graham","Jessica Livingston","Michael Seibel",
    "Garry Tan","Aaron Levie","Dharmesh Shah",
    "Scott Belsky","Hunter Walk","Cyan Banister","Semil Shah",
    "Pejman Nozad","Theresia Gouw","Ann Miura-Ko","Aileen Lee",
    "Kirsten Green","Mary Meeker","Li Ka-shing","Yuri Milner",
    "Sahil Lavingia","Balaji Srinivasan",
  ];
  for (const name of angels) {
    add({
      name, opportunity_type: 'angel', source: 'curated_angels',
      confidence_score: 70, description: 'Notable angel investor',
    });
  }
  console.log('  [Curated Angels] Loaded ' + angels.length + ' records');

  const accelerators = [
    "Techstars","MassChallenge","Plug and Play Tech Center","SOSV","Antler",
    "Entrepreneur First","Creative Destruction Lab","Startupbootcamp",
    "Seedstars","Founders Factory","Bethnal Green Ventures",
    "Wayra","Microsoft for Startups","Google for Startups","AWS Startups",
    "Comcast NBCUniversal LIFT Labs","Disney Accelerator",
    "Bayer G4A","Johnson & Johnson JLABS","Cedars-Sinai Accelerator",
    "Dreamit Ventures","Alchemist Accelerator","Boost VC",
    "IndieBio","HAX","Elemental Excelerator","Greentown Labs",
    "Clean Energy Trust","The Engine","Chain Reaction Innovations",
    "mHUB","MATTER","P33 Chicago","1871","Polsky Center",
    "Chicago Booth New Venture Challenge","Northwestern Garage",
    "TechNexus Venture Collaborative","WiSTEM",
    "gener8tor","BioGenerator","Arch Grants","Capital Innovators",
    "Techstars Chicago","Techstars Detroit","Techstars Indianapolis",
    "The Brandery","CincyTech","JumpStart","FlashStarts",
    "Michigan Rise","TechTown Detroit","Ann Arbor SPARK",
    "Invest Detroit","Renaissance Venture Capital","Ohio Innovation Fund",
    "Third Frontier","Wisconsin Alumni Research Foundation",
    "Great North Labs","BetaBlox","Pipeline Entrepreneurs","gBETA",
  ];
  for (const name of accelerators) {
    add({
      name, opportunity_type: 'vc', source: 'curated_accelerators',
      confidence_score: 75, description: 'Startup accelerator/incubator',
      chicago_focused: ['Chicago','1871','mHUB','MATTER','P33','Polsky',
        'Northwestern','TechNexus','WiSTEM'].some(function(k) { return name.includes(k); }),
    });
  }
  console.log('  [Curated Accelerators] Loaded ' + accelerators.length + ' records');
}

// ============================================================
// SOURCE 4: Wikipedia VC firms
// ============================================================
function loadWikipediaVCs() {
  console.log('[Wikipedia] Loading known Wikipedia VC list...');
  const firms = [
    {n:"Austin Ventures",l:"Austin, TX"},
    {n:"Azure Capital Partners",l:"San Francisco, CA"},
    {n:"Benchmark Capital",l:"San Francisco, CA"},
    {n:"Brentwood Associates",l:"Los Angeles, CA"},
    {n:"Charles River Ventures",l:"Cambridge, MA"},
    {n:"Clearstone Venture Partners",l:"Santa Monica, CA"},
    {n:"Comcast Ventures",l:"Philadelphia, PA"},
    {n:"DAG Ventures",l:"Menlo Park, CA"},
    {n:"Draper Fisher Jurvetson",l:"Menlo Park, CA"},
    {n:"El Dorado Ventures",l:"Menlo Park, CA"},
    {n:"Fidelity Ventures",l:"Boston, MA"},
    {n:"Foundation Capital",l:"Menlo Park, CA"},
    {n:"Garage Technology Ventures",l:"Palo Alto, CA"},
    {n:"Globespan Capital Partners",l:"Waltham, MA"},
    {n:"Granite Ventures",l:"San Francisco, CA"},
    {n:"Highland Capital Partners",l:"Lexington, MA"},
    {n:"InterWest Partners",l:"Menlo Park, CA"},
    {n:"Labrador Ventures",l:"Redwood City, CA"},
    {n:"Mohr Davidow Ventures",l:"Menlo Park, CA"},
    {n:"Morgenthaler Ventures",l:"Cleveland, OH"},
    {n:"Oak Investment Partners",l:"Westport, CT"},
    {n:"Onset Ventures",l:"Menlo Park, CA"},
    {n:"Opus Capital",l:"Menlo Park, CA"},
    {n:"OrbiMed Advisors",l:"New York, NY"},
    {n:"Oxford Bioscience Partners",l:"Boston, MA"},
    {n:"Paladin Capital Group",l:"Washington, DC"},
    {n:"Rustic Canyon Partners",l:"Santa Monica, CA"},
    {n:"Saratoga Ventures",l:"Silicon Valley, CA"},
    {n:"Sierra Ventures",l:"San Mateo, CA"},
    {n:"Sigma Partners",l:"Menlo Park, CA"},
    {n:"Sofinnova Ventures",l:"Menlo Park, CA"},
    {n:"Split Rock Partners",l:"Minneapolis, MN"},
    {n:"Sprout Group",l:"Menlo Park, CA"},
    {n:"Tallwood Venture Capital",l:"Palo Alto, CA"},
    {n:"Tenaya Capital",l:"San Francisco, CA"},
    {n:"Valhalla Partners",l:"Vienna, VA"},
    {n:"Walden International",l:"San Francisco, CA"},
    {n:"WestRiver Capital",l:"Boise, ID"},
    {n:"Worldview Technology Partners",l:"San Mateo, CA"},
    {n:"3i Group",l:"London, UK"},
    {n:"DN Capital",l:"London, UK"},
    {n:"IDG Capital",l:"Beijing, China"},
    {n:"Legend Capital",l:"Beijing, China"},
    {n:"Morningside Venture Capital",l:"Hong Kong"},
    {n:"New World Ventures",l:"Chicago, IL"},
    {n:"Northern Light Venture Capital",l:"Beijing, China"},
    {n:"Octopus Ventures",l:"London, UK"},
    {n:"SBI Investment",l:"Tokyo, Japan"},
    {n:"Sequoia Capital China",l:"Beijing, China"},
    {n:"Temasek Holdings",l:"Singapore"},
    {n:"Vertex Venture Holdings",l:"Singapore"},
  ];
  for (const d of firms) {
    add({
      name: d.n, location: d.l, opportunity_type: 'vc',
      source: 'wikipedia_vc', confidence_score: 80,
      description: 'Venture capital firm (Wikipedia)',
    });
  }
  console.log('  [Wikipedia] Loaded ' + firms.length + ' records');
}

// ============================================================
// SOURCE 5: Global VC Expansion
// ============================================================
function loadGlobalVCExpansion() {
  console.log('[Global] Loading expanded global VC database...');
  const firms = [
    "Aberdare Ventures","Access Industries","Aisling Capital","Allied Minds",
    "Amadeus Capital Partners","American Securities","Ampersand Capital Partners",
    "Anthos Capital","Aquiline Technology Growth","Arbor Ventures",
    "Ares Management","Arsenal Growth Equity","Ascend Venture Capital",
    "Atairos","August Capital","Avalon Ventures","Avenue Capital Group",
    "BAM Ventures","Baseline Ventures","Bay City Capital","BDC Capital",
    "Benhamou Global Ventures","Berkshire Partners","Better Tomorrow Ventures",
    "Birchmere Ventures","Blume Ventures","Blue Cloud Ventures","Blue Owl Capital",
    "Blue Run Ventures","Blue Yard Capital","Braemar Energy Ventures",
    "Brand Foundry Ventures","Breakthrough Energy Ventures","Brook Venture Partners",
    "Bullpen Capital","BV Investment Partners","Capital Factory",
    "Castanea Partners","Catalyst Health Ventures","Centana Growth Partners",
    "Century Park Capital Partners","City Light Capital",
    "Cloud Apps Capital Partners","Commerce Ventures",
    "Conductive Ventures","Core Innovation Capital",
    "Counterpart Ventures","Curation Capital","DG Ventures",
    "Draper Goren Holm","e.ventures","Edison Partners",
    "Emerson Collective","Endeavor Catalyst","Energy Foundry",
    "Envision Ventures","Equilibrium Capital",
    "Evolution Equity Partners","Expa","F-Prime Capital",
    "Falcon Edge Capital","Fenway Partners","Fika Ventures",
    "First Analysis","First Light Capital","First Round Capital",
    "Flex Capital","Floodgate","Forgepoint Capital",
    "Forum Ventures","Freestyle Capital","Fuel Capital",
    "FundersClub","Gaingels","Generation Investment Management",
    "Global Brain","Grand Central Tech","Great Oaks Venture Capital",
    "Green Visor Capital","GSR Ventures","Halcyon Incubator",
    "Harbert Growth Partners","Headline","Health Enterprise Partners",
    "HealthQuest Capital","Heartland Ventures","Hercules Capital",
    "High Line Venture Partners","Highline Beta","Horizons Ventures",
    "ICV Partners","Illuminate Ventures","Impact X Capital",
    "Inclusive Capital Partners","Industry Ventures","Innospark Ventures",
    "Interconnect Ventures","Invest Nebraska","Javelin Venture Partners",
    "K5 Global","Kaiser Permanente Ventures","Kairos Ventures",
    "KB Partners","Kennet Partners","Kindred Ventures",
    "Kinnevik","L Catterton","LaunchCapital",
    "LaunchPad Venture Group","M13","Main Sequence Ventures",
    "Makers Fund","March Capital Partners","Maveron",
    "Melitas Ventures","MiLA Capital","Mindset Ventures",
    "Montage Ventures","Mucker Capital","N49P",
    "New Atlantic Ventures","New Leaf Venture Partners","New Stack Ventures",
    "Next47","NextView Ventures","NFX",
    "North Bridge Venture Partners","Northpond Ventures",
    "Obvious Ventures","OReilly AlphaTech Ventures","OurCrowd",
    "Panoramic Ventures","Paradigm","PeakSpan Capital",
    "Peterson Partners","Pitango Venture Capital","Plaza Ventures",
    "Point72 Ventures","QED Investors","Quake Capital",
    "Radical Ventures","Reach Capital","Ridge Ventures",
    "Right Side Capital Management","Rising Tide Fund",
    "RiverVest Venture Partners","Rocketship.vc","Romulus Capital",
    "RPM Ventures","SaaStr Fund","Sands Capital Ventures",
    "Seraphim Capital","ServiceNow Ventures","Seven Peaks Ventures",
    "Shadow Ventures","Signia Venture Partners","Silverton Partners",
    "SoGal Ventures","Sorenson Ventures","Springdale Ventures",
    "Stagecoach Ventures","Starlight Ventures",
    "Stout Street Capital","Sun Mountain Capital",
    "SV Angel","Target Global","TDK Ventures",
    "Tech Coast Angels","Tech Square Ventures",
    "Telegraph Hill Partners","Telstra Ventures","Ten Eleven Ventures",
    "The Artemis Fund","The Venture City","Third Prime Capital",
    "Threshold Ventures","Tidal Ventures","Torch Capital",
    "Touchdown Ventures","Tribeca Venture Partners","Trident Capital",
    "Trust Ventures","Tusk Venture Partners","Ultralight Ventures",
    "Uncork Capital","Upfront Ventures","Urban Innovation Fund",
    "VenBio Partners","VentureSouth","VersionOne Ventures",
    "Village Capital","Vivo Capital","Volta Ventures",
    "Vulcan Capital","Wave Financial","WestCap",
    "Western Technology Investment","Wing Venture Capital",
    "Wireframe Ventures","WndrCo","Wonder Ventures",
    "XFactor Ventures","XYZ Venture Capital","Zetta Venture Partners",
  ];
  for (const name of firms) {
    add({
      name, opportunity_type: 'vc', source: 'curated_global_vc',
      confidence_score: 65, description: 'VC/PE/Growth equity firm',
    });
  }
  console.log('  [Global VC] Loaded ' + firms.length + ' records');
}

// ============================================================
// SOURCE 6: Corporate VCs
// ============================================================
function loadCorporateVCs() {
  console.log('[CVC] Loading corporate venture capital...');
  const cvcs = [
    "Verizon Ventures","T-Mobile Ventures","AT&T Foundry",
    "Capital One Ventures","PNC Ventures",
    "Northwestern Mutual Future Ventures","Allstate Strategic Ventures",
    "State Farm Ventures","Liberty Mutual Strategic Ventures",
    "Munich Re Ventures","AXA Venture Partners","Allianz X",
    "Optum Ventures","Merck Global Health Innovation","Novartis Venture Fund",
    "Pfizer Ventures","AbbVie Ventures","Roche Venture Fund","Sanofi Ventures",
    "Boehringer Ingelheim Venture Fund","AstraZeneca Ventures",
    "Eli Lilly Corporate Venture","Medtronic LABS",
    "GE Ventures","Siemens Technology Accelerator","Bosch Venture Capital",
    "BMW i Ventures","Porsche Ventures","Toyota AI Ventures",
    "Honda Innovations","Hyundai CRADLE","GM Ventures",
    "Caterpillar Ventures","John Deere Venture Capital",
    "Volvo Group Venture Capital","Airbus Ventures","Boeing HorizonX",
    "Lockheed Martin Ventures","Procter & Gamble Ventures",
    "Unilever Ventures","PepsiCo Ventures","Coca-Cola Company Ventures",
    "AB InBev ZX Ventures","Tyson Ventures","ADM Ventures","Cargill Ventures",
    "Shell Ventures","BP Ventures","Chevron Technology Ventures",
    "ExxonMobil Technology Ventures","TotalEnergies Ventures",
    "Equinor Ventures","Saudi Aramco Energy Ventures",
    "National Grid Partners","Schneider Electric Ventures",
    "ABB Technology Ventures","Honeywell Ventures","3M Ventures",
    "BASF Venture Capital","Dow Venture Capital",
    "Sony Innovation Fund","Bertelsmann Digital Media Investments",
    "Hearst Ventures","Oracle Corporate Ventures",
    "SAP Sapphire Ventures","Adobe Ventures","Autodesk Forge Fund",
    "CrowdStrike Falcon Fund","Palo Alto Networks Ventures",
    "Okta Ventures","Snowflake Ventures","Shopify Ventures",
    "Coinbase Ventures","Binance Labs","Ripple Xpring",
  ];
  for (const name of cvcs) {
    add({
      name, opportunity_type: 'vc', source: 'curated_cvc',
      confidence_score: 70, description: 'Corporate venture capital arm',
    });
  }
  console.log('  [CVC] Loaded ' + cvcs.length + ' records');
}

// ============================================================
// SOURCE 7: Family Offices
// ============================================================
function loadFamilyOffices() {
  console.log('[Family] Loading family office investors...');
  const offices = [
    "Bezos Expeditions","Schmidt Futures","Omidyar Network",
    "Chan Zuckerberg Initiative","Novo Holdings",
    "Wellcome Trust","Ford Foundation","Rockefeller Foundation",
    "Kauffman Foundation","Knight Foundation","Joyce Foundation",
    "MacArthur Foundation","Hewlett Foundation","Packard Foundation",
    "Moore Foundation","Arnold Ventures","Soros Fund Management",
    "Cascade Investment","ICONIQ Capital","Cressey & Company",
    "Pritzker Organization","Duchossois Group",
    "Draper Richards Kaplan Foundation","Skoll Foundation",
    "Lumina Foundation","Bill & Melinda Gates Foundation",
    "Koch Industries Ventures",
  ];
  for (const name of offices) {
    add({
      name, opportunity_type: 'vc', source: 'curated_family_office',
      confidence_score: 60, description: 'Family office / foundation investor',
    });
  }
  console.log('  [Family] Loaded ' + offices.length + ' records');
}

// ============================================================
// SOURCE 8: International VCs
// ============================================================
function loadInternationalVCs() {
  console.log('[Intl] Loading international VCs...');
  const firms = [
    "Finch Capital","Prime Ventures","Henkel Ventures","Rocket Internet",
    "Cavalry Ventures","Picus Capital","10x Founders","La Famiglia",
    "UVC Partners","Join Capital","Burda Principal Investments",
    "Verdane","Industrifonden","Nordic Capital","IK Investment Partners",
    "Summa Equity","Alliance Venture","Standout Capital",
    "byFounders","PreSeed Ventures","Icebreaker.vc","Inventure",
    "Maki.vc","Superhero Capital","Lifeline Ventures","Tesi",
    "Karma Ventures","Change Ventures","Tera Ventures",
    "LAUNCHub Ventures","Eleven Ventures","Catalyst Romania",
    "Credo Ventures","Presto Ventures","Market One Capital",
    "Innovation Nest","bValue","Smok Ventures",
    "Sequoia Capital India","Accel India","Matrix Partners India",
    "Lightspeed India","Elevation Capital","Peak XV Partners",
    "B Capital Group","GL Ventures","Qiming Venture Partners",
    "Shunwei Capital","ZhenFund","Sinovation Ventures",
    "China Growth Capital","Fosun RZ Capital","5Y Capital","Source Code Capital",
    "Insignia Ventures Partners","Golden Gate Ventures","Jungle Ventures",
    "East Ventures","AC Ventures","Openspace Ventures",
    "Vertex Ventures Southeast Asia","Monks Hill Ventures",
    "500 Southeast Asia","Gobi Partners","TNB Aura",
    "BECO Capital","Global Ventures Dubai","Shorooq Partners",
    "Wamda Capital","Flat6Labs","500 MENA","Algebra Ventures",
    "Sawari Ventures","Partech Africa","TLcom Capital",
    "Novastar Ventures","4DX Ventures","Future Africa",
    "Ingressive Capital","Launch Africa Ventures","LoftyInc Capital",
    "Microtraction","Kepple Africa Ventures",
    "Kaszek Ventures","Monashees","Valor Capital Group",
    "Canary","Maya Capital","NXTP Ventures","Magma Partners",
    "Ignia Partners","Angel Ventures Mexico","ALLVP",
    "Dalus Capital","Jaguar Ventures","Dila Capital",
    "Square Peg Capital","Blackbird Ventures","AirTree Ventures",
    "Skip Capital","Giant Leap Fund","Reinventure","Startmate",
    "Icehouse Ventures","Movac","Pacific Channel",
    "OMERS Ventures","Real Ventures","Inovia Capital",
    "Framework Venture Partners","Georgian","Relay Ventures",
    "Golden Ventures","Panache Ventures","StandUp Ventures",
  ];
  for (const name of firms) {
    add({
      name, opportunity_type: 'vc', source: 'curated_international_vc',
      confidence_score: 65, description: 'International venture capital firm',
    });
  }
  console.log('  [Intl] Loaded ' + firms.length + ' records');
}

// ============================================================
// SOURCE 9: Government & Non-Dilutive Programs
// ============================================================
function loadGovernmentPrograms() {
  console.log('[Gov] Loading government programs...');
  const programs = [
    {n:"SBIR (Small Business Innovation Research)",d:"Federal grant program",t:"grant",l:"US"},
    {n:"STTR (Small Business Technology Transfer)",d:"Federal grant program",t:"grant",l:"US"},
    {n:"NSF I-Corps",d:"NSF commercialization program",t:"grant",l:"US"},
    {n:"NSF SBIR/STTR",d:"National Science Foundation grants",t:"grant",l:"US"},
    {n:"NIH SBIR/STTR",d:"National Institutes of Health grants",t:"grant",l:"US"},
    {n:"DOE SBIR/STTR",d:"Department of Energy grants",t:"grant",l:"US"},
    {n:"DARPA SBIR/STTR",d:"Defense Advanced Research Projects Agency",t:"grant",l:"US"},
    {n:"NASA SBIR/STTR",d:"NASA small business grants",t:"grant",l:"US"},
    {n:"USDA SBIR",d:"Agriculture innovation grants",t:"grant",l:"US"},
    {n:"DOD SBIR/STTR",d:"Department of Defense grants",t:"grant",l:"US"},
    {n:"EPA SBIR",d:"Environmental Protection Agency grants",t:"grant",l:"US"},
    {n:"EDA Build Back Better Regional Challenge",d:"Economic Development Administration",t:"grant",l:"US"},
    {n:"CDFI Fund",d:"Community Development Financial Institutions",t:"grant",l:"US"},
    {n:"New Markets Tax Credit Program",d:"Treasury Department",t:"grant",l:"US"},
    {n:"Illinois Venture Fund",d:"State venture fund",t:"grant",l:"Chicago, IL"},
    {n:"Illinois Finance Authority",d:"State financing",t:"grant",l:"Chicago, IL"},
    {n:"City of Chicago Small Business Improvement Fund",d:"City grant",t:"grant",l:"Chicago, IL"},
    {n:"Chicago Community Loan Fund",d:"CDFI for Chicago",t:"grant",l:"Chicago, IL"},
    {n:"Chicago Innovation Awards",d:"Annual innovation recognition",t:"competition",l:"Chicago, IL"},
    {n:"Neighborhood Opportunity Fund",d:"City of Chicago",t:"grant",l:"Chicago, IL"},
    {n:"PROPEL",d:"Polsky Center accelerator",t:"grant",l:"Chicago, IL"},
    {n:"Illinois DCEO Advantage Illinois",d:"State venture program",t:"grant",l:"Illinois"},
    {n:"Ohio Third Frontier",d:"State technology fund",t:"grant",l:"Ohio"},
    {n:"Michigan Pre-Seed Capital Fund",d:"State pre-seed fund",t:"grant",l:"Michigan"},
    {n:"Michigan Economic Development Corporation",d:"State economic dev",t:"grant",l:"Michigan"},
    {n:"Indiana Economic Development Corporation",d:"State economic dev",t:"grant",l:"Indiana"},
    {n:"Wisconsin Economic Development Corporation",d:"State economic dev",t:"grant",l:"Wisconsin"},
    {n:"Launch Minnesota",d:"State startup support",t:"grant",l:"Minnesota"},
    {n:"Missouri Technology Corporation",d:"State tech fund",t:"grant",l:"Missouri"},
    {n:"MassVentures",d:"Massachusetts public VC",t:"grant",l:"Massachusetts"},
    {n:"Ben Franklin Technology Partners",d:"PA tech investment",t:"grant",l:"Pennsylvania"},
    {n:"Innovation Works",d:"Pittsburgh tech fund",t:"grant",l:"Pennsylvania"},
    {n:"NC IDEA",d:"NC startup grants",t:"grant",l:"North Carolina"},
    {n:"Georgia Research Alliance",d:"GA innovation fund",t:"grant",l:"Georgia"},
    {n:"Texas Enterprise Fund",d:"TX state incentive",t:"grant",l:"Texas"},
    {n:"Colorado Advanced Industry Accelerator",d:"CO innovation",t:"grant",l:"Colorado"},
  ];
  for (const p of programs) {
    add({
      name: p.n, description: p.d, opportunity_type: p.t || 'grant',
      location: p.l || 'US', source: 'curated_government',
      confidence_score: 85,
      chicago_focused: (p.l || '').includes('Chicago') || (p.l || '').includes('Illinois'),
    });
  }
  console.log('  [Gov] Loaded ' + programs.length + ' records');
}

// ============================================================
// SOURCE 10: Existing harvested files on disk
// ============================================================
function loadExistingHarvestFiles() {
  console.log('[Disk] Loading existing harvested data files...');
  const dataDir = join(__dirname, '..', 'data');
  let totalLoaded = 0;

  // Load SEC ADV harvest (3300+ records)
  const secPath = join(dataDir, 'sec-adv-harvest.json');
  if (existsSync(secPath)) {
    try {
      const data = JSON.parse(readFileSync(secPath, 'utf8'));
      for (const r of data) {
        add({
          name: r.name,
          organization: r.organization || r.name,
          description: r.description || 'SEC registered entity',
          opportunity_type: r.opportunity_type || 'vc',
          website: r.website || '',
          location: r.location || '',
          chicago_focused: r.chicago_focused || false,
          confidence_score: r.confidence_score || 70,
          source: 'sec_adv_harvest',
        });
      }
      console.log('  [SEC ADV] Loaded from disk: ' + data.length + ' raw records');
      totalLoaded += data.length;
    } catch (e) {
      console.log('  [SEC ADV] Error: ' + e.message);
    }
  }

  // Load government sources harvest (2890 records)
  const govPath = join(dataDir, 'harvested', 'govt_sources.json');
  if (existsSync(govPath)) {
    try {
      const data = JSON.parse(readFileSync(govPath, 'utf8'));
      for (const r of data) {
        add({
          name: r.name,
          organization: r.organization || r.name,
          description: r.description || 'Government/foundation source',
          opportunity_type: r.opportunity_type || 'grant',
          website: r.website || '',
          location: r.location || '',
          chicago_focused: r.chicago_focused || false,
          confidence_score: r.confidence_score || 65,
          source: 'govt_sources_harvest',
        });
      }
      console.log('  [Govt Sources] Loaded from disk: ' + data.length + ' raw records');
      totalLoaded += data.length;
    } catch (e) {
      console.log('  [Govt Sources] Error: ' + e.message);
    }
  }

  // Load curated VC harvest
  const curatedPath = join(dataDir, 'harvested', 'curated_vc.json');
  if (existsSync(curatedPath)) {
    try {
      const data = JSON.parse(readFileSync(curatedPath, 'utf8'));
      for (const r of data) {
        add({
          name: r.name,
          organization: r.organization || r.name,
          description: r.description || '',
          opportunity_type: r.opportunity_type || 'vc',
          website: r.website || '',
          location: r.location || '',
          chicago_focused: r.chicago_focused || false,
          confidence_score: r.confidence_score || 70,
          source: 'disk_curated_vc',
        });
      }
      console.log('  [Curated VC disk] Loaded: ' + data.length + ' records');
      totalLoaded += data.length;
    } catch (e) {
      console.log('  [Curated VC disk] Error: ' + e.message);
    }
  }

  // Load wikipedia VC harvest
  const wikiPath = join(dataDir, 'harvested', 'wikipedia_vc.json');
  if (existsSync(wikiPath)) {
    try {
      const data = JSON.parse(readFileSync(wikiPath, 'utf8'));
      for (const r of data) {
        add({
          name: r.name,
          organization: r.organization || r.name,
          description: r.description || '',
          opportunity_type: r.opportunity_type || 'vc',
          website: r.website || '',
          location: r.location || '',
          chicago_focused: r.chicago_focused || false,
          confidence_score: r.confidence_score || 70,
          source: 'disk_wikipedia_vc',
        });
      }
      console.log('  [Wikipedia disk] Loaded: ' + data.length + ' records');
      totalLoaded += data.length;
    } catch (e) {
      console.log('  [Wikipedia disk] Error: ' + e.message);
    }
  }

  // Load the main harvested-investors.json
  const mainPath = join(dataDir, 'harvested-investors.json');
  if (existsSync(mainPath)) {
    try {
      const wrapper = JSON.parse(readFileSync(mainPath, 'utf8'));
      const data = wrapper.investors || wrapper.records || (Array.isArray(wrapper) ? wrapper : []);
      for (const r of data) {
        add({
          name: r.name,
          organization: r.organization || r.name,
          description: r.description || '',
          opportunity_type: r.opportunity_type || 'vc',
          website: r.website || '',
          location: r.location || '',
          chicago_focused: r.chicago_focused || false,
          confidence_score: r.confidence_score || 70,
          source: 'disk_harvested_investors',
        });
      }
      console.log('  [Harvested investors disk] Loaded: ' + data.length + ' records');
      totalLoaded += data.length;
    } catch (e) {
      console.log('  [Harvested investors disk] Error: ' + e.message);
    }
  }

  // Load any other JSON files in data/harvested/ and data/harvests/
  for (const subdir of ['harvested', 'harvests']) {
    const dir = join(dataDir, subdir);
    if (!existsSync(dir)) continue;
    try {
      const files = readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        if (['curated_vc.json', 'wikipedia_vc.json', 'govt_sources.json'].includes(file)) continue;
        const filePath = join(dir, file);
        try {
          const data = JSON.parse(readFileSync(filePath, 'utf8'));
          const arr = Array.isArray(data) ? data : [];
          for (const r of arr) {
            if (r.name) {
              add({
                name: r.name,
                organization: r.organization || r.name,
                description: r.description || '',
                opportunity_type: r.opportunity_type || 'vc',
                website: r.website || '',
                location: r.location || '',
                chicago_focused: r.chicago_focused || false,
                confidence_score: r.confidence_score || 60,
                source: 'disk_' + file.replace('.json', ''),
              });
            }
          }
          if (arr.length > 0) {
            console.log('  [' + file + '] Loaded: ' + arr.length + ' records');
            totalLoaded += arr.length;
          }
        } catch (e) { /* skip unparseable files */ }
      }
    } catch (e) { /* skip directory errors */ }
  }

  console.log('  [Disk] Total raw records processed: ' + totalLoaded);
}

// ============================================================
// SOURCE 11: Runtime fetch - GitHub + OpenVC
// ============================================================
async function fetchGitHubSources() {
  console.log('[GitHub] Fetching additional repos...');
  let count = 0;

  // OpenVC data
  try {
    const res = await fetch('https://raw.githubusercontent.com/OpenVC-io/openvc/main/data/investors.csv', {
      headers: { 'User-Agent': 'ChiStartupHub/1.0' }
    });
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      const nameIdx = headers.findIndex(function(h) { return h.toLowerCase().includes('name'); });
      const webIdx = headers.findIndex(function(h) { return h.toLowerCase().includes('website') || h.toLowerCase().includes('url'); });
      const locIdx = headers.findIndex(function(h) { return h.toLowerCase().includes('location') || h.toLowerCase().includes('country'); });
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols[nameIdx]) {
          add({
            name: cols[nameIdx].replace(/"/g, '').trim(),
            website: (cols[webIdx] || '').replace(/"/g, '').trim(),
            location: (cols[locIdx] || '').replace(/"/g, '').trim(),
            source: 'openvc', opportunity_type: 'vc', confidence_score: 75,
          });
          count++;
        }
      }
      console.log('  [OpenVC] Parsed ' + count + ' records');
    } else {
      console.log('  [OpenVC] Not available (' + res.status + ')');
    }
  } catch (e) {
    console.log('  [OpenVC] Error: ' + e.message);
  }

  // GitHub search for more repos
  const queries = [
    'q=venture+capital+investors+list&sort=stars&per_page=10',
    'q=vc+firms+database&sort=stars&per_page=10',
  ];

  for (const q of queries) {
    try {
      const res = await fetch('https://api.github.com/search/repositories?' + q, {
        headers: {
          'User-Agent': 'ChiStartupHub/1.0',
          'Accept': 'application/vnd.github.v3+json',
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          for (const repo of data.items) {
            try {
              const branch = repo.default_branch || 'main';
              const readmeRes = await fetch(
                'https://raw.githubusercontent.com/' + repo.full_name + '/' + branch + '/README.md',
                { headers: { 'User-Agent': 'ChiStartupHub/1.0' } }
              );
              if (readmeRes.ok) {
                const readme = await readmeRes.text();
                const linkPattern = /\[([^\]]+)\]\(https?:\/\/[^\)]+\)/g;
                let match;
                while ((match = linkPattern.exec(readme)) !== null) {
                  const name = match[1].trim();
                  if (name.length > 3 && name.length < 60 &&
                      !name.includes('http') && !name.includes('img') &&
                      !name.toLowerCase().includes('license') &&
                      !name.toLowerCase().includes('readme') &&
                      !name.toLowerCase().includes('contributing') &&
                      !name.toLowerCase().includes('badge') &&
                      !name.toLowerCase().includes('build') &&
                      !name.toLowerCase().includes('status')) {
                    add({
                      name, source: 'github_repo_' + repo.full_name.split('/')[0],
                      opportunity_type: 'vc', confidence_score: 50,
                    });
                    count++;
                  }
                }
              }
            } catch (e) { /* skip individual repo errors */ }
          }
        }
      }
      await sleep(1500);
    } catch (e) {
      console.log('  [GitHub search] Error: ' + e.message);
    }
  }

  console.log('  [GitHub] Total fetched: ' + count + ' records');
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('=== Aggregated Investor Data Harvester ===\n');

  // Load all embedded sources (synchronous)
  loadSBIC();
  loadOSSInvestors();
  loadCuratedMajorInvestors();
  loadWikipediaVCs();
  loadGlobalVCExpansion();
  loadCorporateVCs();
  loadFamilyOffices();
  loadInternationalVCs();
  loadGovernmentPrograms();

  // Load existing harvested files from disk
  loadExistingHarvestFiles();

  console.log('\n--- Embedded + disk sources: ' + allRecords.length + ' unique records ---\n');

  // Fetch runtime sources (async)
  await fetchGitHubSources();

  console.log('\n=== FINAL TOTAL: ' + allRecords.length + ' unique investor records ===\n');

  // Write output
  mkdirSync(join(__dirname, '..', 'data'), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(allRecords, null, 2));
  console.log('Output written to: ' + OUTPUT_PATH);

  // Summary by source
  const bySrc = {};
  for (const r of allRecords) {
    bySrc[r.source] = (bySrc[r.source] || 0) + 1;
  }
  console.log('\nRecords by source:');
  const srcEntries = Object.entries(bySrc).sort(function(a, b) { return b[1] - a[1]; });
  for (const entry of srcEntries) {
    console.log('  ' + entry[0] + ': ' + entry[1]);
  }

  // Summary by type
  const byType = {};
  for (const r of allRecords) {
    byType[r.opportunity_type] = (byType[r.opportunity_type] || 0) + 1;
  }
  console.log('\nRecords by type:');
  const typeEntries = Object.entries(byType).sort(function(a, b) { return b[1] - a[1]; });
  for (const entry of typeEntries) {
    console.log('  ' + entry[0] + ': ' + entry[1]);
  }
}

main().catch(console.error);
