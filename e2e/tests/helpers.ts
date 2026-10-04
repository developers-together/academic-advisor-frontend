import {
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from '@playwright/test';

export const MOCK_API_URL = 'http://localhost:8080/api';
export const APP_URL = 'http://127.0.0.1:3100';

export const STUDENT_AUTH_FILE = 'e2e/.auth/student.json';
export const ADVISOR_AUTH_FILE = 'e2e/.auth/advisor.json';
export const DEAN_AUTH_FILE = 'e2e/.auth/dean.json';
export const VP_AUTH_FILE = 'e2e/.auth/vp.json';
export const ADMIN_AUTH_FILE = 'e2e/.auth/admin.json';

export type Scenario =
  | 'happy'
  | 'empty'
  | 'error'
  | 'permission-denied'
  | 'stale-sis'
  | 'registration-closed'
  | 'quota-exhausted'
  | 'import-errors'
  | 'binding-incomplete';

export const switchScenario = async (
  request: APIRequestContext,
  scenario: Scenario,
) => {
  const response = await request.post(`${MOCK_API_URL}/__mocks/scenario`, {
    data: { name: scenario },
  });
  if (!response.ok()) {
    throw new Error(
      `Scenario switch to "${scenario}" failed with ${response.status()}`,
    );
  }
};

export const login = async (page: Page, email: string, waitFor: string) => {
  await page.goto('/login');
  await page.getByLabel('University email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(waitFor);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('advaisor.token')))
    .toBeTruthy();
};

export const focusByKeyboard = async (page: Page, target: Locator) => {
  for (let tabs = 0; tabs < 60; tabs += 1) {
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      return;
    }
    await page.keyboard.press('Tab');
  }
  throw new Error('Keyboard focus never reached the target element');
};
