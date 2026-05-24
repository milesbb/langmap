import { test, expect } from '@playwright/test';

test.describe('English path navigation', () => {
  test('lands on PIE node by default', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/#\/language\/proto-indo-european/);
  });

  test('info panel shows language name for old-english', async ({ page }) => {
    await page.goto('/#/language/old-english');
    // Wait for full data (languages.json async load + backfill)
    await expect(page.locator('.info-name')).toContainText('Old English', { timeout: 15000 });
  });

  test('each node in the English path shows the correct language name', async ({ page }) => {
    const nodes = [
      { id: 'proto-indo-european', name: 'Proto-Indo-European' },
      { id: 'proto-germanic', name: 'Proto-Germanic' },
      { id: 'proto-west-germanic', name: 'Proto-West-Germanic' },
      { id: 'old-english', name: 'Old English' },
      { id: 'middle-english', name: 'Middle English' },
      { id: 'early-modern-english', name: 'Early Modern English' },
      { id: 'modern-english', name: 'Modern English' },
    ];

    for (const { id, name } of nodes) {
      await page.goto(`/#/language/${id}`);
      await expect(page.locator('.info-name')).toContainText(name, { timeout: 15000 });
    }
  });

  test('URL updates correctly on each hash navigation', async ({ page }) => {
    await page.goto('/#/language/old-english');
    await expect(page).toHaveURL(/#\/language\/old-english/);
    await page.evaluate(() => { window.location.hash = '#/language/middle-english'; });
    await expect(page).toHaveURL(/#\/language\/middle-english/);
  });

  test('timeline bar shows a date after navigation', async ({ page }) => {
    await page.goto('/#/language/old-english');
    await page.waitForSelector('#timeline-year', { timeout: 10000 });
    const text = await page.locator('#timeline-year').textContent({ timeout: 5000 });
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('node markers are rendered on the map', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.node-marker', { timeout: 10000 });
    const count = await page.locator('.node-marker').count();
    expect(count).toBeGreaterThan(50);
  });

  test('migration arrows appear after landing on a node', async ({ page }) => {
    await page.goto('/#/language/proto-indo-european');
    // PIE has many children; at least one arrow should be in the DOM
    await page.waitForFunction(
      () => document.querySelectorAll('.migration-arrow').length > 0,
      { timeout: 10000 }
    );
    const count = await page.evaluate(() => document.querySelectorAll('.migration-arrow').length);
    expect(count).toBeGreaterThan(0);
  });

  test('clicking a node marker navigates to that language', async ({ page }) => {
    await page.goto('/#/language/proto-indo-european');
    await page.waitForSelector('[data-node-id="proto-germanic"]', { timeout: 10000 });
    // Dispatch click via evaluate to bypass SVG transform coordinate mismatch
    await page.evaluate(() => {
      /** @type {HTMLElement | null} */
      const el = document.querySelector('[data-node-id="proto-germanic"]');
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await expect(page).toHaveURL(/#\/language\/proto-germanic/, { timeout: 10000 });
  });
});
