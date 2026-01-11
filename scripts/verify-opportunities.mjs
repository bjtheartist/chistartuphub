/**
 * Capital Access - Opportunity Link Verification Script
 * Uses Playwright to visit each URL, screenshot, and verify information
 *
 * Run with: node scripts/verify-opportunities.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

// Opportunities to verify
const opportunities = [
  {
    id: 'CAP-2026-0109-001',
    name: 'Startup Mania 2026',
    url: 'https://about.startupgrind.com/startup-mania-2026/',
    expectedAmount: '$5,000 cash + $10,000 in-kind',
    expectedDeadline: 'January 15, 2026',
    keywords: ['startup', 'competition', 'austin', 'pitch']
  },
  {
    id: 'CAP-2026-0109-002',
    name: 'Venture For ClimateTech (V4C) Cohort 6',
    url: 'https://forclimatetech.org',
    expectedAmount: '$50,000',
    expectedDeadline: 'February 2026',
    keywords: ['climate', 'accelerator', 'non-dilutive', 'NYSERDA']
  },
  {
    id: 'CAP-2026-0109-003',
    name: 'Galaxy Grants',
    url: 'https://galaxyofstars.org/galaxy-grants/',
    expectedAmount: '$1,000',
    expectedDeadline: 'January 30, 2026',
    keywords: ['grant', 'women', 'minority', 'business']
  },
  {
    id: 'CAP-2026-0109-004',
    name: 'SE Ventures Accelerator',
    url: 'https://www.seventures.com/accelerator.jsp',
    expectedAmount: '$100,000',
    expectedDeadline: 'January 30, 2026',
    keywords: ['accelerator', 'energy', 'schneider', 'SAFE']
  },
  {
    id: 'CAP-2026-0109-005',
    name: 'Skip Grants',
    url: 'https://helloskip.com/grants',
    expectedAmount: '$10,000',
    expectedDeadline: 'January 31, 2026',
    keywords: ['grant', 'business', 'entrepreneur']
  },
  {
    id: 'CAP-2026-0109-006',
    name: 'Her Agenda Breakthrough Grant',
    url: 'https://heragenda.com/breakthrough-grant',
    expectedAmount: '$5,000',
    expectedDeadline: 'January 2026',
    keywords: ['women', 'grant', 'business', 'entrepreneur']
  },
  {
    id: 'CAP-2026-0109-007',
    name: 'Funding Lab Q1 2026',
    url: 'https://fundinglab.co',
    expectedAmount: 'Advisory services',
    expectedDeadline: 'January 2026',
    keywords: ['funding', 'seed', 'advisory', 'startup']
  },
  {
    id: 'CAP-2026-0109-008',
    name: 'Get Nearshored Grant',
    url: 'https://getnearshored.com/grant',
    expectedAmount: '$1,000',
    expectedDeadline: 'January 15, 2026',
    keywords: ['grant', 'manufacturing', 'nearshoring']
  },
  {
    id: 'CAP-2026-0109-009',
    name: 'Citizens NYC Neighborhood Business Grants',
    url: 'https://www.citizensnyc.org/nbg/',
    expectedAmount: '$5,000',
    expectedDeadline: 'February 2, 2026',
    keywords: ['grant', 'NYC', 'neighborhood', 'business']
  },
  {
    id: 'CAP-2026-0109-010',
    name: 'Comcast Innovation Fund',
    url: 'https://innovationfund.comcast.com',
    expectedAmount: '$3,000 - $150,000',
    expectedDeadline: 'February 2026',
    keywords: ['innovation', 'technology', 'internet', 'research']
  },
  {
    id: 'CAP-2026-0109-011',
    name: 'Compute Challengers Pitch Competition',
    url: 'https://computechallengers.com',
    expectedAmount: 'Varies',
    expectedDeadline: 'January 12, 2026',
    keywords: ['compute', 'startup', 'competition', 'pitch']
  },
  {
    id: 'CAP-2026-0109-012',
    name: 'EIT NEB Accelerator',
    url: 'https://eit.europa.eu',
    expectedAmount: 'Program support',
    expectedDeadline: 'January 2026',
    keywords: ['european', 'innovation', 'sustainability', 'accelerator']
  },
  {
    id: 'CAP-2026-0109-013',
    name: 'Free Electrons 2026',
    url: 'https://freeelectrons.org',
    expectedAmount: 'Pilot + Investment',
    expectedDeadline: 'January 31, 2026',
    keywords: ['energy', 'utilities', 'accelerator', 'global']
  },
  {
    id: 'CAP-2026-0109-014',
    name: 'Queens Tech + Innovation Challenge',
    url: 'https://queensstartup.org/',
    expectedAmount: '$20,000',
    expectedDeadline: 'March 2026',
    keywords: ['queens', 'tech', 'innovation', 'grant']
  },
  {
    id: 'CAP-2026-0109-015',
    name: 'Accel Atoms + Google AI Futures',
    url: 'https://atoms.accel.com',
    expectedAmount: '$2,000,000',
    expectedDeadline: 'February 2026',
    keywords: ['AI', 'accel', 'google', 'pre-seed', 'funding']
  },
  {
    id: 'CAP-2026-0109-016',
    name: 'Colorado Advanced Industries Accelerator',
    url: 'https://oedit.colorado.gov/advanced-industries-accelerator-programs',
    expectedAmount: '$150,000',
    expectedDeadline: 'February 26, 2026',
    keywords: ['colorado', 'grant', 'advanced', 'industries']
  },
  // Additional opportunities found in Round 2
  {
    id: 'CAP-2026-0109-017',
    name: 'Food Business Grant',
    url: 'https://www.citizensnyc.org/nbg/',
    expectedAmount: 'Varies',
    expectedDeadline: 'February 2, 2026',
    keywords: ['food', 'business', 'grant', 'NYC']
  },
  {
    id: 'CAP-2026-0109-018',
    name: 'Baylor New Venture Competition',
    url: 'https://hankamer.baylor.edu/baugh-center/new-venture',
    expectedAmount: '$200,000+',
    expectedDeadline: 'January 21, 2026',
    keywords: ['competition', 'venture', 'baylor', 'student']
  },
  {
    id: 'CAP-2026-0109-019',
    name: 'Intuit Small Business Hero',
    url: 'https://quickbooks.intuit.com/r/grants/',
    expectedAmount: '$20,000',
    expectedDeadline: 'February 14, 2026',
    keywords: ['intuit', 'quickbooks', 'grant', 'small business']
  },
  {
    id: 'CAP-2026-0109-020',
    name: 'VHNY Founder Fellowship',
    url: 'https://www.visiblehands.vc/',
    expectedAmount: 'Support + Network',
    expectedDeadline: 'February 18, 2026',
    keywords: ['fellowship', 'founders', 'overlooked', 'NYC']
  }
];

// Output directories
const SCREENSHOT_DIR = './data/screenshots';
const REPORT_DIR = './data/verification';

async function ensureDirectories() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  await fs.mkdir(REPORT_DIR, { recursive: true });
}

async function verifyOpportunity(browser, opp) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });

  const page = await context.newPage();
  const result = {
    id: opp.id,
    name: opp.name,
    url: opp.url,
    timestamp: new Date().toISOString(),
    status: 'pending',
    linkWorks: false,
    pageTitle: null,
    pageContent: null,
    screenshotPath: null,
    keywordsFound: [],
    keywordsMissing: [],
    amountFound: null,
    deadlineFound: null,
    confidenceScore: 0,
    notes: []
  };

  try {
    console.log(`\n🔍 Verifying: ${opp.name}`);
    console.log(`   URL: ${opp.url}`);

    // Navigate to the page
    const response = await page.goto(opp.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Check if page loaded
    if (response && response.ok()) {
      result.linkWorks = true;
      result.httpStatus = response.status();
      console.log(`   ✅ Link works (HTTP ${response.status()})`);
    } else {
      result.httpStatus = response ? response.status() : 'no response';
      result.notes.push(`HTTP status: ${result.httpStatus}`);
      console.log(`   ⚠️ HTTP status: ${result.httpStatus}`);
    }

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Get page title
    result.pageTitle = await page.title();
    console.log(`   📄 Title: ${result.pageTitle}`);

    // Get page content
    const bodyText = await page.evaluate(() => document.body.innerText);
    result.pageContent = bodyText.substring(0, 5000); // First 5000 chars

    // Check for keywords
    const lowerContent = bodyText.toLowerCase();
    for (const keyword of opp.keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        result.keywordsFound.push(keyword);
      } else {
        result.keywordsMissing.push(keyword);
      }
    }
    console.log(`   🔑 Keywords found: ${result.keywordsFound.length}/${opp.keywords.length}`);

    // Look for amounts (dollar figures)
    const amountMatches = bodyText.match(/\$[\d,]+(?:,\d{3})*(?:\.\d{2})?(?:\s*(?:k|K|million|Million|M))?\b/g);
    if (amountMatches) {
      result.amountFound = [...new Set(amountMatches)].slice(0, 5);
      console.log(`   💰 Amounts found: ${result.amountFound.join(', ')}`);
    }

    // Look for dates
    const datePatterns = [
      /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}/gi,
      /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s*\d{4}/gi
    ];

    const datesFound = [];
    for (const pattern of datePatterns) {
      const matches = bodyText.match(pattern);
      if (matches) {
        datesFound.push(...matches);
      }
    }
    if (datesFound.length > 0) {
      result.deadlineFound = [...new Set(datesFound)].slice(0, 5);
      console.log(`   📅 Dates found: ${result.deadlineFound.join(', ')}`);
    }

    // Take screenshot
    const screenshotFile = `${opp.id}-${Date.now()}.png`;
    result.screenshotPath = path.join(SCREENSHOT_DIR, screenshotFile);
    await page.screenshot({
      path: result.screenshotPath,
      fullPage: false
    });
    console.log(`   📸 Screenshot saved: ${screenshotFile}`);

    // Calculate confidence score
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

    console.log(`   📊 Confidence Score: ${result.confidenceScore}/100 (${result.status})`);

  } catch (error) {
    result.status = 'error';
    result.error = error.message;
    result.notes.push(`Error: ${error.message}`);
    console.log(`   ❌ Error: ${error.message}`);
  }

  await context.close();
  return result;
}

async function generateReport(results) {
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(REPORT_DIR, `verification-report-${timestamp}.md`);

  // Calculate summary stats
  const verified = results.filter(r => r.status === 'verified').length;
  const partial = results.filter(r => r.status === 'partial').length;
  const needsReview = results.filter(r => r.status === 'needs_review').length;
  const errors = results.filter(r => r.status === 'error').length;
  const avgConfidence = Math.round(results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length);

  let report = `# Link Verification Report
> Generated: ${new Date().toISOString()}
> Verified with Playwright Browser Automation

---

## Summary

| Metric | Value |
|--------|-------|
| Total Verified | ${results.length} |
| Fully Verified | ${verified} (${Math.round(verified/results.length*100)}%) |
| Partially Verified | ${partial} (${Math.round(partial/results.length*100)}%) |
| Needs Review | ${needsReview} (${Math.round(needsReview/results.length*100)}%) |
| Errors | ${errors} (${Math.round(errors/results.length*100)}%) |
| Average Confidence | ${avgConfidence}/100 |

---

## Detailed Results

`;

  for (const r of results) {
    const statusEmoji = {
      'verified': '✅',
      'partial': '⚠️',
      'needs_review': '🔍',
      'error': '❌'
    }[r.status] || '❓';

    report += `### ${statusEmoji} ${r.id}: ${r.name}

| Field | Value |
|-------|-------|
| URL | ${r.url} |
| Status | ${r.status} |
| Link Works | ${r.linkWorks ? 'Yes' : 'No'} |
| Page Title | ${r.pageTitle || 'N/A'} |
| Confidence Score | ${r.confidenceScore}/100 |
| Keywords Found | ${r.keywordsFound.join(', ') || 'None'} |
| Keywords Missing | ${r.keywordsMissing.join(', ') || 'None'} |
| Amounts Detected | ${r.amountFound ? r.amountFound.join(', ') : 'None'} |
| Dates Detected | ${r.deadlineFound ? r.deadlineFound.join(', ') : 'None'} |
| Screenshot | ${r.screenshotPath ? `[View](${r.screenshotPath})` : 'N/A'} |
${r.notes.length > 0 ? `| Notes | ${r.notes.join('; ')} |` : ''}

---

`;
  }

  // Add JSON export
  const jsonPath = path.join(REPORT_DIR, `verification-results-${timestamp}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));

  report += `
## Raw Data

Full JSON results exported to: \`${jsonPath}\`
`;

  await fs.writeFile(reportPath, report);
  console.log(`\n📋 Report saved to: ${reportPath}`);
  console.log(`📊 JSON saved to: ${jsonPath}`);

  return reportPath;
}

async function main() {
  console.log('🚀 Capital Access - Link Verification Script');
  console.log('=========================================\n');

  await ensureDirectories();

  const browser = await chromium.launch({
    headless: true
  });

  console.log(`📋 Verifying ${opportunities.length} opportunities...\n`);

  const results = [];

  for (const opp of opportunities) {
    const result = await verifyOpportunity(browser, opp);
    results.push(result);
  }

  await browser.close();

  // Generate report
  const reportPath = await generateReport(results);

  // Print summary
  console.log('\n=========================================');
  console.log('📊 VERIFICATION SUMMARY');
  console.log('=========================================');

  const verified = results.filter(r => r.status === 'verified');
  const partial = results.filter(r => r.status === 'partial');
  const needsReview = results.filter(r => r.status === 'needs_review' || r.status === 'error');

  console.log(`\n✅ Verified (${verified.length}):`);
  verified.forEach(r => console.log(`   - ${r.name} (${r.confidenceScore}/100)`));

  console.log(`\n⚠️ Partial (${partial.length}):`);
  partial.forEach(r => console.log(`   - ${r.name} (${r.confidenceScore}/100)`));

  console.log(`\n🔍 Needs Review (${needsReview.length}):`);
  needsReview.forEach(r => console.log(`   - ${r.name} (${r.confidenceScore}/100) - ${r.notes.join(', ') || r.error || 'Low confidence'}`));

  console.log(`\n📁 Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log(`📋 Full report: ${reportPath}`);
}

main().catch(console.error);
