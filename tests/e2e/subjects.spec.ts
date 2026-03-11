import { test, expect } from '@playwright/test';
import { hasE2EAuth, login, uniqueName } from './helpers/auth';

test.describe('subjects @smoke', () => {
  test.skip(!hasE2EAuth, 'Missing E2E auth credentials');

  test('creates, edits, and deletes a subject', async ({ page }) => {
    const subjectName = uniqueName('Subject');
    const updatedName = `${subjectName}-updated`;

    await login(page);
    await page.goto('/dashboard/subjects');

    await page.getByTestId('add-subject-button').click();
    await page.getByTestId('subject-name-input').fill(subjectName);
    await page.getByTestId('subject-submit-button').click();

    const createdRow = page.locator('tr', { hasText: subjectName }).first();
    await expect(createdRow).toBeVisible();
    await expect(createdRow).not.toContainText('Just now');

    await createdRow.hover();
    await createdRow.locator('[data-testid^="subject-edit-"]').click();
    await expect(page.getByText('Edit Subject')).toBeVisible();
    await page.getByTestId('subject-name-input').fill(updatedName);
    await page.getByTestId('subject-submit-button').click();

    const updatedRow = page.locator('tr', { hasText: updatedName }).first();
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).not.toContainText('Just now');

    await updatedRow.hover();
    await updatedRow.locator('[data-testid^="subject-delete-"]').click();
    await page.getByTestId('delete-confirm-button').click();

    await expect(page.locator('tr', { hasText: updatedName })).toHaveCount(0);
  });
});
