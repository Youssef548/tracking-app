const { test, expect } = require('@playwright/test');
const { registerAndLogin } = require('./helpers');

test.describe('Settings page', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('shows profile info and all three theme buttons', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.getByRole('button', { name: /light/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /dark/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /auto/i })).toBeVisible();
    // Profile card shows the user's full name
    await expect(page.getByText('E2E Tester')).toBeVisible();
  });

  test('clicking Dark adds dark class to html', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /dark/i }).click();
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/, { timeout: 2000 });
  });

  test('theme persists after page reload', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /dark/i }).click();
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 5000 });
  });

  test('clicking Light removes dark class from html', async ({ page }) => {
    // Start in dark, switch to light
    await page.goto('/settings');
    await page.getByRole('button', { name: /dark/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/, { timeout: 2000 });
    await page.getByRole('button', { name: /light/i }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/, { timeout: 2000 });
  });

  test('sign out navigates to login', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });
});
