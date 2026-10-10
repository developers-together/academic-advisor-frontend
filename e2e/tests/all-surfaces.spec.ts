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
    await expect(navigation).toBeHidden();
    await expect(expand).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('button', { name: 'Search', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'Home', exact: true }),
    ).toBeFocused();
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
    await expect(palette).toBeHidden();
    await expect(page).toHaveURL(/\/app\/chat$/);
  });
});

test.describe('Home and AI workspace redesign', () => {
  test.use({
    storageState: STUDENT_AUTH_FILE,
    viewport: { width: 390, height: 900 },
  });

  test('history restores focus and the first send dispatches exactly one turn', async ({
    page,
    request,
  }) => {
    await switchScenario(request, 'happy');
    let turns = 0;
    page.on('request', (entry) => {
      if (entry.method() === 'POST' && /\/turns$/.test(entry.url())) turns += 1;
    });
    await page.goto('/app/chat');
    const history = page.getByRole('button', {
      name: 'Conversation history',
      exact: true,
    });
    await expect(
      page
        .locator('#workspace-sidebar')
        .getByRole('button', { name: 'Conversation history', exact: true }),
    ).toHaveCount(0);
    await expect(
      page
        .locator('#main')
        .getByRole('button', { name: 'Conversation history', exact: true }),
    ).toBeVisible();
    await history.click();
    const drawer = page.getByRole('dialog', { name: 'Conversation history' });
    await expect(
      drawer.getByRole('link', { name: /Keeping my schedule steady/ }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(history).toBeFocused();
    const draft = 'Help me review my course load.';
    await page
      .getByRole('textbox', { name: 'Message your AI advisor' })
      .fill(draft);
    await page
      .getByRole('button', { name: 'Send message', exact: true })
      .click();
    await expect(page).toHaveURL(/\/app\/chat\/\d+$/);
    await expect(
      page.getByRole('textbox', { name: 'Message your AI advisor' }),
    ).toHaveValue('');
    await expect(
      page.getByRole('button', { name: 'Send message' }),
    ).toBeDisabled();
    await expect.poll(() => turns).toBe(1);
    await expect(page.getByText(draft, { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText(draft, { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Copy message' }).first(),
    ).toBeVisible();
    await history.click();
    await drawer
      .getByRole('link', { name: /Keeping my schedule steady/ })
      .click();
    await expect(drawer).toBeHidden();
    await expect(
      page.getByRole('textbox', { name: 'Message your AI advisor' }),
    ).toHaveValue('');
  });
});

test.describe('Student workspace corrections', () => {
  test.use({
    storageState: STUDENT_AUTH_FILE,
    viewport: { width: 1440, height: 900 },
  });

  test('a failed conversation import offers reload recovery', async ({
    page,
    request,
  }) => {
    await switchScenario(request, 'happy');
    await page.route('**/src/app/routes/app/conversation.tsx*', (route) =>
      route.abort(),
    );
    await page.goto('/app/chat/1');
    await expect(
      page.getByRole('heading', {
        name: 'This page could not open',
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText('Unexpected Application Error!')).toHaveCount(
      0,
    );
    await page.unroute('**/src/app/routes/app/conversation.tsx*');
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: 'Message your AI advisor' }),
    ).toBeVisible();
  });

  test('account controls, branding, manual planning, and map navigation remain usable', async ({
    page,
    request,
  }) => {
    await switchScenario(request, 'happy');
    await page.goto('/app/chat');
    await expect(page).toHaveTitle('AI Advisor | AI Advisor');
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      'href',
      '/ejust-logo.png',
    );
    await expect(page.getByRole('textbox')).toHaveCSS('resize', 'none');
    await expect(
      page.getByText('Review your message before sending.'),
    ).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Account menu', exact: true })
      .click();
    const settings = page.getByRole('menu').first();
    await expect(
      settings.getByRole('menuitem', { name: 'Sign out', exact: true }),
    ).toBeVisible();
    await expect(
      settings.getByRole('menuitem', { name: /Change language/ }),
    ).toBeVisible();
    await expect(settings.locator('.lucide-globe')).toHaveCount(1);
    await expect(
      settings.getByRole('menuitem', { name: 'Account', exact: true }),
    ).toBeVisible();
    await settings
      .getByRole('menuitem', { name: /Appearance/ })
      .press('ArrowRight');
    await page
      .getByRole('menuitemradio', { name: 'Dark', exact: true })
      .press('Enter');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(
      page.locator('#workspace-sidebar img[src="/ejust-logo.png"]'),
    ).toHaveCSS('filter', 'invert(1) hue-rotate(180deg)');
    await page
      .getByRole('button', { name: 'Account menu', exact: true })
      .click();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Account menu', exact: true }),
    ).toBeFocused();
    await page.goto('/app/plan');
    await page
      .getByRole('link', { name: 'Edit courses manually', exact: true })
      .click();
    await expect(page).toHaveURL(/\/app\/builder$/);
    await expect(page.getByRole('combobox')).toBeVisible();
    await page.goto('/app/record');
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    const canvas = page.locator('.course-map-canvas');
    await canvas.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        canvas.evaluate((element) => element.scrollWidth > element.clientWidth),
      )
      .toBe(true);
    await expect(canvas).toHaveAttribute('tabindex', '0');
    await canvas.focus();
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(() => canvas.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
    const before = await canvas.evaluate((element) => element.scrollLeft);
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Course map has no visible bounds');
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height - 15);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height - 15, {
      steps: 8,
    });
    await page.mouse.up();
    await expect
      .poll(() => canvas.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(before);
  });
});
