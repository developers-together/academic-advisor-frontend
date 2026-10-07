import { expect, test } from '@playwright/test';

import {
  ADMIN_AUTH_FILE,
  DEAN_AUTH_FILE,
  STUDENT_AUTH_FILE,
  VP_AUTH_FILE,
  switchScenario,
} from './helpers';

type BaselinePage = {
  url: string;
  auth: string;
};

const PAGES: BaselinePage[] = [
  { url: '/app/account', auth: STUDENT_AUTH_FILE },
  { url: '/admin/users', auth: ADMIN_AUTH_FILE },
  { url: '/admin/operations', auth: ADMIN_AUTH_FILE },
  { url: '/dean/advisors', auth: DEAN_AUTH_FILE },
  { url: '/vp/faculties', auth: VP_AUTH_FILE },
];

const WIDTHS = [390, 768, 1024, 1440];

const snapshotName = (url: string, width: number, variant: string) =>
  `${url.replace(/\//g, '-')}-${width}-${variant}.png`;

for (const width of WIDTHS) {
  for (const { url, auth } of PAGES) {
    test.describe(`${url} light @ ${width}px`, () => {
      test.use({ storageState: auth, viewport: { width, height: 900 } });

      test('captures the light baseline', async ({ page, request }) => {
        await switchScenario(request, 'happy');
        await page.goto(url);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(
          () => document.querySelectorAll('.animate-pulse').length === 0,
          undefined,
          { timeout: 15000 },
        );
        await expect(page).toHaveScreenshot(snapshotName(url, width, 'light'), {
          fullPage: true,
          animations: 'disabled',
          maxDiffPixelRatio: 0.02,
        });
      });
    });
  }
}

for (const { url, auth } of PAGES) {
  test.describe(`${url} dark @ 1440px`, () => {
    test.use({ storageState: auth, viewport: { width: 1440, height: 900 } });

    test('captures the dark baseline', async ({ page, request }) => {
      await switchScenario(request, 'happy');
      await page.addInitScript(() => {
        window.localStorage.setItem('advaisor.theme', 'dark');
      });
      await page.goto(url);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(
        () => document.querySelectorAll('.animate-pulse').length === 0,
        undefined,
        { timeout: 15000 },
      );
      await expect(page).toHaveScreenshot(snapshotName(url, 1440, 'dark'), {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.02,
      });
    });
  });

  test.describe(`${url} arabic @ 1440px`, () => {
    test.use({ storageState: auth, viewport: { width: 1440, height: 900 } });

    test('captures the arabic baseline', async ({ page, request }) => {
      await switchScenario(request, 'happy');
      await page.addInitScript(() => {
        window.localStorage.setItem('advaisor.language', 'ar');
      });
      await page.goto(url);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(
        () => document.querySelectorAll('.animate-pulse').length === 0,
        undefined,
        { timeout: 15000 },
      );
      await expect(page).toHaveScreenshot(snapshotName(url, 1440, 'ar'), {
        fullPage: true,
        animations: 'disabled',
        maxDiffPixelRatio: 0.02,
      });
    });
  });
}
