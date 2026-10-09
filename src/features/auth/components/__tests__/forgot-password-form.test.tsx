import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent } from '@/testing/test-utils';

import { ForgotPasswordForm } from '../forgot-password-form';

test('password recovery reports a server failure and permits a retry', async () => {
  let attempts = 0;
  server.use(
    http.post(`${env.API_URL}/forgot-password`, () => {
      attempts += 1;
      return attempts === 1
        ? HttpResponse.json({ message: 'Unavailable' }, { status: 503 })
        : HttpResponse.json({ message: 'Sent' });
    }),
  );
  await renderApp(<ForgotPasswordForm />, { user: null });
  await userEvent.type(screen.getByLabelText('Email'), 'student@ejust.edu.eg');
  await userEvent.click(
    screen.getByRole('button', { name: 'Send reset link' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Nothing was sent. Retry in a moment.',
  );
  expect(screen.getByLabelText('Email')).toHaveValue('student@ejust.edu.eg');
  await userEvent.click(
    screen.getByRole('button', { name: 'Send reset link' }),
  );
  expect(
    await screen.findByRole('button', { name: 'Send again' }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
