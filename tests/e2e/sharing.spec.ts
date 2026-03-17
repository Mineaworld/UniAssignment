import { test, expect } from '@playwright/test';
import { hasE2EAuth, login, uniqueName } from './helpers/auth';

test.describe('sharing', () => {
  test.skip(!hasE2EAuth, 'Missing E2E auth credentials');

  test('shares a single assignment and shows it for a joined member', async ({ browser, baseURL }) => {
    test.setTimeout(180000);

    if (!baseURL) {
      throw new Error('Missing Playwright baseURL');
    }

    const ownerContext = await browser.newContext();
    const memberContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    const memberPage = await memberContext.newPage();

    const subjectName = uniqueName('ShareSubject');
    const assignmentName = uniqueName('ShareAssignment');
    const memberEmail = `share-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
    const memberPassword = 'Password123!';
    const memberName = uniqueName('ShareMember');

    try {
      await login(ownerPage);

      await ownerPage.goto('/dashboard/subjects');
      await ownerPage.getByTestId('add-subject-button').click();
      await ownerPage.getByTestId('subject-name-input').fill(subjectName);
      await ownerPage.getByTestId('subject-submit-button').click();
      await expect(ownerPage.getByTestId(/subject-row-/).filter({ hasText: subjectName }).first()).toBeVisible({ timeout: 30000 });

      await ownerPage.goto('/dashboard/assignments');
      await ownerPage.getByTestId('add-assignment-button').click();
      await ownerPage.getByTestId('assignment-title-input').fill(assignmentName);
      await ownerPage.getByTestId('assignment-subject-select').selectOption({ label: subjectName });
      await ownerPage.getByTestId('assignment-date-input').fill('2027-02-10');
      await ownerPage.getByTestId('assignment-time-input').fill('10:00');
      await ownerPage.getByTestId('assignment-submit-button').click();

      const ownerAssignmentRow = ownerPage.locator('tr', { hasText: assignmentName }).first();
      await expect(ownerAssignmentRow).toBeVisible({ timeout: 30000 });

      if (await ownerPage.getByRole('heading', { name: 'Create New Assignment' }).isVisible().catch(() => false)) {
        await ownerPage.getByRole('button', { name: 'Cancel' }).click({ force: true });
        await expect(ownerPage.getByRole('heading', { name: 'Create New Assignment' })).toBeHidden({ timeout: 10000 });
      }

      await ownerPage.getByPlaceholder('Search...').fill(assignmentName);
      await ownerAssignmentRow.scrollIntoViewIfNeeded();
      await ownerAssignmentRow.click();
      await expect(ownerPage.getByRole('heading', { name: 'Assignment Details' })).toBeVisible({ timeout: 10000 });
      await ownerPage.getByTestId('assignment-share-button').click();
      await ownerPage.getByTestId('share-create-link-button').click();
      await expect(ownerPage.getByText('Invite link ready')).toBeVisible({ timeout: 20000 });
      const shareLink = (await ownerPage.getByTestId('share-active-link').textContent())?.trim();
      expect(shareLink).toContain('/join/');

      await memberPage.goto(String(shareLink));
      await expect(memberPage).toHaveURL(/\/login/);
      await memberPage.getByRole('link', { name: /Create an account/i }).click();
      await memberPage.getByLabel('Full Name').fill(memberName);
      await memberPage.getByLabel('Email').fill(memberEmail);
      await memberPage.getByLabel('Password').fill(memberPassword);
      await memberPage.getByRole('button', { name: /^Next$/ }).click();
      await memberPage.getByLabel('Major / Focus').fill('QA');
      await memberPage.getByRole('button', { name: 'Create Account' }).click();

      await expect(memberPage).toHaveURL(/\/dashboard\/assignments/, { timeout: 60000 });
      await expect(
        memberPage.getByRole('alert').filter({ hasText: 'Shared assignment added to your workspace.' }).last()
      ).toBeVisible({ timeout: 60000 });
      await expect(memberPage.getByRole('heading', { name: 'Assignment Details' })).toBeVisible({ timeout: 60000 });
      await expect(memberPage.getByText('Shared assignment', { exact: true })).toBeVisible({ timeout: 60000 });
      await memberPage.getByRole('button', { name: /^Close$/ }).last().click();

      const memberAssignmentRow = memberPage.locator('tr', { hasText: assignmentName }).first();
      await expect(memberAssignmentRow).toBeVisible({ timeout: 60000 });
      await expect(memberAssignmentRow).toContainText(subjectName);
      await expect(memberAssignmentRow).toContainText('Shared');
    } finally {
      await ownerContext.close();
      await memberContext.close();
    }
  });
});
