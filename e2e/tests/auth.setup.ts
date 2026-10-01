import { test as setup } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('University email').fill('student@ejust.edu.eg');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/app');

  await page.context().storageState({ path: authFile });
});
