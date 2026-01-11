/**
 * Debug test for modal positioning
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';

const SCREENSHOT_DIR = './data/test-screenshots';
const BASE_URL = 'http://localhost:5173';

async function main() {
  console.log('Debug Modal Positioning\n');

  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  // Enable console logging from page
  page.on('console', msg => console.log(`[Browser]: ${msg.text()}`));

  try {
    await page.goto(`${BASE_URL}/funding`);
    await page.waitForTimeout(4000);

    // Scroll to cards
    const detailsButton = page.locator('button:has-text("Details")').first();
    await detailsButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Get button position
    const buttonBox = await detailsButton.boundingBox();
    console.log(`Button position: x=${buttonBox.x}, y=${buttonBox.y}, w=${buttonBox.width}, h=${buttonBox.height}`);

    // Click with explicit coordinates
    const clickX = buttonBox.x + buttonBox.width / 2;
    const clickY = buttonBox.y + buttonBox.height / 2;
    console.log(`Clicking at: (${clickX}, ${clickY})`);

    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(2000);

    // Get modal element
    const modal = page.locator('.fixed.z-\\[51\\]').first();
    const isVisible = await modal.isVisible();
    console.log(`Modal visible: ${isVisible}`);

    if (await modal.count() > 0) {
      // Get data attributes
      const posX = await modal.getAttribute('data-position-x');
      const posY = await modal.getAttribute('data-position-y');
      const styleTop = await modal.getAttribute('data-style-top');
      const styleLeft = await modal.getAttribute('data-style-left');

      console.log(`\nData attributes:`);
      console.log(`  position.x passed: ${posX}`);
      console.log(`  position.y passed: ${posY}`);
      console.log(`  Calculated top: ${styleTop}`);
      console.log(`  Calculated left: ${styleLeft}`);

      // Get actual bounding box
      const modalBox = await modal.boundingBox();
      if (modalBox) {
        console.log(`\nActual modal boundingBox:`);
        console.log(`  x: ${modalBox.x}, y: ${modalBox.y}`);
        console.log(`  width: ${modalBox.width}, height: ${modalBox.height}`);
      }

      // Get computed style
      const computedTop = await modal.evaluate(el => window.getComputedStyle(el).top);
      const computedLeft = await modal.evaluate(el => window.getComputedStyle(el).left);
      console.log(`\nComputed styles:`);
      console.log(`  top: ${computedTop}`);
      console.log(`  left: ${computedLeft}`);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/modal-debug.png`, fullPage: false });
    console.log('\nScreenshot saved: modal-debug.png');

  } catch (error) {
    console.error('Error:', error.message);
  }

  await browser.close();
}

main().catch(console.error);
