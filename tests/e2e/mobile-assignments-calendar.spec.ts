import { test, expect } from '@playwright/test';
import { hasE2EAuth, login, uniqueName } from './helpers/auth';

test.describe('mobile assignments/calendar @mobile @smoke', () => {
  test.skip(!hasE2EAuth, 'Missing E2E auth credentials');

  test('updates status inline and opens assignment details from the mobile calendar agenda', async ({ page }) => {
    const subjectName = uniqueName('MobileSubject');
    const assignmentName = uniqueName('MobileAssignment');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const dateValue = dueDate.toISOString().slice(0, 10);

    await login(page);

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
    const mobileStatusTrigger = mobileCard.getByTestId(/assignment-status-select-inline-/);
    await mobileStatusTrigger.click();
    await page.getByTestId(/assignment-status-select-inline-.*-Completed/).click();
    await expect(page.getByRole('heading', { name: 'Assignment Details' })).toHaveCount(0);
    await expect(mobileStatusTrigger).toContainText('Completed');

    await page.goto('/dashboard/calendar');
    await page.getByTestId(`calendar-day-mobile-${dateValue}`).click();
    await page.locator('[data-testid^="calendar-assignment-mobile-"]', { hasText: assignmentName }).first().click();

    await expect(page.getByRole('heading', { name: 'Assignment Details' })).toBeVisible();
  });
});
