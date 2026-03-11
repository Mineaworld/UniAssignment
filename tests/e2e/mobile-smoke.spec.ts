import { test, expect } from '@playwright/test';

test.describe('mobile smoke @smoke @mobile', () => {
  test('renders auth pages on mobile viewport', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  });
});
