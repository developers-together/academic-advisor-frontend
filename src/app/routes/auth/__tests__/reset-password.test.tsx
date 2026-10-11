import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent } from '@/testing/test-utils';

import ResetPasswordRoute from '../reset-password';

test('a submitted form sets a new password and shows the success state', async () => {
  let resetBody: unknown = null;
  server.use(
    http.post(`${env.API_URL}/reset-password`, async ({ request }) => {
      resetBody = await request.json();
      return HttpResponse.json({ message: 'Your password has been reset.' });
    }),
  );

  await renderApp(<ResetPasswordRoute />, {
    user: null,
    path: '/auth/reset-password',
    url: '/auth/reset-password?token=tok123&email=sara.ibrahim.2101434%40ejust.edu.eg',
  });

  await userEvent.type(
    await screen.findByLabelText('New password'),
    'newsecret1234',
  );
  await userEvent.type(
    screen.getByLabelText('Confirm new password'),
    'newsecret1234',
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Set new password' }),
  );

  expect(await screen.findByText('Your password is set')).toBeInTheDocument();
  expect(resetBody).toEqual({
    token: 'tok123',
    email: 'sara.ibrahim.2101434@ejust.edu.eg',
    password: 'newsecret1234',
    password_confirmation: 'newsecret1234',
  });
});

test('a missing token shows the invalid-link state', async () => {
  await renderApp(<ResetPasswordRoute />, {
    user: null,
    path: '/auth/reset-password',
    url: '/auth/reset-password',
  });

  expect(
    await screen.findByText('This link is invalid or has expired'),
  ).toBeInTheDocument();
});

test('an invalid token from the API shows the error banner', async () => {
  server.use(
    http.post(`${env.API_URL}/reset-password`, () =>
      HttpResponse.json(
        {
          message: 'This password reset link is invalid or has expired.',
          errors: {
            email: ['This password reset link is invalid or has expired.'],
          },
        },
        { status: 422 },
      ),
    ),
  );

  await renderApp(<ResetPasswordRoute />, {
    user: null,
    path: '/auth/reset-password',
    url: '/auth/reset-password?token=bad&email=sara.ibrahim.2101434%40ejust.edu.eg',
  });

  await userEvent.type(
    await screen.findByLabelText('New password'),
    'newsecret1234',
  );
  await userEvent.type(
    screen.getByLabelText('Confirm new password'),
    'newsecret1234',
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Set new password' }),
  );

  expect(
    await screen.findByText(
      'This password reset link is invalid or has expired.',
    ),
  ).toBeInTheDocument();
});
