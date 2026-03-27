const { test, expect } = require('@playwright/test');
const { registerAndLogin } = require('./helpers');

test.describe('Habits management', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.getByRole('link', { name: 'Habits' }).click();
    await expect(page).toHaveURL('/habits');
  });

  test('create a new habit', async ({ page }) => {
    await expect(page.getByText('Habit Ecosystem')).toBeVisible();

    await page.getByRole('button', { name: 'New Habit' }).click();
    await expect(page.getByText('Create Habit')).toBeVisible();
    await page.getByPlaceholder('e.g., Morning Yoga').fill('Read Books');
    await page.getByRole('button', { name: 'Save Habit' }).click();

    await expect(page.getByText('Read Books')).toBeVisible();
  });

  test('edit a habit', async ({ page }) => {
    // Create one first
    await page.getByRole('button', { name: 'New Habit' }).click();
    await page.getByPlaceholder('e.g., Morning Yoga').fill('Meditate');
    await page.getByRole('button', { name: 'Save Habit' }).click();
    await expect(page.getByText('Meditate')).toBeVisible();

    // Hover the habit card to reveal edit/delete buttons
    const habitCard = page.locator('.group').filter({ hasText: 'Meditate' }).first();
    await habitCard.hover();
    // Click the edit icon button
    await habitCard.locator('text=edit').first().click();

    await expect(page.getByText('Edit Habit')).toBeVisible();
    await page.getByPlaceholder('e.g., Morning Yoga').fill('Deep Meditation');
    await page.getByRole('button', { name: 'Update' }).click();

    await expect(page.getByText('Deep Meditation')).toBeVisible();
  });

  test('delete (archive) a habit', async ({ page }) => {
    // Create one first
    await page.getByRole('button', { name: 'New Habit' }).click();
    await page.getByPlaceholder('e.g., Morning Yoga').fill('Temporary Habit');
    await page.getByRole('button', { name: 'Save Habit' }).click();
    await expect(page.getByText('Temporary Habit')).toBeVisible();

    // Handle confirm dialog before triggering it
    page.on('dialog', (dialog) => dialog.accept());

    // Hover and click delete
    const habitCard = page.locator('.group').filter({ hasText: 'Temporary Habit' }).first();
    await habitCard.hover();
    await habitCard.locator('text=delete').first().click();

    // Habit should disappear
    await expect(page.getByText('Temporary Habit')).not.toBeVisible({ timeout: 5000 });
  });
});
