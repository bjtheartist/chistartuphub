/**
 * Test script to verify modal positioning at click coordinates
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';

const SCREENSHOT_DIR = './data/test-screenshots';
const BASE_URL = 'http://localhost:5173';

async function ensureDir() {
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
}

async function main() {
  console.log('Testing Modal Position at Click Coordinates\n');
  console.log('============================================\n');

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
    await page.waitForTimeout(4000);

    // Scroll to the funding cards section
    console.log('2. Scrolling to funding cards section...');
    const detailsButton = page.locator('button:has-text("Details")').first();
    await detailsButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Take screenshot after scrolling
    await page.screenshot({ path: `${SCREENSHOT_DIR}/modal-test-1-scrolled.png`, fullPage: false });
    console.log('   Screenshot: modal-test-1-scrolled.png');

    const buttonCount = await page.locator('button:has-text("Details")').count();
    console.log(`\n3. Found ${buttonCount} Details buttons`);

    if (buttonCount > 0) {
      // Get button position (viewport coordinates after scrollIntoView)
      const buttonBox = await detailsButton.boundingBox();
      if (buttonBox) {
        console.log(`   Button viewport position: x=${Math.round(buttonBox.x)}, y=${Math.round(buttonBox.y)}`);

        // Click the button
        console.log('\n4. Clicking Details button...');
        await detailsButton.click();
        await page.waitForTimeout(1500);

        // Take screenshot showing modal position
        await page.screenshot({ path: `${SCREENSHOT_DIR}/modal-test-2-modal-open.png`, fullPage: false });
        console.log('   Screenshot: modal-test-2-modal-open.png');

        // Check modal position
        const modal = page.locator('.fixed.max-w-2xl').first();
        const modalVisible = await modal.isVisible();
        console.log(`   Modal visible: ${modalVisible}`);

        if (modalVisible) {
          const modalBox = await modal.boundingBox();
          if (modalBox) {
            console.log(`\n5. Positioning Analysis:`);
            console.log(`   Modal position: left=${Math.round(modalBox.x)}px, top=${Math.round(modalBox.y)}px`);
            console.log(`   Modal size: ${Math.round(modalBox.width)}x${Math.round(modalBox.height)}`);

            // Verify modal is within viewport
            const rightEdge = modalBox.x + modalBox.width;
            const bottomEdge = modalBox.y + modalBox.height;
            console.log(`   Right edge: ${Math.round(rightEdge)}px (viewport: 1280px)`);
            console.log(`   Bottom edge: ${Math.round(bottomEdge)}px (viewport: 900px)`);
            console.log(`   Within viewport horizontally: ${rightEdge <= 1280 ? 'YES' : 'NO'}`);
            console.log(`   Within viewport vertically: ${bottomEdge <= 900 ? 'YES' : 'NO'}`);
            console.log(`   Overall within viewport: ${rightEdge <= 1280 && bottomEdge <= 900 && modalBox.x >= 0 && modalBox.y >= 0 ? 'YES' : 'NO'}`);

            // Check for Apply Now and Save buttons in modal
            const applyButton = modal.locator('a:has-text("Apply Now")');
            const saveButton = modal.locator('button:has-text("Save")');
            console.log(`\n6. Modal Content Check:`);
            console.log(`   Apply Now button: ${await applyButton.count() > 0 ? 'PRESENT' : 'NOT FOUND'}`);
            console.log(`   Save button: ${await saveButton.count() > 0 ? 'PRESENT' : 'NOT FOUND'}`);
          }

          // Close modal by clicking backdrop
          console.log('\n7. Closing modal...');
          await page.click('.bg-black\\/80');
          await page.waitForTimeout(500);
          console.log('   Modal closed');
        }
      }
    }

    // Test 2: Click a card on the right edge to test boundary correction
    console.log('\n8. Testing right-edge boundary correction...');
    const cards = await page.locator('[class*="cursor-pointer"]').all();
    if (cards.length >= 3) {
      const thirdCard = cards[2];
      await thirdCard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const cardBox = await thirdCard.boundingBox();
      if (cardBox) {
        // Click near the right edge of the card
        const clickX = cardBox.x + cardBox.width - 20;
        const clickY = cardBox.y + 50;
        console.log(`   Clicking near right edge: x=${Math.round(clickX)}, y=${Math.round(clickY)}`);

        await page.mouse.click(clickX, clickY);
        await page.waitForTimeout(1500);

        await page.screenshot({ path: `${SCREENSHOT_DIR}/modal-test-3-right-edge.png`, fullPage: false });
        console.log('   Screenshot: modal-test-3-right-edge.png');

        const modal2 = page.locator('.fixed.max-w-2xl').first();
        if (await modal2.isVisible()) {
          const modalBox2 = await modal2.boundingBox();
          if (modalBox2) {
            const rightEdge = modalBox2.x + modalBox2.width;
            console.log(`   Modal left: ${Math.round(modalBox2.x)}px, right: ${Math.round(rightEdge)}px`);
            console.log(`   Right boundary respected: ${rightEdge <= 1260 ? 'YES' : 'OVERFLOW'}`);
          }
        }
      }
    }

    console.log('\n============================================');
    console.log('Modal positioning test complete!');
    console.log('Check screenshots in data/test-screenshots/');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/modal-test-error.png`, fullPage: false });
  }

  await browser.close();
}

main().catch(console.error);
