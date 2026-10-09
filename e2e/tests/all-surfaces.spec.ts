import { expect, test } from '@playwright/test';

import { routeTable } from '../../src/config/routes';

import { axeScan, formatViolations } from './axe';
import {
  ADMIN_AUTH_FILE,
  ADVISOR_AUTH_FILE,
  DEAN_AUTH_FILE,
  STUDENT_AUTH_FILE,
  VP_AUTH_FILE,
  switchScenario,
} from './helpers';

const roles = [
  { role: 'student', auth: STUDENT_AUTH_FILE },
  { role: 'advisor', auth: ADVISOR_AUTH_FILE },
  { role: 'dean', auth: DEAN_AUTH_FILE },
  { role: 'vp', auth: VP_AUTH_FILE },
  { role: 'admin', auth: ADMIN_AUTH_FILE },
] as const;

const variants = [
  { name: 'desktop light', width: 1440, theme: 'light', language: 'en' },
  { name: 'mobile light', width: 390, theme: 'light', language: 'en' },
  { name: 'desktop dark', width: 1440, theme: 'dark', language: 'en' },
  { name: 'mobile Arabic dark', width: 390, theme: 'dark', language: 'ar' },
] as const;

for (const { role, auth } of roles) {
  for (const variant of variants) {
    test.describe(`${role} ${variant.name}`, () => {
      test.use({
        storageState: auth,
        viewport: { width: variant.width, height: 900 },
      });
      test('every page renders without accessibility violations or overflow', async ({
        page,
        request,
      }, testInfo) => {
        test.setTimeout(120000);
        await switchScenario(request, 'happy');
        await page.addInitScript(({ theme, language }) => {
          localStorage.setItem(
            'advaisor.theme',
            JSON.stringify({ state: { theme }, version: 0 }),
          );
          localStorage.setItem(
            'advaisor.language',
            JSON.stringify({
              state: { language, languageTouched: true },
              version: 0,
            }),
          );
        }, variant);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const routes = routeTable.filter(
          (route) => route.role === role && route.kind === 'page',
        );
        for (const route of routes) {
          await test.step(route.path, async () => {
            const path = route.path.replace(':conversationId', '1');
            await page.goto(path);
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
            await expect(page.locator('html')).toHaveAttribute(
              'lang',
              variant.language,
            );
            await expect(page.locator('html')).toHaveAttribute(
              'dir',
              variant.language === 'ar' ? 'rtl' : 'ltr',
            );
            await expect(page.locator('html')).toHaveClass(
              variant.theme === 'dark' ? /dark/ : /^(?!.*dark).*$/,
            );
            await expect(page.locator('.animate-pulse')).toHaveCount(0);
            await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
            expect
              .soft(
                await page.evaluate(
                  () => document.documentElement.scrollWidth - innerWidth,
                ),
                path,
              )
              .toBeLessThanOrEqual(1);
            const violations = await axeScan(page);
            expect
              .soft(violations, `${path}: ${formatViolations(violations)}`)
              .toEqual([]);
            await page.screenshot({
              path: testInfo.outputPath(`${route.id}.png`),
              fullPage: true,
            });
          });
        }
      });
    });
  }
}

for (const variant of variants) {
  test.describe(`public ${variant.name}`, () => {
    test.use({
      storageState: { cookies: [], origins: [] },
      viewport: { width: variant.width, height: 900 },
    });
    test('authentication and missing pages remain usable', async ({ page }) => {
      test.setTimeout(60000);
      await page.addInitScript(({ theme, language }) => {
        localStorage.setItem(
          'advaisor.theme',
          JSON.stringify({ state: { theme }, version: 0 }),
        );
        localStorage.setItem(
          'advaisor.language',
          JSON.stringify({
            state: { language, languageTouched: true },
            version: 0,
          }),
        );
      }, variant);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const path of [
        '/login',
        '/signup',
        '/forgot-password',
        '/verify-email',
        '/missing-page',
      ]) {
        await test.step(path, async () => {
          await page.goto(path);
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
          await expect(page.locator('html')).toHaveAttribute(
            'lang',
            variant.language,
          );
          expect
            .soft(
              await page.evaluate(
                () => document.documentElement.scrollWidth - innerWidth,
              ),
              path,
            )
            .toBeLessThanOrEqual(1);
          const violations = await axeScan(page);
          expect
            .soft(violations, `${path}: ${formatViolations(violations)}`)
            .toEqual([]);
        });
      }
    });
  });
}

test.describe('sidebar and search keyboard regression', () => {
  test.use({
    storageState: STUDENT_AUTH_FILE,
    viewport: { width: 390, height: 900 },
  });
  test('mobile navigation contains focus and search closes without executing a command', async ({
    page,
    request,
  }) => {
    await switchScenario(request, 'happy');
    await page.goto('/app/chat');
    const expand = page.getByRole('button', { name: 'Expand sidebar' });
    await expand.click();
    const navigation = page.getByRole('dialog');
    await expect(navigation).toBeVisible();
    await expect(page.locator('#main')).toHaveAttribute('inert', '');
    for (let index = 0; index < 18; index += 1) {
      await page.keyboard.press('Tab');
      expect(
        await page.evaluate(() =>
          Boolean(document.activeElement?.closest('[role="dialog"]')),
        ),
      ).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(navigation).not.toBeVisible();
    await expect(expand).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('.nav-tooltip')).toHaveText('Home');
    await expect(page.locator('.nav-tooltip')).toBeVisible();
    await page.keyboard.press('Control+k');
    const palette = page.getByRole('dialog');
    await expect(page.getByRole('combobox')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      palette.getByRole('button', { name: 'Close', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(palette).not.toBeVisible();
    await expect(page).toHaveURL(/\/app\/chat$/);
  });
});
