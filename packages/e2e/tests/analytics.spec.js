const { test, expect } = require('@playwright/test');
const { registerAndLogin } = require('./helpers');

test.describe('Analytics page', () => {
  test('loads analytics page with sections', async ({ page }) => {
    await registerAndLogin(page);
    await page.getByRole('link', { name: 'Analytics' }).click();
    await expect(page).toHaveURL('/analytics');

    await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
    await expect(page.getByText('Weekly Score')).toBeVisible();
    await expect(page.getByText('Consistency Trend')).toBeVisible();
    await expect(page.getByText('Completed vs Target')).toBeVisible();
  });

  test('shows habit breakdown after creating habits', async ({ page }) => {
    await registerAndLogin(page);

    // Create a habit first
    await page.getByRole('link', { name: 'Habits' }).click();
    await page.getByRole('button', { name: 'New Habit' }).click();
    await page.getByPlaceholder('e.g., Morning Yoga').fill('Study');
    await page.getByRole('button', { name: 'Save Habit' }).click();
    await expect(page.getByText('Study')).toBeVisible();

    // Go to analytics
    await page.getByRole('link', { name: 'Analytics' }).click();
    await expect(page).toHaveURL('/analytics');

    await expect(page.getByText('Habit Breakdown')).toBeVisible();
    await expect(page.getByText('Study')).toBeVisible();
  });
});
