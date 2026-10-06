import { expect, test } from '@playwright/test';

import {
  ADMIN_AUTH_FILE,
  ADVISOR_AUTH_FILE,
  DEAN_AUTH_FILE,
  STUDENT_AUTH_FILE,
  VP_AUTH_FILE,
  login,
} from './helpers';

test('authenticate as the seeded student', async ({ page }) => {
  await login(page, 'student@ejust.edu.eg', '/app');
  const state = await page.context().storageState({ path: STUDENT_AUTH_FILE });
  expect(state.origins[0]?.localStorage).toEqual([
    { name: 'advaisor.token', value: 'advaisor-mock-1' },
  ]);
});

test('authenticate as the seeded advisor', async ({ page }) => {
  await login(page, 'advisor@ejust.edu.eg', '/advisor');
  const state = await page.context().storageState({ path: ADVISOR_AUTH_FILE });
  expect(state.origins[0]?.localStorage).toEqual([
    { name: 'advaisor.token', value: 'advaisor-mock-2' },
  ]);
});

test('authenticate as the seeded dean', async ({ page }) => {
  await login(page, 'dean@ejust.edu.eg', '/dean');
  await page.context().storageState({ path: DEAN_AUTH_FILE });
  await expect(
    page.getByRole('heading', { name: 'Faculty Overview' }),
  ).toBeVisible();
});

test('authenticate as the seeded vp', async ({ page }) => {
  await login(page, 'vp@ejust.edu.eg', '/vp');
  await page.context().storageState({ path: VP_AUTH_FILE });
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});

test('authenticate as the seeded admin', async ({ page }) => {
  await login(page, 'admin@ejust.edu.eg', '/admin');
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});
