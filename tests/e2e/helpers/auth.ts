import { expect, type Page } from '@playwright/test';

export const hasE2EAuth = Boolean(
  process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD
);

export const uniqueName = (prefix: string): string => {
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${Date.now()}-${random}`;
};

export const login = async (page: Page): Promise<void> => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('Missing E2E_TEST_EMAIL or E2E_TEST_PASSWORD');
  }

  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
};

export const logout = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: /Log Out/i }).click();
  await expect(page).toHaveURL(/\/login/);
};
