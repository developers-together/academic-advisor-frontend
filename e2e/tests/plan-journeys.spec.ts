import { expect, test } from '@playwright/test';

import { APP_URL, STUDENT_AUTH_FILE, switchScenario } from './helpers';

test('J1: the student builds and submits a plan', async ({ page, request }) => {
  await switchScenario(request, 'happy');

  await page.goto('/app');
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.getByText('Not submitted yet.')).toBeVisible();

  await page.getByRole('link', { name: 'Resume in builder' }).click();
  await expect(
    page.getByRole('heading', { name: 'Plan Builder' }),
  ).toBeVisible();

  const picker = page.getByRole('combobox', { name: 'Add a course' });
  await picker.click();
  await picker.fill('CS 101');
  const option = page.getByRole('option', { name: /CS 101/ });
  await option.waitFor();
  await option.click();
  await expect(
    page.getByRole('button', { name: 'Remove CS 101' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Submit plan' }).click();
  await expect(page.getByText('This plan is Submitted.')).toBeVisible();

  await page.goto('/app');
  await expect(page.getByText('Waiting for your advisor.')).toBeVisible();
});

test('J2: the advisor returns the plan, the student presses Seen and resubmits', async ({
  browser,
  request,
}) => {
  await switchScenario(request, 'happy');

  const returnReason =
    'MATH 201 sits outside your course map for this level. Swap it for an eligible course.';

  const studentContext = await browser.newContext({
    baseURL: APP_URL,
    storageState: STUDENT_AUTH_FILE,
  });
  const advisorContext = await browser.newContext({
    baseURL: APP_URL,
    storageState: 'e2e/.auth/advisor.json',
  });

  const studentPage = await studentContext.newPage();
  await studentPage.goto('/app/builder');
  await studentPage.getByRole('button', { name: 'Submit plan' }).click();
  await expect(studentPage.getByText('This plan is Submitted.')).toBeVisible();

  const advisorPage = await advisorContext.newPage();
  await advisorPage.goto('/advisor');
  await expect(
    advisorPage.getByRole('heading', { name: 'Queue' }),
  ).toBeVisible();
  await advisorPage
    .getByRole('button', { name: "Review Sara Student's plan" })
    .click();

  const drawer = advisorPage.getByRole('dialog', { name: 'Sara Student' });
  await expect(drawer).toBeVisible();
  await drawer.getByPlaceholder('Write the return reason').fill(returnReason);
  await drawer.getByRole('button', { name: 'Return plan' }).click();
  await advisorPage
    .getByRole('dialog', { name: 'Return plan?' })
    .getByRole('button', { name: 'Return plan' })
    .click();
  await expect(drawer).toBeHidden();

  await studentPage.goto('/app/plan');
  await expect(studentPage.getByRole('button', { name: 'Seen' })).toBeVisible();
  await expect(studentPage.getByText(returnReason).first()).toBeVisible();

  await studentPage.getByRole('button', { name: 'Seen', exact: true }).click();
  await studentPage
    .getByRole('dialog', { name: 'Mark feedback as seen?' })
    .getByRole('button', { name: 'Seen' })
    .click();
  await expect(
    studentPage.getByRole('button', { name: 'Submit plan' }),
  ).toBeVisible();

  await studentPage.goto('/app/builder');
  await studentPage.getByRole('button', { name: 'Remove MATH 201' }).click();
  await expect(
    studentPage.getByRole('button', { name: 'Remove MATH 201' }),
  ).toBeHidden();

  await studentPage.getByRole('button', { name: 'Submit plan' }).click();
  await expect(studentPage.getByText('This plan is Submitted.')).toBeVisible();

  await studentPage.goto('/app');
  await expect(
    studentPage.getByText('Waiting for your advisor.'),
  ).toBeVisible();

  await studentContext.close();
  await advisorContext.close();
});
