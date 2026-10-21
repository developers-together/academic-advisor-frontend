import { render as rtlRender } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
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

test('checking access while the role is missing keeps the waiting state without signing out', async () => {
  const staff = await createUser({ role: null });
  await loginAsUser(staff);

  renderRealRouter('/auth/awaiting-role');

  await userEvent.click(
    await screen.findByRole('button', { name: /check access/i }),
  );

  expect(await screen.findByRole('status')).toHaveTextContent(
    /access is not ready yet/i,
  );
  expect(
    screen.getByRole('heading', { name: /waiting for an administrator/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(staff.email)).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /sign out/i }),
  ).toBeInTheDocument();
  expect(window.location.pathname).toBe('/auth/awaiting-role');
});

test('checking access after the administrator assigns a role opens the role home', async () => {
  const staff = await createUser({ role: null });
  await loginAsUser(staff);

  renderRealRouter('/auth/awaiting-role');

  await screen.findByRole('button', { name: /check access/i });

  db.user.update({
    where: { id: { equals: staff.id as number } },
    data: { role: 'advisor' },
  });

  await userEvent.click(screen.getByRole('button', { name: /check access/i }));

  await waitFor(() => expect(window.location.pathname).toBe('/advisor'));
});

test('a failed access check shows a failure and checking again recovers', async () => {
  const staff = await createUser({ role: null });
  await loginAsUser(staff);

  renderRealRouter('/auth/awaiting-role');

  await screen.findByRole('button', { name: /check access/i });

  server.use(
    http.get(`${env.API_URL}/me`, () =>
      HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      ),
    ),
  );

  await userEvent.click(screen.getByRole('button', { name: /check access/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /could not check your access/i,
  );
  expect(window.location.pathname).toBe('/auth/awaiting-role');

  server.resetHandlers();

  await userEvent.click(screen.getByRole('button', { name: /check access/i }));

  expect(await screen.findByRole('status')).toHaveTextContent(
    /access is not ready yet/i,
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('the check access action shows a busy state while checking', async () => {
  const staff = await createUser({ role: null });
  await loginAsUser(staff);

  renderRealRouter('/auth/awaiting-role');

  await screen.findByRole('button', { name: /check access/i });

  let releaseCheck: () => void = () => {};
  const pendingCheck = new Promise<void>((resolve) => {
    releaseCheck = resolve;
  });
  server.use(
    http.get(`${env.API_URL}/me`, async () => {
      await pendingCheck;
      return HttpResponse.json({ data: { ...staff, role: null } });
    }),
  );

  await userEvent.click(screen.getByRole('button', { name: /check access/i }));

  const checkButton = screen.getByRole('button', { name: /check access/i });
  expect(checkButton).toBeDisabled();
  expect(checkButton).toHaveAttribute('aria-busy', 'true');

  releaseCheck();

  expect(await screen.findByRole('status')).toHaveTextContent(
    /access is not ready yet/i,
  );
});

test('a check that lands after signing out does not resurrect the signed-out session', async () => {
  const staff = await createUser({ role: null });
  await loginAsUser(staff);

  renderRealRouter('/auth/awaiting-role');

  await screen.findByRole('button', { name: /check access/i });

  let releaseCheck: () => void = () => {};
  const pendingCheck = new Promise<void>((resolve) => {
    releaseCheck = resolve;
  });
  server.use(
    http.get(`${env.API_URL}/me`, async () => {
      await pendingCheck;
      return HttpResponse.json({ data: { ...staff, role: 'advisor' } });
    }),
  );

  await userEvent.click(screen.getByRole('button', { name: /check access/i }));
  await userEvent.click(screen.getByRole('button', { name: /sign out/i }));

  await waitFor(() => expect(window.location.pathname).toBe('/login'));

  releaseCheck();

  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(window.location.pathname).toBe('/login');
});

test('the check access action works from the keyboard', async () => {
  const staff = await createUser({ role: null });
  await loginAsUser(staff);

  renderRealRouter('/auth/awaiting-role');

  await screen.findByRole('button', { name: /check access/i });
  const checkButton = () =>
    screen.getByRole('button', { name: /check access/i });

  for (
    let tabs = 0;
    tabs < 6 && checkButton() !== document.activeElement;
    tabs += 1
  ) {
    await userEvent.tab();
  }
  expect(checkButton()).toHaveFocus();

  await userEvent.keyboard('{Enter}');

  expect(await screen.findByRole('status')).toHaveTextContent(
    /access is not ready yet/i,
  );
});
