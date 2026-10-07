import { expect, test } from '@playwright/test';

import { DEAN_AUTH_FILE, VP_AUTH_FILE, switchScenario } from './helpers';

test.describe('dean governance', () => {
  test.use({ storageState: DEAN_AUTH_FILE });

  test('the dean inspects advisor workload and analytics', async ({
    page,
    request,
  }) => {
    await switchScenario(request, 'happy');

    await page.goto('/dean/advisors');
    await expect(
      page.getByRole('heading', { name: 'Which advisors need attention?' }),
    ).toBeVisible();

    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    const rows = table.getByRole('row');
    await expect(rows.first()).toBeVisible();
    await expect(
      table.getByText('Engineering Applied A').first(),
    ).toBeVisible();

    await page.goto('/dean/analytics');
    await expect(
      page.getByRole('heading', {
        name: 'Where are trends heading in your area?',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Completion rate by term').first(),
    ).toBeVisible();
    await expect(
      page.getByText('Is advising performance in your area improving?'),
    ).toBeVisible();
  });
});

test.describe('vp governance', () => {
  test.use({ storageState: VP_AUTH_FILE });

  test('the vp compares faculties and trends without any advisor rows', async ({
    page,
    request,
  }) => {
    await switchScenario(request, 'happy');

    await page.goto('/vp/faculties');
    await expect(
      page.getByRole('heading', { name: 'How does each faculty perform?' }),
    ).toBeVisible();

    const table = page.getByRole('table');
    await expect(table.getByText('Engineering')).toBeVisible();
    await expect(table.getByText('Science')).toBeVisible();

    const headers = table.getByRole('columnheader');
    const headerTexts = await headers.allTextContents();
    expect(headerTexts.join(' ')).not.toMatch(/advisor/i);

    // The mock generates advisor names like "Hoda Hassan"; none may surface.
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toContain('Hoda');
    expect(bodyText).not.toContain('Samir');

    await page.goto('/vp/trends');
    await expect(
      page.getByRole('heading', {
        name: 'Which faculties move differently over time?',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Completion rate by faculty, by term').first(),
    ).toBeVisible();
  });
});
