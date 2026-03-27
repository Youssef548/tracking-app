const { test, expect } = require('@playwright/test');

const unique = () => `user_${Date.now()}@test.com`;

test.describe('Auth flows', () => {
  test('register a new account', async ({ page }) => {
    const email = unique();
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await page.getByPlaceholder('Your name').fill('E2E User');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••').fill('testpass123');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText(/good (morning|afternoon|evening)/i)).toBeVisible();
  });

  test('login with existing account', async ({ page }) => {
    const email = unique();

    // Register first
    await page.goto('/register');
    await page.getByPlaceholder('Your name').fill('Login User');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••').fill('testpass123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Logout
    await page.getByTitle('Logout').click();
    await expect(page).toHaveURL('/login');

    // Login
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText(/good (morning|afternoon|evening)/i)).toBeVisible();
  });

  test('show error for invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('input[type="email"]').fill('nonexistent@test.com');
    await page.locator('input[type="password"]').fill('wrongpass123');

    // Submit and wait for the API 401 response
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login'), { timeout: 10000 }),
      page.getByRole('button', { name: 'Sign In' }).click(),
    ]);

    expect(response.status()).toBe(401);

    // The axios interceptor redirects to /login on 401, so user stays on login page
    await expect(page).toHaveURL('/login', { timeout: 5000 });
    // Form should be visible again (page reloaded)
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL('/register');

    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
  });
});
