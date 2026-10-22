import { render as rtlRender } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import {
  createUser,
  loginAsUser,
  renderApp,
  screen,
  waitFor,
} from '@/testing/test-utils';

import VerifyEmailRoute from '../verify-email';

const renderRealRouter = (url: string) => {
  window.history.pushState({}, '', url);
  return rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
};

afterEach(() => {
  server.events.removeAllListeners();
});

test('a National ID mismatch at verification shows the mismatch guidance', async () => {
  server.use(
    http.get(`${env.API_URL}/verify-email/:id/:hash`, () =>
      HttpResponse.json(
        {
          message: 'The National ID does not match the university record.',
          key: 'verification.national_id_mismatch',
        },
        { status: 422 },
      ),
    ),
  );

  await renderApp(<VerifyEmailRoute />, {
    user: null,
    path: '/auth/verify-email/:id/:hash',
    url: '/auth/verify-email/101/sha1',
  });

  expect(
    await screen.findByText(
      'Your National ID does not match the university record',
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      'The National ID you entered does not match the record for this email. Submit the sign-up form again with the correct National ID.',
    ),
  ).toBeInTheDocument();
});

test('an invalid link keeps the invalid-link guidance', async () => {
  await renderApp(<VerifyEmailRoute />, {
    user: null,
    path: '/auth/verify-email/:id/:hash',
    url: '/auth/verify-email/101/bad-hash',
  });

  expect(
    await screen.findByText('This link is invalid or has expired'),
  ).toBeInTheDocument();
});

test('a signed-in person who opens the link still verifies the email', async () => {
  const student = await createUser({ role: 'student' });
  loginAsUser(student);
  let verifyCalls = 0;
  server.events.on('request:start', ({ request }) => {
    if (new URL(request.url).pathname.includes('/verify-email/')) {
      verifyCalls += 1;
    }
  });

  renderRealRouter(`/verify-email/${student.id}/sha1`);

  expect(
    await screen.findByText('Your email is verified'),
  ).toBeInTheDocument();
  expect(verifyCalls).toBe(1);
  expect(window.location.pathname).toBe(`/verify-email/${student.id}/sha1`);
});
