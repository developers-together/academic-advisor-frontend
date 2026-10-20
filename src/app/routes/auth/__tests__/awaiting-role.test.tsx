import { render as rtlRender } from '@testing-library/react';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import {
  createUser,
  loginAsUser,
  screen,
  userEvent,
  waitFor,
} from '@/testing/test-utils';

const renderRealRouter = (url: string) => {
  window.history.pushState({}, '', url);
  return rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
};

test('an account with no role sees the waiting page with the email and a sign-out', async () => {
  const staff = await createUser({ role: null, name: 'Omar Said' });
  await loginAsUser(staff);

  renderRealRouter('/auth/awaiting-role');

  expect(
    await screen.findByRole('heading', {
      name: /waiting for an administrator/i,
    }),
  ).toBeInTheDocument();
  expect(screen.getByText(staff.email)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
});

test('the waiting page signs the person out and returns to the sign-in screen', async () => {
  const staff = await createUser({ role: null });
  await loginAsUser(staff);

  renderRealRouter('/auth/awaiting-role');

  await userEvent.click(
    await screen.findByRole('button', { name: /sign out/i }),
  );

  await waitFor(() => expect(window.location.pathname).toBe('/login'));
});

test('the application shell stays closed for an account with no role', async () => {
  const staff = await createUser({ role: null });
  await loginAsUser(staff);

  renderRealRouter('/app');

  expect(
    await screen.findByRole('heading', {
      name: /waiting for an administrator/i,
    }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument();
});

test('an account with no role reaches the waiting page from the entry route, not the sign-in screen', async () => {
  const staff = await createUser({ role: null });
  await loginAsUser(staff);

  renderRealRouter('/');

  expect(
    await screen.findByRole('heading', {
      name: /waiting for an administrator/i,
    }),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText(/university email/i)).not.toBeInTheDocument();
});
