import { test, expect } from '@playwright/test';

/**
 * Preview Smoke Tests
 *
 * These tests run against deployed preview URLs to verify
 * the deployment is working correctly.
 *
 * Requires PREVIEW_URL environment variable to be set.
 */

const PREVIEW_URL = process.env.PREVIEW_URL;

// Skip all tests if no preview URL is provided
test.skip(!PREVIEW_URL, 'PREVIEW_URL not set - skipping preview tests');

test.describe('Preview Smoke Tests', () => {
  test('preview loads successfully', async ({ page }) => {
    const response = await page.goto(PREVIEW_URL);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
  });

  test('no critical console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(PREVIEW_URL);
    await page.waitForTimeout(3000);

    // Filter out expected/benign errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('PostHog') &&
      !e.includes('analytics') &&
      !e.includes('third-party')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('app renders without crash', async ({ page }) => {
    let crashed = false;
    page.on('pageerror', () => { crashed = true; });

    await page.goto(PREVIEW_URL);
    await page.waitForTimeout(2000);

    expect(crashed).toBe(false);
  });

  test('navigation works', async ({ page }) => {
    await page.goto(PREVIEW_URL);
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10000 });

    // Navigate to a key page
    await page.goto(`${PREVIEW_URL}/opportunities`);
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10000 });
  });
});
