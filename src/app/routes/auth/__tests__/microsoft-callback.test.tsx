import { render as rtlRender } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import { env } from '@/config/env';
import { microsoftLandingKey } from '@/features/auth/api/microsoft-sign-in';
import { i18n } from '@/lib/i18n/i18n-instance';
import { tokenFor } from '@/testing/mocks/mock-auth';
import { server } from '@/testing/mocks/server';
import { createUser, screen, waitFor } from '@/testing/test-utils';

const renderRealRouter = (url: string) => {
  window.history.pushState({}, '', url);
  return rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
};

afterEach(() => {
  server.events.removeAllListeners();
  sessionStorage.removeItem(microsoftLandingKey);
});

test('the callback exchanges the code, stores the token and lands on the intended path', async () => {
  const advisor = await createUser({ role: 'advisor' });
  sessionStorage.setItem(microsoftLandingKey, '/advisor/students');
  let profileReads = 0;
  server.events.on('request:start', ({ request }) => {
    if (new URL(request.url).pathname.endsWith('/me')) {
      profileReads += 1;
    }
  });

  renderRealRouter(`/auth/microsoft/callback?code=${advisor.id}`);

  await waitFor(() =>
    expect(window.location.pathname).toBe('/advisor/students'),
  );
  expect(localStorage.getItem('advaisor.token')).toBe(
    tokenFor(advisor.id as number),
  );
  expect(profileReads).toBeGreaterThan(0);
});

test('the callback lands on the landing for the role when no path was parked', async () => {
  const advisor = await createUser({ role: 'advisor' });

  renderRealRouter(`/auth/microsoft/callback?code=${advisor.id}`);

  await waitFor(() => expect(window.location.pathname).toBe('/advisor'));
});

test('a refused sign-in shows the message for that reason and a way back to sign in', async () => {
  renderRealRouter('/auth/microsoft/callback?error=wrong_tenant');

  expect(
    await screen.findByText(
      'This Microsoft account belongs to another organization. Sign in with your university Microsoft 365 account.',
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute(
    'href',
    '/login',
  );
});

test('a refused sign-in shows the message for that reason in Arabic', async () => {
  await i18n.changeLanguage('ar');
  try {
    renderRealRouter('/auth/microsoft/callback?error=student_account');

    expect(
      await screen.findByText(
        'حسابات الطلاب لا يمكنها تسجيل الدخول عبر Microsoft 365. سجّل الدخول ببريدك وكلمة المرور.',
      ),
    ).toBeInTheDocument();
  } finally {
    await i18n.changeLanguage('en');
  }
});

test('the way back to sign in keeps the path the person was trying to reach', async () => {
  sessionStorage.setItem(microsoftLandingKey, '/advisor/students');

  renderRealRouter('/auth/microsoft/callback?error=wrong_tenant');

  expect(
    await screen.findByRole('link', { name: 'Back to sign in' }),
  ).toHaveAttribute('href', '/login?redirectTo=%2Fadvisor%2Fstudents');
});

test('a code that expired or was already used shows its own message', async () => {
  renderRealRouter('/auth/microsoft/callback?code=already-used');

  expect(
    await screen.findByText(
      'This sign-in link has expired or was already used. Start the Microsoft 365 sign-in again.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(
      'This Microsoft account belongs to another organization. Sign in with your university Microsoft 365 account.',
    ),
  ).not.toBeInTheDocument();
});

test('an exchange that fails without a reason shows the generic failure', async () => {
  server.use(
    http.post(`${env.API_URL}/auth/microsoft/exchange`, () =>
      HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      ),
    ),
  );

  renderRealRouter('/auth/microsoft/callback?code=some-code');

  expect(
    await screen.findByText(
      'We could not complete the Microsoft 365 sign-in. Start the sign-in again.',
    ),
  ).toBeInTheDocument();
});
