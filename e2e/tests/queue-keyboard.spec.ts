import { expect, test } from '@playwright/test';

import { ADVISOR_AUTH_FILE, focusByKeyboard, switchScenario } from './helpers';

test.use({ storageState: ADVISOR_AUTH_FILE });

test('the queue opens the review drawer and returns focus to the row', async ({
  page,
  request,
}) => {
  await switchScenario(request, 'happy');

  await page.goto('/advisor');
  await expect(page.getByRole('heading', { name: 'Queue' })).toBeVisible();

  const row = page.getByRole('button', { name: "Review Omar Fathi's plan" });
  await focusByKeyboard(page, row);

  await page.keyboard.press('Enter');
  const drawer = page.getByRole('dialog', { name: 'Omar Fathi' });
  await expect(drawer).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    )
    .toBe(true);

  for (let tabs = 0; tabs < 25; tabs += 1) {
    await page.keyboard.press('Tab');
  }
  expect(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest('[role="dialog"]')),
    ),
  ).toBe(true);

  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(row).toBeFocused();
});
