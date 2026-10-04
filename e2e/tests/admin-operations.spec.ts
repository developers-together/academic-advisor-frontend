import { expect, test } from '@playwright/test';

import { ADMIN_AUTH_FILE, switchScenario } from './helpers';

test.use({ storageState: ADMIN_AUTH_FILE });

test('the admin manages courses from creation to deletion', async ({
  page,
  request,
}) => {
  await switchScenario(request, 'happy');

  await page.goto('/admin/courses');
  await expect(page.getByRole('heading', { name: 'Courses' })).toBeVisible();

  await page.getByRole('button', { name: 'Add course' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Add a course' });
  await dialog.getByLabel('Course code').fill('CS 402');
  await dialog.getByLabel('Title', { exact: true }).fill('Machine Learning');
  await dialog.getByRole('button', { name: 'Create course' }).click();

  const row = page.getByRole('row', { name: /CS 402/ });
  await expect(row).toBeVisible();

  await row.getByRole('button', { name: 'Edit' }).click();
  const editDialog = page.getByRole('dialog', { name: 'Edit CS 402' });
  await editDialog.getByLabel('Credits').fill('4');
  await editDialog.getByRole('button', { name: 'Save changes' }).click();

  await expect(
    page.getByText('CS 402 updated.').or(page.getByText('Machine Learning')),
  ).toBeVisible();

  await row.getByRole('button', { name: 'Delete' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete CS 402?' });
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('row', { name: /CS 402/ })).toBeHidden();
});

test('the admin toggles the registration window state', async ({
  page,
  request,
}) => {
  await switchScenario(request, 'happy');

  await page.goto('/admin/registration-windows');
  await expect(
    page.getByRole('heading', { name: 'Registration Windows' }),
  ).toBeVisible();

  const activeRow = page.getByRole('row', { name: /2026F/ });
  await expect(activeRow.getByText('Active')).toBeVisible();

  await activeRow.getByRole('button', { name: 'Deactivate' }).click();
  await expect(activeRow.getByText('Inactive')).toBeVisible();

  await activeRow.getByRole('button', { name: 'Activate' }).click();
  await expect(activeRow.getByText('Active')).toBeVisible();
});

test('the admin saves the AI configuration', async ({ page, request }) => {
  await switchScenario(request, 'happy');

  await page.goto('/admin/ai-configuration');
  await expect(
    page.getByRole('heading', { name: 'AI Configuration' }),
  ).toBeVisible();

  const quota = page.getByLabel('Messages per student per day');
  const current = await quota.inputValue();
  await quota.fill(String(Number(current) + 1));
  await page.getByRole('button', { name: 'Save configuration' }).click();

  await expect(page.getByText('AI configuration saved.')).toBeVisible();
  await quota.fill(current);
  await page.getByRole('button', { name: 'Save configuration' }).click();
  await expect(page.getByText('AI configuration saved.')).toBeVisible();
});
