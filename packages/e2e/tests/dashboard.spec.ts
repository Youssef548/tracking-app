import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('shows greeting and empty state', async ({ page }) => {
    await expect(page.getByText(/good (morning|afternoon|evening)/i)).toBeVisible();
    await expect(page.getByText("Today's Habits")).toBeVisible();
    // Empty state shows onboarding steps when no habits exist
    await expect(page.getByText('Get started in 3 steps')).toBeVisible();
  });

  test('shows habits after creation and allows toggling', async ({ page }) => {
    // Create a habit first via the habits page
    await page.getByRole('link', { name: 'Habits' }).first().click();
    await page.getByRole('button', { name: 'New Habit' }).first().click();
    await page.getByPlaceholder('e.g., Morning Yoga').fill('Morning Walk');
    await page.getByRole('button', { name: 'Save Habit' }).click();
    await expect(page.getByText('Morning Walk')).toBeVisible();

    // Go back to dashboard
    await page.getByRole('link', { name: 'Home' }).first().click();
    await expect(page).toHaveURL('/');

    // Habit card should appear
    await expect(page.getByText('Morning Walk')).toBeVisible();
    // The counter shows as "0/1" with "done" label
    await expect(page.getByText('0/1')).toBeVisible();

    // Toggle completion — click the toggle button
    const card = page.locator('div').filter({ hasText: 'Morning Walk' }).locator('button').last();
    await card.click();

    // Should show 1/1 completed
    await expect(page.getByText('1/1')).toBeVisible({ timeout: 5000 });
  });

  test('shows weekly score section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Weekly Score' })).toBeVisible();
  });
});
