import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import { db } from '@/testing/mocks/db';
import { createUser, loginAsUser } from '@/testing/test-utils';

const renderRealRouter = (url: string) => {
  window.history.pushState({}, '', url);
  return rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
};

const seedNotification = (userId: number, read: boolean) =>
  db.notification.create({
    id: `bell-${Math.random().toString(36).slice(2)}`,
    userId,
    slug: 'plan_returned',
    title: read ? 'Plan approved' : 'Plan returned',
    body: read
      ? 'Your plan is approved. Follow the checklist to register in SIS.'
      : 'Amr Advisor returned your plan with feedback.',
    deep_link: JSON.stringify({ screen: 'plan', plan_id: 11 }),
    read_at: read ? '2026-10-01T09:00:00.000Z' : undefined,
  });

test('the bell badge shows the unread count with its accessible name and a polite live region', async () => {
  const student = await createUser();
  seedNotification(student.id as number, false);
  seedNotification(student.id as number, true);
  await loginAsUser(student);

  renderRealRouter('/app');

  expect(
    await screen.findByRole('button', { name: '1 unread notifications' }),
  ).toBeInTheDocument();
  const statuses = await screen.findAllByRole('status');
  expect(
    statuses.some((node) => node.textContent === '1 unread notifications'),
  ).toBe(true);

  await userEvent.click(
    screen.getByRole('button', { name: '1 unread notifications' }),
  );

  await waitFor(() =>
    expect(window.location.pathname).toBe('/app/notifications'),
  );

  await userEvent.click(
    await screen.findByRole('button', { name: /Plan returned/ }),
  );

  expect(
    await screen.findByRole('button', { name: '0 unread notifications' }),
  ).toBeInTheDocument();
  await waitFor(() => {
    expect(
      screen
        .getAllByRole('status')
        .some((node) => node.textContent === '0 unread notifications'),
    ).toBe(true);
  });
  await waitFor(() => expect(window.location.pathname).toBe('/app/plan'));
});
