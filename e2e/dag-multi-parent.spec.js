import { test, expect } from '@playwright/test';

test.describe('DAG multi-parent node', () => {
  test('Middle English info panel mentions Norman Conquest', async ({ page }) => {
    await page.goto('/#/language/middle-english');
    await expect(page.locator('.info-name')).toContainText('Middle English', { timeout: 15000 });
    const text = await page.locator('#info-panel').textContent({ timeout: 5000 });
    expect(text).toContain('Norman');
  });

  test('Middle English info panel shows Old English influence', async ({ page }) => {
    await page.goto('/#/language/middle-english');
    await expect(page.locator('.info-name')).toContainText('Middle English', { timeout: 15000 });
    const text = await page.locator('#info-panel').textContent({ timeout: 5000 });
    expect(text).toMatch(/old.english/i);
  });

  test('Middle English info panel shows both parent influences', async ({ page }) => {
    await page.goto('/#/language/middle-english');
    await expect(page.locator('.info-name')).toContainText('Middle English', { timeout: 15000 });
    const text = await page.locator('#info-panel').textContent({ timeout: 5000 });
    expect(text).toMatch(/old.english/i);
    expect(text).toMatch(/old.french/i);
  });

  test('Middle English shows migration arrows for its children in the DOM', async ({ page }) => {
    await page.goto('/#/language/middle-english');
    await page.waitForFunction(
      () => document.querySelectorAll('.migration-arrow[data-edge-from="middle-english"]').length > 0,
      { timeout: 10000 }
    );
    const count = await page.evaluate(
      () => document.querySelectorAll('.migration-arrow[data-edge-from="middle-english"]').length
    );
    expect(count).toBeGreaterThan(0);
  });

  test('navigating to Middle English via hash URL works', async ({ page }) => {
    await page.goto('/#/language/middle-english');
    await expect(page).toHaveURL(/#\/language\/middle-english/);
    await expect(page.locator('.info-name')).toContainText('Middle English', { timeout: 15000 });
  });
});
