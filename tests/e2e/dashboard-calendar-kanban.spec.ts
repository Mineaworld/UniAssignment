import { test, expect } from '@playwright/test';
import { hasE2EAuth, login, uniqueName } from './helpers/auth';

const formatDateValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

test.describe('dashboard/calendar/kanban', () => {
  test.skip(!hasE2EAuth, 'Missing E2E auth credentials');

  test('loads dashboard and calendar, then switches to kanban view', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard');
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();

    await page.goto('/dashboard/calendar');
    await expect(page.locator('h1', { hasText: 'Calendar' })).toBeVisible();

    await page.goto('/dashboard/assignments');
    await page.getByTestId('assignments-board-view-button').click();
    await expect(page.getByTestId('kanban-board')).toBeVisible();
  });

  test('opens calendar details from a desktop calendar item', async ({ page }) => {
    const subjectName = uniqueName('CalendarSubject');
    const assignmentName = uniqueName('CalendarAssignment');
    const dueDate = new Date();
    dueDate.setHours(9, 0, 0, 0);
    const dateValue = formatDateValue(dueDate);

    await page.setViewportSize({ width: 1280, height: 900 });

    await login(page);

    try {
      await page.goto('/dashboard/subjects');
      await page.getByTestId('add-subject-button').click();
      await page.getByTestId('subject-name-input').fill(subjectName);
      await page.getByTestId('subject-submit-button').click();
      await expect(page.getByTestId(/subject-row-/).filter({ hasText: subjectName }).first()).toBeVisible();

      await page.goto('/dashboard/assignments');
      await page.getByTestId('add-assignment-button').click();
      await page.getByTestId('assignment-title-input').fill(assignmentName);
      await page.getByTestId('assignment-subject-select').selectOption({ label: subjectName });
      await page.getByTestId('assignment-date-input').fill(dateValue);
      await page.getByTestId('assignment-time-input').fill('09:00');
      await page.getByTestId('assignment-submit-button').click();
      await expect(page.locator('tr', { hasText: assignmentName }).first()).toBeVisible();

      await page.goto('/dashboard/calendar');
      const desktopCalendarAssignment = page
        .locator('[data-testid^="calendar-assignment-desktop-"]', { hasText: assignmentName })
        .first();
      await expect(desktopCalendarAssignment).toBeVisible();
      await desktopCalendarAssignment.click();
      await expect(page.getByRole('heading', { name: 'Assignment Details' })).toBeVisible();
      await page.getByRole('button', { name: 'Close', exact: true }).last().click();
      await expect(page.getByRole('heading', { name: 'Assignment Details' })).toHaveCount(0);
    } finally {
      await page.goto('/dashboard/assignments');
      const createdAssignmentRow = page.locator('tr', { hasText: assignmentName }).first();
      if (await createdAssignmentRow.count()) {
        await createdAssignmentRow.locator('[data-testid^="assignment-delete-"]').click({ force: true });
        await page.getByTestId('delete-confirm-button').click();
      }

      await page.goto('/dashboard/subjects');
      const createdSubjectRow = page.getByTestId(/subject-row-/).filter({ hasText: subjectName }).first();
      if (await createdSubjectRow.count()) {
        await createdSubjectRow.locator('[data-testid^="subject-delete-"]').click({ force: true });
        await page.getByTestId('delete-confirm-button').click();
      }
    }
  });

  test.fixme('persists kanban drag updates in headless chromium', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await login(page);
    await page.goto('/dashboard/assignments');
    await page.getByTestId('assignments-board-view-button').click();
    await page.waitForTimeout(500);

    const pendingColumn = page.getByTestId('kanban-column-Pending');
    const inProgressColumn = page.getByTestId('kanban-column-In Progress');
    const inProgressDropzone = page.getByTestId('kanban-dropzone-In Progress');
    const pendingCards = pendingColumn.locator('[data-testid^="kanban-card-"]');
    const inProgressCards = inProgressColumn.locator('[data-testid^="kanban-card-"]');
    const pendingCountBefore = await pendingCards.count();
    const inProgressCountBefore = await inProgressCards.count();
    const kanbanCard = pendingCards.first();

    expect(pendingCountBefore).toBeGreaterThan(0);
    await expect(kanbanCard).toBeVisible();
    await kanbanCard.dragTo(inProgressDropzone, {
      sourcePosition: { x: 40, y: 30 },
      targetPosition: { x: 80, y: 12 },
    });
    await page.waitForTimeout(250);

    await expect(page.getByRole('heading', { name: 'Assignment Details' })).toHaveCount(0);
    await expect(pendingCards).toHaveCount(pendingCountBefore - 1);
    await expect(inProgressCards).toHaveCount(inProgressCountBefore + 1);

    await page.reload();
    await page.getByTestId('assignments-board-view-button').click();
    await expect(page.getByTestId('kanban-column-Pending').locator('[data-testid^="kanban-card-"]')).toHaveCount(pendingCountBefore - 1);
    await expect(page.getByTestId('kanban-column-In Progress').locator('[data-testid^="kanban-card-"]')).toHaveCount(inProgressCountBefore + 1);
  });
});
