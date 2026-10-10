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

  await page.getByRole('button', { name: 'Remove MATH 201' }).click();
  await expect(
    page.getByRole('button', { name: 'Remove MATH 201' }),
  ).toBeHidden();

  const search = page.getByRole('textbox', { name: 'Add a course' });
  await focusByKeyboard(page, search);

  await search.pressSequentially('MATH 201');
  const add = page.getByRole('button', { name: 'Add MATH 201 to plan' });
  await add.waitFor();
  await focusByKeyboard(page, add);
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('button', { name: 'Remove MATH 201' }),
  ).toBeVisible();

  const submit = page.getByRole('button', { name: 'Submit plan' });
  await focusByKeyboard(page, submit);
  await page.keyboard.press('Enter');

  await expect(page.getByText('This plan is Submitted.')).toBeVisible();
});
