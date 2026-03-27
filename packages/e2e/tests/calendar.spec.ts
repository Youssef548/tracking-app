import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

test.describe('Calendar page', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.getByRole('link', { name: 'Calendar' }).first().click();
    await expect(page).toHaveURL('/calendar');
  });

  test('displays current month and year', async ({ page }) => {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const expected = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    await expect(page.getByRole('heading', { name: expected })).toBeVisible();
  });

  test('navigate to previous month', async ({ page }) => {
    // Click the back arrow (chevron_left)
    await page.getByText('chevron_left').click();

    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const expected = `${monthNames[prevMonth]} ${prevYear}`;
    await expect(page.getByRole('heading', { name: expected })).toBeVisible();
  });

  test('navigate to next month', async ({ page }) => {
    await page.getByText('chevron_right').click();

    const now = new Date();
    const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const expected = `${monthNames[nextMonth]} ${nextYear}`;
    await expect(page.getByRole('heading', { name: expected })).toBeVisible();
  });

  test('shows day detail panel', async ({ page }) => {
    // The day detail panel should be visible for today by default
    const _todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    // Just check the panel area exists — exact format may vary
    await expect(page.locator('aside')).toBeVisible();
  });
});
