import { test, expect } from '@playwright/test';

test.describe('Back navigation', () => {
  test('browser back button returns to previous language', async ({ page }) => {
    await page.goto('/#/language/old-english');
    // Navigate to middle-english via hash
    await page.evaluate(() => { window.location.hash = '#/language/middle-english'; });
    await expect(page).toHaveURL(/#\/language\/middle-english/, { timeout: 5000 });

    await page.goBack();
    await expect(page).toHaveURL(/#\/language\/old-english/, { timeout: 10000 });
  });

  test('direct URL hash navigation works for proto-germanic', async ({ page }) => {
    await page.goto('/#/language/proto-germanic');
    await expect(page.locator('.info-name')).toContainText('Proto-Germanic', { timeout: 15000 });
  });

  test('side menu toggle opens and closes', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#menu-toggle', { timeout: 5000 });
    const menu = page.locator('#side-menu');

    await expect(menu).toHaveAttribute('aria-hidden', 'true');
    await page.click('#menu-toggle');
    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    await page.click('.side-menu-close');
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
  });

  test('overview toggle activates and deactivates overview mode', async ({ page }) => {
    await page.goto('/#/language/proto-indo-european');
    await page.waitForSelector('#overview-toggle', { timeout: 5000 });

    await page.click('#overview-toggle');
    await expect(page.locator('#overview-toggle')).toHaveAttribute('aria-pressed', 'true');

    await page.click('#overview-toggle');
    await expect(page.locator('#overview-toggle')).toHaveAttribute('aria-pressed', 'false');
  });
});
