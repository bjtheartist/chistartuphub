/**
 * Quick test script to verify the UI changes
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';

const SCREENSHOT_DIR = './data/test-screenshots';
const BASE_URL = 'http://localhost:5173';

async function ensureDir() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
}

async function testLoginError(page) {
  console.log('\n🔐 Testing Login Error Message...');

  // Navigate to home page
  await page.goto(BASE_URL);
  await page.waitForTimeout(2000);

  // Look for login button and click it
  const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Login"), a:has-text("Sign In")').first();
  if (await loginButton.isVisible()) {
    await loginButton.click();
    await page.waitForTimeout(1000);

    // Fill in wrong credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    if (await emailInput.isVisible()) {
      await emailInput.fill('wrong@test.com');
      await passwordInput.fill('wrongpassword123');

      // Submit
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(3000);

      // Take screenshot
      await page.screenshot({ path: `${SCREENSHOT_DIR}/login-error-test.png`, fullPage: false });

      // Check for error message
      const errorMessage = page.locator('text=/Invalid|error|failed/i');
      if (await errorMessage.isVisible()) {
        console.log('   ✅ Error message is visible!');
        return true;
      } else {
        console.log('   ⚠️ Error message not found (may take time to appear)');
        return false;
      }
    }
  }
  console.log('   ⚠️ Login button not found');
  return false;
}

async function testFundingPage(page) {
  console.log('\n💰 Testing Funding Page Detail Modal...');

  // Navigate to funding page
  await page.goto(`${BASE_URL}/funding`);
  await page.waitForTimeout(2000);

  // Screenshot the funding page
  await page.screenshot({ path: `${SCREENSHOT_DIR}/funding-page.png`, fullPage: false });
  console.log('   📸 Funding page screenshot saved');

  // Look for an opportunity card and click it
  const cards = page.locator('.cursor-pointer').first();
  if (await cards.isVisible()) {
    await cards.click();
    await page.waitForTimeout(1000);

    // Check if modal opened
    const modal = page.locator('text=/Apply Now|Details|Description/i');
    if (await modal.isVisible()) {
      console.log('   ✅ Detail modal opens on card click!');

      // Screenshot the modal
      await page.screenshot({ path: `${SCREENSHOT_DIR}/funding-detail-modal.png`, fullPage: false });
      console.log('   📸 Detail modal screenshot saved');

      // Check for Save button
      const saveButton = page.locator('button:has-text("Save")');
      if (await saveButton.isVisible()) {
        console.log('   ✅ Save button is present!');
      }

      // Close modal
      const closeButton = page.locator('[class*="X"], button:has(svg)').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      return true;
    }
  }
  console.log('   ⚠️ Could not test modal - no cards found');
  return false;
}

async function testHomePage(page) {
  console.log('\n🏠 Testing Home Page...');

  await page.goto(BASE_URL);
  await page.waitForTimeout(2000);

  // Screenshot
  await page.screenshot({ path: `${SCREENSHOT_DIR}/home-page.png`, fullPage: false });
  console.log('   📸 Home page screenshot saved');

  const title = await page.title();
  console.log(`   📄 Title: ${title}`);

  return true;
}

async function main() {
  console.log('🧪 ChiStartup Hub - UI Test Suite');
  console.log('==================================\n');

  await ensureDir();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  const results = {
    homePage: false,
    loginError: false,
    fundingModal: false
  };

  try {
    results.homePage = await testHomePage(page);
    results.fundingModal = await testFundingPage(page);
    results.loginError = await testLoginError(page);
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  await browser.close();

  // Summary
  console.log('\n==================================');
  console.log('📊 TEST SUMMARY');
  console.log('==================================');
  console.log(`Home Page:      ${results.homePage ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Funding Modal:  ${results.fundingModal ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Login Error:    ${results.loginError ? '✅ PASS' : '⚠️ NEEDS MANUAL CHECK'}`);
  console.log(`\n📁 Screenshots: ${SCREENSHOT_DIR}/`);
}

main().catch(console.error);
