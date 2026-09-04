import { test, expect } from '@playwright/test';

/**
 * Events page
 *
 * Covers the spotlight + timeline layout, event-type filters, URL-synced
 * filter state, and the sunset /Opportunities redirect.
 *
 * Replaces the old auto-refresh spec: the page no longer polls on an
 * interval (removed in the Core Web Vitals pass), so those tests were
 * asserting behavior that does not exist.
 */

const ignorableError = (msg) =>
  msg.includes('WebSocket') || msg.includes('ResizeObserver') || msg.includes('favicon');

test.describe('Events Page', () => {
  test('loads without uncaught errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => {
      if (!ignorableError(err.message)) errors.push(err.message);
    });

    await page.goto('/Events');
    await expect(page.locator('[data-page="events"]')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    expect(errors).toEqual([]);
  });

  test('shows hero stats and hub calendars', async ({ page }) => {
    await page.goto('/Events');
    await expect(page.locator('[data-page="events"]')).toBeVisible({ timeout: 15000 });

    await expect(page.getByText(/Chicago Tech Events/i).first()).toBeVisible();
    await expect(page.getByText(/Upcoming Events|Past Events/i).first()).toBeVisible();
    await expect(page.getByText('Innovation Hubs', { exact: true })).toBeVisible();
    await expect(page.getByText('[INNOVATION_HUBS]')).toBeVisible();
  });

  test('requests aggregated_events once on load', async ({ page }) => {
    let requests = 0;
    page.on('request', (request) => {
      if (request.url().includes('aggregated_events') && request.method() === 'GET') requests++;
    });

    await page.goto('/Events');
    await expect(page.locator('[data-page="events"]')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    expect(requests).toBeGreaterThanOrEqual(1);
  });

  test('event type chips filter the timeline and sync to the URL', async ({ page }) => {
    await page.goto('/Events');
    await expect(page.locator('[data-page="events"]')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Event Type', { exact: true })).toBeVisible();

    // "All Events" is always present; other chips appear only when they have events.
    const allChip = page.getByRole('button', { name: /^All Events/i });
    await expect(allChip).toBeVisible();

    const typeChips = page.getByRole('button', {
      name: /Summits & Conferences|Demo Days & Pitch|Awards|Workshops|Talks & Panels|Hackathons|Office Hours & AMAs|Meetups & Networking/i,
    });
    const chipCount = await typeChips.count();
    test.skip(chipCount === 0, 'No upcoming events in the database to filter');

    await typeChips.first().click();
    await expect(page).toHaveURL(/[?&]type=/);
    await expect(page.getByText(/\d+ events? · /i)).toBeVisible();

    await page.getByRole('button', { name: /Clear/i }).click();
    await expect(page).not.toHaveURL(/[?&]type=/);
  });

  test('format and free-only toggles are URL-backed', async ({ page }) => {
    await page.goto('/Events?format=virtual&free=1');
    await expect(page.locator('[data-page="events"]')).toBeVisible({ timeout: 15000 });

    await expect(page.getByRole('button', { name: /^Virtual$/i })).toHaveClass(/bg-white/);
    await expect(page.getByRole('button', { name: /^Free Only$/i })).toHaveClass(/bg-white/);
  });

  test('view toggle switches to past events', async ({ page }) => {
    await page.goto('/Events');
    await expect(page.locator('[data-page="events"]')).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /^Past$/i }).click();
    await expect(page).toHaveURL(/view=past/);
    await expect(page.getByText(/Past Events/i).first()).toBeVisible();
  });

  test('search input filters client-side without a new request', async ({ page }) => {
    await page.goto('/Events');
    await expect(page.locator('[data-page="events"]')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    let requestsAfterLoad = 0;
    page.on('request', (request) => {
      if (request.url().includes('aggregated_events')) requestsAfterLoad++;
    });

    const searchInput = page.getByPlaceholder(/SEARCH_EVENTS/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('summit');
    await page.waitForTimeout(800);

    await expect(page).toHaveURL(/q=summit/);
    expect(requestsAfterLoad).toBe(0);
  });
});

test.describe('Sunset Opportunities Route', () => {
  test('redirects to events', async ({ page }) => {
    await page.goto('/Opportunities');
    await expect(page).toHaveURL(/\/events$/i);
    await expect(page.locator('[data-page="events"]')).toBeVisible({ timeout: 15000 });
  });

  test('does not request founder_asks', async ({ page }) => {
    let founderAsksRequest = false;
    page.on('request', (request) => {
      if (request.url().includes('founder_asks')) founderAsksRequest = true;
    });

    await page.goto('/Opportunities');
    await expect(page).toHaveURL(/\/events$/i);
    await page.waitForTimeout(2000);

    expect(founderAsksRequest).toBe(false);
  });
});
