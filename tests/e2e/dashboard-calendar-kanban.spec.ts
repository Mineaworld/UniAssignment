import { test, expect } from '@playwright/test';
import { hasE2EAuth, login } from './helpers/auth';

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
    await page.setViewportSize({ width: 1280, height: 900 });

    await login(page);

    await page.goto('/dashboard/calendar');
    const desktopCalendarAssignment = page.locator('[data-testid^="calendar-assignment-desktop-"]').first();
    await expect(desktopCalendarAssignment).toBeVisible();
    await desktopCalendarAssignment.click();
    await expect(page.getByRole('heading', { name: 'Assignment Details' })).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).last().click();
    await expect(page.getByRole('heading', { name: 'Assignment Details' })).toHaveCount(0);
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
