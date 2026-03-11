import { test, expect } from '@playwright/test';
import { hasE2EAuth, login, uniqueName } from './helpers/auth';

const formatDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

test.describe('mobile assignments/calendar @mobile @smoke', () => {
  test.skip(!hasE2EAuth, 'Missing E2E auth credentials');

  test('updates status inline and opens assignment details from the mobile calendar agenda', async ({ page }) => {
    const subjectName = uniqueName('MobileSubject');
    const assignmentName = uniqueName('MobileAssignment');
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const targetDay = Math.min(today.getDate() + 1, lastDayOfMonth);
    const dueDate = new Date(today.getFullYear(), today.getMonth(), targetDay, 9, 0, 0, 0);
    const dateValue = formatDateValue(dueDate);

    await login(page);

    try {
      await page.goto('/dashboard/subjects');
      await page.getByTestId('add-subject-button').click();
      await page.getByTestId('subject-name-input').fill(subjectName);
      await page.getByTestId('subject-submit-button').click();
      await expect(page.locator('h3', { hasText: subjectName }).first()).toBeVisible();

      await page.goto('/dashboard/assignments');
      await page.getByTestId('add-assignment-button').click();
      await page.getByTestId('assignment-title-input').fill(assignmentName);
      await expect(page.getByTestId('assignment-subject-select').locator('option', { hasText: subjectName })).toHaveCount(1);
      await page.getByTestId('assignment-subject-select').selectOption({ label: subjectName });
      await page.getByTestId('assignment-date-input').fill(dateValue);
      await page.getByTestId('assignment-time-input').fill('09:00');
      await page.getByTestId('assignment-submit-button').click();

      await page.getByPlaceholder('Search...').fill(assignmentName);
      const mobileCard = page.locator('[data-testid^="assignment-mobile-card-"]', { hasText: assignmentName }).first();
      await expect(mobileCard).toBeVisible();
      const mobileStatusTrigger = mobileCard.locator('button[aria-haspopup="listbox"][data-testid^="assignment-status-select-inline-"]');
      await mobileStatusTrigger.click();
      await page.getByTestId(/assignment-status-select-inline-.*-Completed/).click();
      await expect(page.getByRole('heading', { name: 'Assignment Details' })).toHaveCount(0);
      await expect(mobileStatusTrigger).toContainText('Completed');

      await page.goto('/dashboard/calendar');
      await page.getByTestId(`calendar-day-mobile-${dateValue}`).click();
      await page.locator('[data-testid^="calendar-assignment-mobile-"]', { hasText: assignmentName }).first().click();

      await expect(page.getByRole('heading', { name: 'Assignment Details' })).toBeVisible();
    } finally {
      await page.goto('/dashboard/assignments');
      await page.getByPlaceholder('Search...').fill(assignmentName);
      const createdAssignmentCard = page.locator('[data-testid^="assignment-mobile-card-"]', { hasText: assignmentName }).first();
      if (await createdAssignmentCard.count()) {
        await createdAssignmentCard.getByRole('button', { name: new RegExp(`Assignment actions for .*${assignmentName}`, 'i') }).click();
        await createdAssignmentCard.getByRole('button', { name: new RegExp(`Delete .*${assignmentName}`, 'i') }).click();
        await page.getByTestId('delete-confirm-button').click();
      }

      await page.goto('/dashboard/subjects');
      const createdSubjectCard = page.locator('[data-testid^="subject-mobile-card-"]', { hasText: subjectName }).first();
      if (await createdSubjectCard.count()) {
        await createdSubjectCard.getByRole('button', { name: new RegExp(`Delete .*${subjectName}`, 'i') }).click();
        await page.getByTestId('delete-confirm-button').click();
      }
    }
  });
});
