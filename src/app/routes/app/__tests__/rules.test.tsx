import { render as rtlRender, within } from '@testing-library/react';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import StudentRulesRoute from '@/app/routes/app/rules';
import { i18n } from '@/lib/i18n/i18n-instance';
import { db } from '@/testing/mocks/db';
import {
  createUser,
  loginAsUser,
  renderApp,
  screen,
} from '@/testing/test-utils';

const seedRule = (
  overrides: Partial<{
    title_en: string;
    title_ar: string;
    body_en: string;
    body_ar: string;
  }> = {},
) =>
  db.rule.create({
    title_en: 'Course load rule',
    title_ar: 'قاعدة الحمل الدراسي',
    body_en: 'Register for **12 to 18** credits each term.',
    body_ar: 'سجّل بين **12 و18** ساعة معتمدة في كل ترم.',
    ...overrides,
  });

beforeEach(() => {
  db.rule.deleteMany({ where: {} });
});

test('the rules page lists rules with bilingual titles and rendered markdown bodies', async () => {
  const student = await createUser();
  seedRule();

  await renderApp(<StudentRulesRoute />, {
    user: student,
    path: '/app/rules',
    url: '/app/rules',
  });

  expect(
    await screen.findByRole('heading', { name: 'University Rules' }),
  ).toBeInTheDocument();
  expect(await screen.findByText('Course load rule')).toBeInTheDocument();
  expect(await screen.findByText('قاعدة الحمل الدراسي')).toBeInTheDocument();
  expect(screen.getByText('12 to 18')).toBeInTheDocument();
  expect(screen.getByText('12 و18')).toBeInTheDocument();
});

test('the rail holds no rules entry and the rules page stays reachable by deep link', async () => {
  const student = await createUser();
  await loginAsUser(student);
  seedRule({ body_en: 'Body.', body_ar: 'نص.' });

  window.history.pushState({}, '', '/app/rules');
  rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });

  expect(
    await screen.findByRole('heading', { name: 'University Rules' }),
  ).toBeInTheDocument();
  expect(await screen.findByText('Course load rule')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/app/rules');

  const rail = within(
    await screen.findByRole('navigation', { name: 'Student' }),
  );
  expect(rail.queryByRole('link', { name: 'Rules' })).not.toBeInTheDocument();
});

test('shows the empty state when no rules exist', async () => {
  const student = await createUser();

  await renderApp(<StudentRulesRoute />, {
    user: student,
    path: '/app/rules',
    url: '/app/rules',
  });

  expect(
    await screen.findByText('No university rules published yet.'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      'Rules appear here once the administration publishes them.',
    ),
  ).toBeInTheDocument();
});

test('the rules page copy renders in Arabic when the language is Arabic', async () => {
  await i18n.changeLanguage('ar');
  try {
    const student = await createUser();

    await renderApp(<StudentRulesRoute />, {
      user: student,
      path: '/app/rules',
      url: '/app/rules',
    });

    expect(
      await screen.findByRole('heading', { name: 'قواعد الجامعة' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('لا توجد قواعد جامعية منشورة بعد.'),
    ).toBeInTheDocument();
  } finally {
    await i18n.changeLanguage('en');
  }
});
