import { expect, test } from '@playwright/test';

import { ADVISOR_AUTH_FILE, STUDENT_AUTH_FILE, login } from './helpers';

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
