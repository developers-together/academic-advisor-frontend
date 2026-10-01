import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
} from '@/testing/test-utils';

import { LoginForm } from '../login-form';

test('signs in a verified user and calls onSuccess with the user', async () => {
  const newUser = await createUser();

  const onSuccess = vi.fn();

  await renderApp(<LoginForm onSuccess={onSuccess} />, { user: null });

  await userEvent.type(
    screen.getByLabelText(/university email/i),
    newUser.email,
  );
  await userEvent.type(screen.getByLabelText(/^password/i), newUser.password);

  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
});

test('shows the server error inline for wrong credentials', async () => {
  await renderApp(<LoginForm onSuccess={vi.fn()} />, { user: null });

  await userEvent.type(
    screen.getByLabelText(/university email/i),
    'nobody@ejust.edu.eg',
  );
  await userEvent.type(screen.getByLabelText(/^password/i), 'wrong-password');

  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(
    await screen.findByText(/do not match an account/i),
  ).toBeInTheDocument();
});
