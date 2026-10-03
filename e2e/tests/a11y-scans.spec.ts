import { expect, test } from '@playwright/test';

import { axeScan, formatViolations } from './axe';
import { switchScenario } from './helpers';

test('axe scan finds no violations on /app in the happy scenario', async ({
  page,
  request,
}) => {
  await switchScenario(request, 'happy');
  await page.goto('/app');
  await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
  const violations = await axeScan(page);
  expect(violations, formatViolations(violations)).toEqual([]);
});

test('axe scan finds no violations on /app in the empty scenario', async ({
  page,
  request,
}) => {
  await switchScenario(request, 'empty');
  await page.goto('/app');
  await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
  const violations = await axeScan(page);
  expect(violations, formatViolations(violations)).toEqual([]);
});

test('axe scan finds no violations on /app/plan in the error scenario', async ({
  page,
  request,
}) => {
  await switchScenario(request, 'error');
  await page.goto('/app/plan');
  await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
  const violations = await axeScan(page);
  expect(violations, formatViolations(violations)).toEqual([]);
});

test('axe scan finds no violations on /app/plan in the permission-denied scenario', async ({
  page,
  request,
}) => {
  await switchScenario(request, 'permission-denied');
  await page.goto('/app/plan');
  await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
  const violations = await axeScan(page);
  expect(violations, formatViolations(violations)).toEqual([]);
});

test('axe scan finds no violations on /app/plan in the stale-sis scenario', async ({
  page,
  request,
}) => {
  await switchScenario(request, 'stale-sis');
  await page.goto('/app/plan');
  await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
  const violations = await axeScan(page);
  expect(violations, formatViolations(violations)).toEqual([]);
});

test('axe scan finds no violations on /app/plan in the registration-closed scenario', async ({
  page,
  request,
}) => {
  await switchScenario(request, 'registration-closed');
  await page.goto('/app/plan');
  await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
  await page.getByRole('button', { name: 'Submit plan' }).click();
  await expect(
    page.getByText('Registration is closed', { exact: true }),
  ).toBeVisible();
  const violations = await axeScan(page);
  expect(violations, formatViolations(violations)).toEqual([]);
});
