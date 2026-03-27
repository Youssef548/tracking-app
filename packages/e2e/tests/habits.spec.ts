import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

test.describe('Habits management', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.getByRole('link', { name: 'Habits' }).first().click();
    await expect(page).toHaveURL('/habits');
  });

  test('create a new habit', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Your Habits' })).toBeVisible();

    await page.getByRole('button', { name: 'New Habit' }).first().click();
    await expect(page.getByText('Create Habit')).toBeVisible();
    await page.getByPlaceholder('e.g., Morning Yoga').fill('Read Books');
    await page.getByRole('button', { name: 'Save Habit' }).click();

    await expect(page.getByText('Read Books')).toBeVisible();
  });

  test('edit a habit', async ({ page }) => {
    // Create one first
    await page.getByRole('button', { name: 'New Habit' }).first().click();
    await page.getByPlaceholder('e.g., Morning Yoga').fill('Meditate');
    await page.getByRole('button', { name: 'Save Habit' }).click();
    await expect(page.getByText('Meditate')).toBeVisible();

    // Hover the habit card to reveal edit/delete buttons
    const habitCard = page.locator('.group').filter({ hasText: 'Meditate' }).first();
    await habitCard.hover();
    // Click the edit button (aria-label)
    await habitCard.getByRole('button', { name: /edit meditate/i }).click();

    await expect(page.getByText('Edit Habit')).toBeVisible();
    await page.getByPlaceholder('e.g., Morning Yoga').fill('Deep Meditation');
    await page.getByRole('button', { name: 'Update' }).click();

    await expect(page.getByText('Deep Meditation')).toBeVisible();
  });

  test('delete (archive) a habit', async ({ page }) => {
    // Create one first
    await page.getByRole('button', { name: 'New Habit' }).first().click();
    await page.getByPlaceholder('e.g., Morning Yoga').fill('Temporary Habit');
    await page.getByRole('button', { name: 'Save Habit' }).click();
    await expect(page.getByText('Temporary Habit')).toBeVisible();

    // Hover and click archive/delete button
    const habitCard = page.locator('.group').filter({ hasText: 'Temporary Habit' }).first();
    await habitCard.hover();
    await habitCard.getByRole('button', { name: /archive temporary habit/i }).click();

    // Inline confirm dialog — click Archive
    const confirmDialog = page.getByRole('alertdialog');
    await expect(confirmDialog.getByRole('heading', { name: 'Archive habit?' })).toBeVisible();
    await confirmDialog.getByRole('button', { name: 'Archive' }).click();

    // Habit should disappear
    await expect(page.getByText('Temporary Habit')).not.toBeVisible({ timeout: 5000 });
  });
});
