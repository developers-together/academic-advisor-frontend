import { expect, test } from '@playwright/test';

import { axeScan, formatViolations } from './axe';
import {
  ADMIN_AUTH_FILE,
  ADVISOR_AUTH_FILE,
  DEAN_AUTH_FILE,
  VP_AUTH_FILE,
  switchScenario,
} from './helpers';

test.describe('advisor queue scan', () => {
  test.use({ storageState: ADVISOR_AUTH_FILE });

  test('axe scan finds no violations on /advisor in the happy scenario', async ({
    page,
    request,
  }) => {
    await switchScenario(request, 'happy');
    await page.goto('/advisor');
    await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
    const violations = await axeScan(page);
    expect(violations, formatViolations(violations)).toEqual([]);
  });
});

test.describe('dean advisors scan', () => {
  test.use({ storageState: DEAN_AUTH_FILE });

  test('axe scan finds no violations on /dean/advisors in the happy scenario', async ({
    page,
    request,
  }) => {
    await switchScenario(request, 'happy');
    await page.goto('/dean/advisors');
    await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
    const violations = await axeScan(page);
    expect(violations, formatViolations(violations)).toEqual([]);
  });
});

test.describe('vp faculties scan', () => {
  test.use({ storageState: VP_AUTH_FILE });

  test('axe scan finds no violations on /vp/faculties in the happy scenario', async ({
    page,
    request,
  }) => {
    await switchScenario(request, 'happy');
    await page.goto('/vp/faculties');
    await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
    const violations = await axeScan(page);
    expect(violations, formatViolations(violations)).toEqual([]);
  });
});

test.describe('admin users scan', () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test('axe scan finds no violations on /admin/users in the happy scenario', async ({
    page,
    request,
  }) => {
    await switchScenario(request, 'happy');
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
    const violations = await axeScan(page);
    expect(violations, formatViolations(violations)).toEqual([]);
  });
});
