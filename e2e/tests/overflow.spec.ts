import { expect, test } from '@playwright/test';

import {
  ADMIN_AUTH_FILE,
  ADVISOR_AUTH_FILE,
  STUDENT_AUTH_FILE,
  switchScenario,
} from './helpers';

const PAGES = [
  { url: '/app', auth: STUDENT_AUTH_FILE },
  { url: '/app/plan', auth: STUDENT_AUTH_FILE },
  { url: '/app/record', auth: STUDENT_AUTH_FILE },
  { url: '/advisor', auth: ADVISOR_AUTH_FILE },
  { url: '/admin/users', auth: ADMIN_AUTH_FILE },
];

const WIDTHS = [390, 1440];

for (const width of WIDTHS) {
  for (const { url, auth } of PAGES) {
    test.describe(`${url} @ ${width}px`, () => {
      test.use({ storageState: auth, viewport: { width, height: 900 } });

      test('no horizontal viewport overflow', async ({ page, request }) => {
        await switchScenario(request, 'happy');
        await page.goto(url);
        await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(
          overflow,
          `${url} overflows horizontally at ${width}px`,
        ).toBeLessThanOrEqual(1);
      });
    });
  }
}
