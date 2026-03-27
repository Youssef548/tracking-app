const { test, expect } = require('@playwright/test');
const { registerAndLogin } = require('./helpers');

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('shows greeting and empty state', async ({ page }) => {
    await expect(page.getByText(/good (morning|afternoon|evening)/i)).toBeVisible();
    await expect(page.getByText("Today's Habits")).toBeVisible();
    await expect(page.getByText(/no habits yet/i)).toBeVisible();
  });

  test('shows habits after creation and allows toggling', async ({ page }) => {
    // Create a habit first via the habits page
    await page.getByRole('link', { name: 'Habits' }).click();
    await page.getByRole('button', { name: 'New Habit' }).click();
    await page.getByPlaceholder('e.g., Morning Yoga').fill('Morning Walk');
    const saveBtn = page.getByRole('button', { name: 'Save Habit' });
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();
    await expect(page.getByText('Morning Walk')).toBeVisible();

    // Go back to dashboard
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL('/');

    // Habit card should appear
    await expect(page.getByText('Morning Walk')).toBeVisible();
    await expect(page.getByText(/0 of 1 completed/i)).toBeVisible();

    // Toggle completion — click the toggle button (the one with radio_button_unchecked icon)
    const card = page.locator('div').filter({ hasText: 'Morning Walk' }).locator('button').last();
    await card.click();

    // Should show 1 of 1 completed
    await expect(page.getByText(/1 of 1 completed/i)).toBeVisible({ timeout: 5000 });
  });

  test('shows weekly flow section', async ({ page }) => {
    await expect(page.getByText('Weekly Flow')).toBeVisible();
  });
});
