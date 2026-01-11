/**
 * Capital Access - Mass Opportunity Verification Script
 * Verifies 40+ opportunities with Playwright browser automation
 *
 * Run with: node scripts/verify-all-opportunities.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

// ALL OPPORTUNITIES TO VERIFY (Priority order: HOT first, then WARM)
const opportunities = [
  // === HOT PRIORITY (< 14 days) ===
  {
    id: 'CAP-021',
    name: 'NSpire Startup Slam',
    url: 'https://www.nola.com/sponsored/st_tammany_corporation/apply-now-nspire-startup-slam-pitch-competition-returns-in-2026/article_ceda24bf-26a8-4374-8809-5b4bc68e9865.html',
    expectedAmount: '$100,000+',
    expectedDeadline: 'January 8, 2026',
    keywords: ['startup', 'pitch', 'competition', 'slam', 'capital one'],
    priority: 'HOT'
  },
  {
    id: 'CAP-022',
    name: 'Penn Startup Challenge',
    url: 'https://venturelab.upenn.edu/startup-challenge',
    expectedAmount: '$200,000+',
    expectedDeadline: 'January 11, 2026',
    keywords: ['startup', 'challenge', 'penn', 'venture', 'prize'],
    priority: 'HOT'
  },
  {
    id: 'CAP-052',
    name: 'ERC Consolidator Grant',
    url: 'https://erc.europa.eu/apply-grant/consolidator-grant',
    expectedAmount: '€2,000,000',
    expectedDeadline: 'January 13, 2026',
    keywords: ['ERC', 'grant', 'research', 'european', 'consolidator'],
    priority: 'HOT'
  },
  {
    id: 'CAP-037',
    name: 'MassChallenge FinTech',
    url: 'https://masschallenge.org/fintech/',
    expectedAmount: 'Partnerships',
    expectedDeadline: 'January 13-14, 2026',
    keywords: ['fintech', 'masschallenge', 'accelerator', 'boston'],
    priority: 'HOT'
  },
  {
    id: 'CAP-031',
    name: 'a16z Speedrun SR006',
    url: 'https://a16z.com/speedrun/',
    expectedAmount: '$1,000,000',
    expectedDeadline: 'Rolling',
    keywords: ['speedrun', 'a16z', 'andreessen', 'startup', 'accelerator'],
    priority: 'HOT'
  },
  {
    id: 'CAP-042',
    name: 'EIC Accelerator Step 2',
    url: 'https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en',
    expectedAmount: '€2,500,000 grant',
    expectedDeadline: 'January 7, 2026',
    keywords: ['EIC', 'accelerator', 'european', 'innovation', 'grant'],
    priority: 'HOT'
  },
  {
    id: 'CAP-044',
    name: 'EmpowHer Grants (Boundless Futures)',
    url: 'https://www.boundlessfutures.org/empowher',
    expectedAmount: 'Varies',
    expectedDeadline: 'January quarterly',
    keywords: ['empowher', 'women', 'grant', 'social', 'impact'],
    priority: 'HOT'
  },

  // === WARM PRIORITY (14-30 days) ===
  {
    id: 'CAP-023',
    name: 'Rice Business Plan Competition',
    url: 'https://rbpc.rice.edu/',
    expectedAmount: '$1,500,000+',
    expectedDeadline: 'January 31, 2026',
    keywords: ['rice', 'business', 'plan', 'competition', 'student'],
    priority: 'WARM'
  },
  {
    id: 'CAP-041',
    name: 'Social Enterprise Accelerator (KY)',
    url: 'https://soar-ky.org/social-enterprise-accelerator/',
    expectedAmount: 'Free program',
    expectedDeadline: 'January 26, 2026',
    keywords: ['social', 'enterprise', 'accelerator', 'kentucky', 'community'],
    priority: 'WARM'
  },
  {
    id: 'CAP-051',
    name: 'IAF Emerging Space Leaders Grant',
    url: 'https://www.iafastro.org/activities/emerging-space-leaders/',
    expectedAmount: 'Funded trip',
    expectedDeadline: 'January 30, 2026',
    keywords: ['space', 'leaders', 'grant', 'IAF', 'emerging'],
    priority: 'WARM'
  },
  {
    id: 'CAP-049',
    name: 'Breva Thrive Grant',
    url: 'https://www.breva.co/thrive-grant',
    expectedAmount: '$5,000',
    expectedDeadline: 'January 31, 2026',
    keywords: ['breva', 'thrive', 'grant', 'business'],
    priority: 'WARM'
  },
  {
    id: 'CAP-057',
    name: 'OHCHR Minorities Fellowship',
    url: 'https://www.ohchr.org/en/about-us/fellowship-programmes',
    expectedAmount: 'Fellowship',
    expectedDeadline: 'January 31, 2026',
    keywords: ['OHCHR', 'minorities', 'fellowship', 'human rights'],
    priority: 'WARM'
  },
  {
    id: 'CAP-032',
    name: 'Y Combinator Spring 2026',
    url: 'https://www.ycombinator.com/apply',
    expectedAmount: '$500,000',
    expectedDeadline: 'February 9, 2026',
    keywords: ['YC', 'combinator', 'accelerator', 'startup', 'batch'],
    priority: 'WARM'
  },
  {
    id: 'CAP-024',
    name: 'Space Symposium Pitch Competition',
    url: 'https://www.spacesymposium.org/pitch-competition/',
    expectedAmount: 'Awards',
    expectedDeadline: 'February 15, 2026',
    keywords: ['space', 'symposium', 'pitch', 'competition', 'aerospace'],
    priority: 'WARM'
  },
  {
    id: 'CAP-029',
    name: 'BCIC Biomedical Pitch Competition',
    url: 'https://bcicglobal.org/biomedical-pitch-competition/',
    expectedAmount: '$300M+ network',
    expectedDeadline: 'February 28, 2026',
    keywords: ['biomedical', 'pitch', 'BCIC', 'biotech', 'healthcare'],
    priority: 'WARM'
  },
  {
    id: 'CAP-043',
    name: 'Future Founders Fellowship',
    url: 'https://www.futurefounders.com/fellowship/',
    expectedAmount: 'Support',
    expectedDeadline: 'February 4, 2026',
    keywords: ['future', 'founders', 'fellowship', 'entrepreneur'],
    priority: 'WARM'
  },
  {
    id: 'CAP-039',
    name: 'MedTech Innovator',
    url: 'https://medtechinnovator.org/apply/',
    expectedAmount: '$500,000',
    expectedDeadline: 'Open',
    keywords: ['medtech', 'innovator', 'accelerator', 'medical', 'device'],
    priority: 'WARM'
  },
  {
    id: 'CAP-034',
    name: 'Techstars Founder Catalyst',
    url: 'https://www.techstars.com/founder-catalyst',
    expectedAmount: 'No equity',
    expectedDeadline: 'Rolling',
    keywords: ['techstars', 'founder', 'catalyst', 'pre-accelerator'],
    priority: 'WARM'
  },
  {
    id: 'CAP-035',
    name: 'Freshmango Accelerator',
    url: 'https://freshmango.co/',
    expectedAmount: 'Equity-free',
    expectedDeadline: 'Rolling',
    keywords: ['freshmango', 'accelerator', 'equity-free', 'pre-seed'],
    priority: 'WARM'
  },
  {
    id: 'CAP-038',
    name: 'CAFE Fintech Accelerator',
    url: 'https://ftcafe.org/apply/',
    expectedAmount: 'No fee/equity',
    expectedDeadline: 'Rolling',
    keywords: ['CAFE', 'fintech', 'accelerator', 'financial'],
    priority: 'WARM'
  },

  // === COOL PRIORITY (30+ days) ===
  {
    id: 'CAP-030',
    name: 'Iowa Biotech Showcase',
    url: 'https://www.iowabio.org/iowa_biotech_pitch_competition/',
    expectedAmount: '$35,000',
    expectedDeadline: 'March 4, 2026',
    keywords: ['iowa', 'biotech', 'showcase', 'pitch', 'agriculture'],
    priority: 'COOL'
  },
  {
    id: 'CAP-050',
    name: 'Secretsos Small Business Grant',
    url: 'https://secretsos.com/grant',
    expectedAmount: 'Varies',
    expectedDeadline: 'March 31, 2026',
    keywords: ['secretsos', 'grant', 'small business', 'underserved'],
    priority: 'COOL'
  },
  {
    id: 'CAP-048',
    name: 'Google Black Founders Fund',
    url: 'https://startup.google.com/programs/black-founders-fund/',
    expectedAmount: '$150,000',
    expectedDeadline: 'Q2 2026',
    keywords: ['google', 'black', 'founders', 'fund', 'startup'],
    priority: 'COOL'
  },
  {
    id: 'CAP-027',
    name: 'Hello Tomorrow Global Challenge',
    url: 'https://hello-tomorrow.org/global-challenge/',
    expectedAmount: 'Major prizes',
    expectedDeadline: 'June 2026',
    keywords: ['hello', 'tomorrow', 'deep tech', 'challenge', 'global'],
    priority: 'COOL'
  },

  // === RETRY (Previously failed) ===
  {
    id: 'CAP-005-RETRY',
    name: 'Skip Grants (Retry)',
    url: 'https://www.helloskip.com/small-business-grants',
    expectedAmount: '$10,000',
    expectedDeadline: 'January 2026',
    keywords: ['skip', 'grant', 'business'],
    priority: 'RETRY'
  },
  {
    id: 'CAP-011-RETRY',
    name: 'Compute Challengers (Retry)',
    url: 'https://www.computechallengers.com/',
    expectedAmount: 'Varies',
    expectedDeadline: 'January 12, 2026',
    keywords: ['compute', 'challengers', 'pitch', 'data center'],
    priority: 'RETRY'
  },
  {
    id: 'CAP-019-RETRY',
    name: 'Intuit QuickBooks Grants (Corrected)',
    url: 'https://quickbooks.intuit.com/r/funding-and-grants/',
    expectedAmount: '$20,000',
    expectedDeadline: 'February 2026',
    keywords: ['intuit', 'quickbooks', 'grant', 'small business'],
    priority: 'RETRY'
  }
];

const SCREENSHOT_DIR = './data/screenshots-batch2';
const REPORT_DIR = './data/verification';

async function ensureDirectories() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  await fs.mkdir(REPORT_DIR, { recursive: true });
}

async function verifyOpportunity(browser, opp, index, total) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });

  const page = await context.newPage();
  const result = {
    id: opp.id,
    name: opp.name,
    url: opp.url,
    priority: opp.priority,
    timestamp: new Date().toISOString(),
    status: 'pending',
    linkWorks: false,
    pageTitle: null,
    screenshotPath: null,
    keywordsFound: [],
    keywordsMissing: [],
    amountFound: null,
    deadlineFound: null,
    confidenceScore: 0,
    notes: []
  };

  try {
    console.log(`\n[${index + 1}/${total}] 🔍 ${opp.name} (${opp.priority})`);
    console.log(`   URL: ${opp.url}`);

    const response = await page.goto(opp.url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    if (response && response.ok()) {
      result.linkWorks = true;
      result.httpStatus = response.status();
      console.log(`   ✅ HTTP ${response.status()}`);
    } else {
      result.httpStatus = response ? response.status() : 'no response';
      console.log(`   ⚠️ HTTP ${result.httpStatus}`);
    }

    await page.waitForTimeout(1500);

    result.pageTitle = await page.title();
    console.log(`   📄 ${result.pageTitle.substring(0, 50)}...`);

    const bodyText = await page.evaluate(() => document.body.innerText);
    const lowerContent = bodyText.toLowerCase();

    for (const keyword of opp.keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        result.keywordsFound.push(keyword);
      } else {
        result.keywordsMissing.push(keyword);
      }
    }
    console.log(`   🔑 ${result.keywordsFound.length}/${opp.keywords.length} keywords`);

    const amountMatches = bodyText.match(/\$[\d,]+(?:,\d{3})*(?:\.\d{2})?(?:\s*(?:k|K|million|Million|M))?\b|€[\d,]+/g);
    if (amountMatches) {
      result.amountFound = [...new Set(amountMatches)].slice(0, 5);
    }

    const datePatterns = [
      /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}/gi,
      /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s*\d{4}/gi
    ];

    const datesFound = [];
    for (const pattern of datePatterns) {
      const matches = bodyText.match(pattern);
      if (matches) datesFound.push(...matches);
    }
    if (datesFound.length > 0) {
      result.deadlineFound = [...new Set(datesFound)].slice(0, 5);
    }

    const screenshotFile = `${opp.id}-${Date.now()}.png`;
    result.screenshotPath = path.join(SCREENSHOT_DIR, screenshotFile);
    await page.screenshot({ path: result.screenshotPath, fullPage: false });

    let score = 0;
    if (result.linkWorks) score += 30;
    if (result.pageTitle && result.pageTitle.length > 0) score += 10;
    if (result.keywordsFound.length > 0) {
      score += Math.min(30, (result.keywordsFound.length / opp.keywords.length) * 30);
    }
    if (result.amountFound && result.amountFound.length > 0) score += 15;
    if (result.deadlineFound && result.deadlineFound.length > 0) score += 15;

    result.confidenceScore = Math.round(score);
    result.status = score >= 70 ? 'verified' : score >= 40 ? 'partial' : 'needs_review';

    console.log(`   📊 ${result.confidenceScore}/100 (${result.status})`);

  } catch (error) {
    result.status = 'error';
    result.error = error.message.split('\n')[0];
    console.log(`   ❌ ${result.error.substring(0, 60)}`);
  }

  await context.close();
  return result;
}

async function generateReport(results) {
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(REPORT_DIR, `mass-verification-${timestamp}.md`);

  const verified = results.filter(r => r.status === 'verified');
  const partial = results.filter(r => r.status === 'partial');
  const needsReview = results.filter(r => r.status === 'needs_review' || r.status === 'error');
  const avgConfidence = Math.round(results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length);

  let report = `# Mass Link Verification Report
> Generated: ${new Date().toISOString()}
> Total Verified: ${results.length} opportunities

## Summary

| Metric | Value |
|--------|-------|
| Fully Verified | ${verified.length} (${Math.round(verified.length/results.length*100)}%) |
| Partially Verified | ${partial.length} (${Math.round(partial.length/results.length*100)}%) |
| Needs Review | ${needsReview.length} (${Math.round(needsReview.length/results.length*100)}%) |
| Average Confidence | ${avgConfidence}/100 |

## Verified Opportunities (${verified.length})

| ID | Name | Score | Priority | Amounts Found |
|----|------|-------|----------|---------------|
${verified.map(r => `| ${r.id} | ${r.name} | ${r.confidenceScore} | ${r.priority} | ${r.amountFound ? r.amountFound.slice(0,2).join(', ') : 'N/A'} |`).join('\n')}

## Partial (${partial.length})

| ID | Name | Score | Issue |
|----|------|-------|-------|
${partial.map(r => `| ${r.id} | ${r.name} | ${r.confidenceScore} | Missing: ${r.keywordsMissing.slice(0,2).join(', ')} |`).join('\n')}

## Needs Review (${needsReview.length})

| ID | Name | Score | Error |
|----|------|-------|-------|
${needsReview.map(r => `| ${r.id} | ${r.name} | ${r.confidenceScore} | ${r.error || 'Low confidence'} |`).join('\n')}

---
*Screenshots saved to: ${SCREENSHOT_DIR}*
`;

  await fs.writeFile(reportPath, report);

  const jsonPath = path.join(REPORT_DIR, `mass-verification-${timestamp}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));

  console.log(`\n📋 Report: ${reportPath}`);
  console.log(`📊 JSON: ${jsonPath}`);

  return { reportPath, verified: verified.length, total: results.length };
}

async function main() {
  console.log('🚀 Capital Access - Mass Opportunity Verification');
  console.log(`📋 Verifying ${opportunities.length} opportunities\n`);
  console.log('='.repeat(50));

  await ensureDirectories();

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (let i = 0; i < opportunities.length; i++) {
    const result = await verifyOpportunity(browser, opportunities[i], i, opportunities.length);
    results.push(result);
  }

  await browser.close();

  const { verified, total } = await generateReport(results);

  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Verified: ${verified}/${total} (${Math.round(verified/total*100)}%)`);
  console.log(`🎯 Target was 30 verified hot deals`);

  if (verified >= 30) {
    console.log(`🎉 TARGET ACHIEVED!`);
  } else {
    console.log(`📈 ${30 - verified} more needed to hit target`);
  }
}

main().catch(console.error);
