const { expect } = require('@playwright/test');

const unique = () => `user_${Date.now()}@test.com`;

/**
 * Register a new user and end up on the dashboard.
 * Returns the email used.
 */
async function registerAndLogin(page) {
  const email = unique();
  await page.goto('/register');
  await page.getByPlaceholder('Your name').fill('E2E Tester');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••').fill('testpass123');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page).toHaveURL('/', { timeout: 10000 });
  return email;
}

module.exports = { registerAndLogin, unique };
