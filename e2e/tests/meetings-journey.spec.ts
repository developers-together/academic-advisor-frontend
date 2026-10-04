import { expect, test } from '@playwright/test';

import {
  ADVISOR_AUTH_FILE,
  STUDENT_AUTH_FILE,
  switchScenario,
} from './helpers';

test.use({ storageState: ADVISOR_AUTH_FILE });

test('the advisor confirms a student request from availability and cancels an invite', async ({
  page,
  request,
}) => {
  await switchScenario(request, 'happy');

  await page.goto('/advisor/meetings');
  await expect(page.getByRole('heading', { name: 'Meetings' })).toBeVisible();
  await expect(page.getByText('Needs action (2)')).toBeVisible();

  await page.getByRole('button', { name: 'Confirm time' }).first().click();

  const dialog = page.getByRole('dialog', {
    name: 'Confirm a time with Lina Majors',
  });
  await expect(dialog).toBeVisible();

  const slots = dialog.getByRole('radio');
  await expect(slots.first()).toBeVisible();
  await slots.first().click();
  await dialog.getByRole('button', { name: 'Confirm time' }).click();

  await expect(page.getByText('Scheduled (2)')).toBeVisible();
  await expect(page.getByText('Needs action (1)')).toBeVisible();

  await page.getByRole('tab', { name: /Scheduled/ }).click();
  await expect(page.getByText('Confirmed').first()).toBeVisible();

  await page.getByRole('tab', { name: /Needs action/ }).click();
  await page.getByRole('button', { name: 'Cancel meeting' }).click();

  const cancelDialog = page.getByRole('dialog', {
    name: 'Cancel this meeting?',
  });
  await expect(cancelDialog).toBeVisible();
  await cancelDialog.getByRole('button', { name: 'Cancel meeting' }).click();

  await expect(page.getByText('Needs action (0)')).toBeVisible();
});

test('the student sees the confirmed meeting and a new request reaches the advisor', async ({
  browser,
  request,
}) => {
  await switchScenario(request, 'happy');

  const advisorContext = await browser.newContext({
    storageState: ADVISOR_AUTH_FILE,
  });
  const advisorPage = await advisorContext.newPage();
  await advisorPage.goto('/advisor/meetings');
  await expect(
    advisorPage.getByRole('heading', { name: 'Meetings' }),
  ).toBeVisible();

  const studentContext = await browser.newContext({
    storageState: STUDENT_AUTH_FILE,
  });
  const studentPage = await studentContext.newPage();
  await studentPage.goto('/app/advisor');
  await expect(
    studentPage.getByRole('heading', { name: 'My Advisor' }),
  ).toBeVisible();
  await expect(studentPage.getByText('Confirmed').first()).toBeVisible();
  await expect(studentPage.getByText(/11 Oct 2026/).first()).toBeVisible();

  // The advisor frees the student by cancelling the open invite.
  await advisorPage
    .getByRole('button', { name: 'Cancel meeting' })
    .first()
    .click();
  const cancelDialog = advisorPage.getByRole('dialog', {
    name: 'Cancel this meeting?',
  });
  await cancelDialog.getByRole('button', { name: 'Cancel meeting' }).click();
  await expect(advisorPage.getByText('Needs action (1)')).toBeVisible();

  // The student frees their calendar by cancelling the confirmed meeting.
  await studentPage.reload();
  await studentPage.getByRole('button', { name: 'Cancel' }).click();
  const studentCancel = studentPage.getByRole('dialog', {
    name: 'Cancel this meeting?',
  });
  await studentCancel.getByRole('button', { name: 'Cancel meeting' }).click();
  await expect(
    studentPage.getByRole('button', { name: 'Request a meeting' }),
  ).toBeVisible({ timeout: 10000 });

  // The student then requests a meeting with a reason and a note.
  await studentPage.getByRole('button', { name: 'Request a meeting' }).click();
  const dialog = studentPage.getByRole('dialog', {
    name: 'Request a meeting with your advisor',
  });
  await dialog.getByLabel('Reason').selectOption('course_selection');
  await dialog.getByLabel('Add a note').fill('Which electives fit my plan?');
  await dialog.getByRole('button', { name: 'Send request' }).click();

  await expect(
    studentPage.getByText('Request sent to your advisor.'),
  ).toBeVisible();

  await advisorPage.reload();
  await expect(advisorPage.getByText('Needs action (2)')).toBeVisible();
  await expect(advisorPage.getByText('Sara Student')).toBeVisible();

  await advisorContext.close();
  await studentContext.close();
});
