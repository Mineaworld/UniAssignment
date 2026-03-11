import { test, expect } from '@playwright/test';
import { hasE2EAuth, login, logout } from './helpers/auth';

test.describe('auth @smoke', () => {
  test.skip(!hasE2EAuth, 'Missing E2E auth credentials');

  test('logs in and logs out with email/password', async ({ page }) => {
    await login(page);

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await logout(page);

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });
});
