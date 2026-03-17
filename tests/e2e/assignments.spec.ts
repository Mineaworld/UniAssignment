import { test, expect } from '@playwright/test';
import { hasE2EAuth, login, uniqueName } from './helpers/auth';

test.describe('assignments @smoke', () => {
  test.skip(!hasE2EAuth, 'Missing E2E auth credentials');

  test('creates, updates status inline, and deletes an assignment', async ({ page }) => {
    const subjectName = uniqueName('Subject');
    const assignmentName = uniqueName('Assignment');

    await login(page);

    await page.goto('/dashboard/subjects');
    await page.getByTestId('add-subject-button').click();
    await page.getByTestId('subject-name-input').fill(subjectName);
    await page.getByTestId('subject-submit-button').click();

    const createdSubjectRow = page.getByTestId(/subject-row-/).filter({ hasText: subjectName }).first();
    await expect(createdSubjectRow).toBeVisible({ timeout: 30000 });

    await page.goto('/dashboard/assignments');
    await page.getByTestId('add-assignment-button').click();

    await page.getByTestId('assignment-title-input').fill(assignmentName);
    await expect(page.getByTestId('assignment-subject-select').locator('option', { hasText: subjectName })).toHaveCount(1);
    await page.getByTestId('assignment-subject-select').selectOption({ label: subjectName });
    await page.getByTestId('assignment-status-select').selectOption('In Progress');
    await page.getByTestId('assignment-date-input').fill('2026-12-30');
    await page.getByTestId('assignment-time-input').fill('09:30');
    await page.getByTestId('assignment-submit-button').click();

    const createdRow = page.locator('tr', { hasText: assignmentName }).first();
    await expect(createdRow).toBeVisible({ timeout: 30000 });

    if (await page.getByRole('heading', { name: 'Create New Assignment' }).isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'Cancel' }).click({ force: true });
      await expect(page.getByRole('heading', { name: 'Create New Assignment' })).toBeHidden({ timeout: 10000 });
    }

    const inlineStatusTrigger = createdRow.locator('button[aria-haspopup="listbox"][data-testid^="assignment-status-select-inline-"]');
    await inlineStatusTrigger.click();
    await page.getByTestId(/assignment-status-select-inline-.*-Completed/).click();
    await expect(page.getByRole('heading', { name: 'Assignment Details' })).toHaveCount(0);
    await expect(inlineStatusTrigger).toContainText('Completed', { timeout: 30000 });

    await createdRow.locator('[data-testid^="assignment-delete-"]').click({ force: true });
    await page.getByTestId('delete-confirm-button').click();

    await expect(page.locator('tr', { hasText: assignmentName })).toHaveCount(0);
  });
});
