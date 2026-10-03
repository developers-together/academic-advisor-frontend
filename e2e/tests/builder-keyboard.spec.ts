import { expect, test } from '@playwright/test';

import { focusByKeyboard, switchScenario } from './helpers';

test('the plan builder runs add to submit from the keyboard', async ({
  page,
  request,
}) => {
  await switchScenario(request, 'happy');

  await page.goto('/app/builder');
  await expect(
    page.getByRole('heading', { name: 'Plan Builder' }),
  ).toBeVisible();

  const picker = page.getByRole('combobox', { name: 'Add a course' });
  await focusByKeyboard(page, picker);

  await picker.pressSequentially('CS 101');
  const option = page.getByRole('option', { name: /CS 101/ });
  await option.waitFor();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Remove CS 101' }),
  ).toBeVisible();

  const submit = page.getByRole('button', { name: 'Submit plan' });
  await focusByKeyboard(page, submit);
  await page.keyboard.press('Enter');

  await expect(page.getByText('This plan is Submitted.')).toBeVisible();
});
