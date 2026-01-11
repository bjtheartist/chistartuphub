/**
 * Test script specifically for funding page and detail modal
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';

const SCREENSHOT_DIR = './data/test-screenshots';
const BASE_URL = 'http://localhost:5173';

async function ensureDir() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
}

async function main() {
  console.log('Testing Funding Page and Detail Modal\n');
  console.log('=====================================\n');

  await ensureDir();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  try {
    // Navigate to funding page
    console.log('1. Navigating to funding page...');
    await page.goto(`${BASE_URL}/funding`);

    // Wait for loading screen to disappear (wait for content to load)
    console.log('2. Waiting for page to fully load...');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/funding-initial.png`, fullPage: false });
    console.log('   Screenshot: funding-initial.png');

    // Check if page shows loading or content
    const pageContent = await page.content();
    const hasLoading = pageContent.includes('[READY]') || pageContent.includes('LOADING');
    const hasCapital = pageContent.includes('Capital Resources') || pageContent.includes('CAPITAL');
    const hasOpportunities = pageContent.includes('Opportunities') || pageContent.includes('OPPORTUNITIES');

    console.log(`   Loading screen visible: ${hasLoading}`);
    console.log(`   Capital title visible: ${hasCapital}`);
    console.log(`   Opportunities section: ${hasOpportunities}`);

    // Wait a bit more if loading
    if (hasLoading && !hasCapital) {
      console.log('3. Still loading, waiting more...');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/funding-after-wait.png`, fullPage: false });
      console.log('   Screenshot: funding-after-wait.png');
    }

    // Try scrolling to trigger any lazy loading
    console.log('4. Scrolling page to trigger content...');
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(1000);

    // Take another screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/funding-scrolled.png`, fullPage: false });
    console.log('   Screenshot: funding-scrolled.png');

    // Try clicking anywhere to dismiss potential loading overlay
    console.log('5. Clicking to dismiss any overlays...');
    await page.click('body');
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/funding-full.png`, fullPage: true });
    console.log('   Screenshot: funding-full.png (full page)');

    // Look for any clickable cards
    console.log('6. Looking for funding cards...');
    const cards = await page.locator('.cursor-pointer').count();
    console.log(`   Found ${cards} clickable elements`);

    // Look for "Details" buttons
    const detailButtons = await page.locator('button:has-text("Details")').count();
    console.log(`   Found ${detailButtons} "Details" buttons`);

    // Look for any opportunity names
    const filterTabs = await page.locator('button:has-text("All")').count();
    console.log(`   Found ${filterTabs} filter tabs with "All"`);

    // Check page title
    const title = await page.title();
    console.log(`   Page title: ${title}`);

    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`   Console error: ${msg.text()}`);
      }
    });

    // Final status
    console.log('\n=====================================');
    console.log('Test complete. Check screenshots in data/test-screenshots/');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
}

main().catch(console.error);
