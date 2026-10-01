import { expect, test } from '@playwright/test';

import { seedScenario } from './helpers';

test.describe('student smoke journey', () => {
  test('shows the term plan on the dashboard', async ({ page }) => {
    await seedScenario(page, 'happy');
    await page.goto('/app');
    await expect(
      page.getByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
    await expect(page.getByText('2 courses planned')).toBeVisible();
  });

  test('shows the empty state without a plan', async ({ page }) => {
    await seedScenario(page, 'empty');
    await page.goto('/app');
    await expect(page.getByText('No plan for this term yet.')).toBeVisible();
  });
});
