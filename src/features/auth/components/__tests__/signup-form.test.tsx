import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent, waitFor } from '@/testing/test-utils';

import { SignupForm } from '../signup-form';

beforeEach(() => {
  db.user.deleteMany({ where: {} });
});

const fillSignupForm = async () => {
  await userEvent.type(
    await screen.findByLabelText('University email'),
    'lina.abdullah@ejust.edu.eg',
  );
  await userEvent.type(screen.getByLabelText('Student ID'), '20210044');
  await userEvent.type(screen.getByLabelText('National ID'), '30201011204519');
  await userEvent.type(screen.getByLabelText('Password'), 'password123');
  await userEvent.type(
    screen.getByLabelText('Confirm password'),
    'password123',
  );
};

test('the National ID field rejects a value that is not 14 digits', async () => {
  await renderApp(<SignupForm onRegistered={vi.fn()} />, { user: null });

  await fillSignupForm();
  const nationalIdInput = screen.getByLabelText('National ID');
  await userEvent.clear(nationalIdInput);
  await userEvent.type(nationalIdInput, '30201012345');
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

  expect(
    await screen.findByText('The National ID is 14 digits.'),
  ).toBeInTheDocument();
  expect(db.user.getAll()).toHaveLength(0);
});

test('a valid signup posts the National ID and reports the verification email', async () => {
  const onRegistered = vi.fn();
  server.use(
    http.post(`${env.API_URL}/register`, async ({ request }) => {
      const body = (await request.json()) as { national_id?: string };
      expect(body.national_id).toBe('30201011204519');
      return HttpResponse.json(
        { message: 'We sent a verification link to your email.' },
        { status: 201 },
      );
    }),
  );

  await renderApp(<SignupForm onRegistered={onRegistered} />, {
    user: null,
  });

  await fillSignupForm();
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

  await waitFor(() =>
    expect(onRegistered).toHaveBeenCalledWith('lina.abdullah@ejust.edu.eg'),
  );
});
