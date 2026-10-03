import { expect, test } from '@playwright/test';

import { ADVISOR_AUTH_FILE, switchScenario } from './helpers';

test.use({ storageState: ADVISOR_AUTH_FILE });

test('the advisor approves a submitted plan from the queue', async ({
  page,
  request,
}) => {
  await switchScenario(request, 'happy');

  await page.goto('/advisor');
  await expect(page.getByRole('heading', { name: 'Queue' })).toBeVisible();
  await expect(page.getByText('All (3)')).toBeVisible();

  await page.getByRole('button', { name: "Review Omar Fathi's plan" }).click();

  const drawer = page.getByRole('dialog', { name: 'Omar Fathi' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('CS 201')).toBeVisible();

  await drawer.getByRole('button', { name: 'Approve', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Approve plan?' })
    .getByRole('button', { name: 'Approve plan' })
    .click();

  await expect(drawer).toBeHidden();
  await expect(
    page.getByRole('button', { name: "Review Omar Fathi's plan" }),
  ).toBeHidden();
  await expect(page.getByText('All (2)')).toBeVisible();
});
