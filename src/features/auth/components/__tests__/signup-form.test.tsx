import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent, waitFor } from '@/testing/test-utils';

import { SignupForm } from '../signup-form';

beforeEach(() => {
  db.user.deleteMany({ where: {} });
});

const fillSignupForm = async (email = 'lina.abdullah@ejust.edu.eg') => {
  await userEvent.type(
    await screen.findByLabelText('Full name'),
    'Lina Abdullah',
  );
  await userEvent.type(await screen.findByLabelText('University email'), email);
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
      const body = (await request.json()) as {
        national_id?: string;
        name?: string;
      };
      expect(body.name).toBe('Lina Abdullah');
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

test.each(['CSIT', 'FIBH', 'engineering'])(
  'a student can sign up with a %s university email',
  async (faculty) => {
    const email = `lina.abdullah@${faculty}.ejust.edu.eg`;
    const onRegistered = vi.fn();
    await renderApp(<SignupForm onRegistered={onRegistered} />, { user: null });

    await fillSignupForm(email);
    await userEvent.click(
      screen.getByRole('button', { name: 'Create account' }),
    );

    await waitFor(() => expect(onRegistered).toHaveBeenCalledWith(email));
    expect(db.user.getAll()).toHaveLength(1);
    expect(db.user.getAll()[0].email).toBe(email.toLowerCase());
  },
);

test.each([
  'lina@gmail.com',
  'lina@notejust.edu.eg',
  'lina@csit-ejust.edu.eg',
  'lina@csit.ejust.edu.eg.attacker.com',
])('signup rejects the unrelated or lookalike email %s', async (email) => {
  const onRegistered = vi.fn();
  await renderApp(<SignupForm onRegistered={onRegistered} />, { user: null });

  await fillSignupForm(email);
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

  await waitFor(() =>
    expect(
      screen.getByLabelText('University email'),
    ).toHaveAccessibleDescription(
      'Use your university email at ejust.edu.eg or a faculty subdomain, such as csit.ejust.edu.eg.',
    ),
  );
  expect(onRegistered).not.toHaveBeenCalled();
  expect(db.user.getAll()).toHaveLength(0);
});
