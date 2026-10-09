import dayjs from 'dayjs';
import { HttpResponse, http } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router';

import { AppProvider } from '@/app/provider';
import AdvisorNotificationsRoute from '@/app/routes/advisor/notifications';
import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
import { networkDelay } from '@/testing/mocks/utils';
import {
  createUser,
  loginAsUser,
  renderApp,
  rtlRender,
  screen,
  userEvent,
  waitFor,
} from '@/testing/test-utils';
import type { MockUser } from '@/testing/test-utils';

const seedNotification = (
  userId: number,
  overrides: Partial<{
    id: string;
    slug: string;
    title: string;
    body: string;
    deep_link: Record<string, unknown>;
    read_at: string;
    created_at: string;
  }> = {},
) => {
  const id = overrides.id ?? `notif-${Math.random().toString(36).slice(2)}`;
  db.notification.delete({ where: { id: { equals: id } } });
  return db.notification.create({
    id,
    userId,
    slug: overrides.slug ?? 'plan_returned',
    title: overrides.title ?? 'Plan returned',
    body: overrides.body ?? 'Amr Advisor returned your plan with feedback.',
    deep_link: JSON.stringify(overrides.deep_link ?? { screen: 'plan' }),
    read_at: overrides.read_at,
    created_at: overrides.created_at ?? '2026-11-05T12:00:00.000Z',
  });
};

const renderNotifications = (user: MockUser, url: string) =>
  renderApp(<AdvisorNotificationsRoute />, {
    user,
    path: url,
    url,
  });

test('renders each item with its title, body, absolute time, and unread dot', async () => {
  const advisor = await createUser({ role: 'advisor' });
  seedNotification(advisor.id as number, {
    id: 'unread-1',
    title: 'Plan returned',
    body: 'Amr Advisor returned your plan with feedback.',
    created_at: '2026-11-05T12:00:00.000Z',
  });
  seedNotification(advisor.id as number, {
    id: 'read-1',
    slug: 'caseload_student_added',
    title: 'Caseload student added',
    body: 'Nour Adel joined your caseload.',
    read_at: '2026-11-05T13:00:00.000Z',
    created_at: '2026-11-04T09:00:00.000Z',
  });

  await renderNotifications(advisor, '/advisor/notifications');

  expect(await screen.findByText('Plan returned')).toBeInTheDocument();
  expect(
    screen.getByText('Amr Advisor returned your plan with feedback.'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      dayjs('2026-11-05T12:00:00.000Z').format('DD MMM YYYY HH:mm'),
    ),
  ).toBeInTheDocument();
  expect(screen.getByText('Caseload student added')).toBeInTheDocument();
  expect(screen.getAllByText('Unread', { selector: '.sr-only' })).toHaveLength(
    1,
  );
});

test('opening an unread item marks it read and clears its unread dot', async () => {
  const advisor = await createUser({ role: 'advisor' });
  seedNotification(advisor.id as number, { id: 'unread-1' });

  await renderNotifications(advisor, '/advisor/notifications');

  expect(
    await screen.findByText('Unread', { selector: '.sr-only' }),
  ).toBeInTheDocument();
  expect(screen.getByText('1 unread')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Plan returned/ }));

  await waitFor(() =>
    expect(
      db.notification.findFirst({ where: { id: { equals: 'unread-1' } } })
        ?.read_at,
    ).not.toBeNull(),
  );
  await waitFor(() =>
    expect(
      screen.queryByText('Unread', { selector: '.sr-only' }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.queryByText('1 unread')).not.toBeInTheDocument();
});

test('a failed mark-read restores the unread state with no flicker', async () => {
  let readAttempts = 0;
  const advisor = await createUser({ role: 'advisor' });
  seedNotification(advisor.id as number, { id: 'unread-1' });

  server.use(
    http.post(`${env.API_URL}/notifications/:notificationId/read`, () => {
      readAttempts += 1;
      return networkDelay().then(() =>
        HttpResponse.json(
          { message: 'The server encountered an error.' },
          { status: 500 },
        ),
      );
    }),
  );

  await renderApp(<AdvisorNotificationsRoute />, {
    user: advisor,
    path: '*',
    url: '/advisor/notifications',
  });

  expect(
    await screen.findByText('Unread', { selector: '.sr-only' }),
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /Plan returned/ }));

  await waitFor(() => expect(readAttempts).toBe(1));
  expect(
    await screen.findByText('Unread', { selector: '.sr-only' }),
  ).toBeInTheDocument();
  expect(screen.getByText('1 unread')).toBeInTheDocument();
});

test('mark all as read empties the badge in one call', async () => {
  let readAllCalls = 0;
  const advisor = await createUser({ role: 'advisor' });
  seedNotification(advisor.id as number, { id: 'unread-1' });
  seedNotification(advisor.id as number, {
    id: 'unread-2',
    slug: 'meeting_requested',
    title: 'Visit requested',
  });

  server.use(
    http.post(`${env.API_URL}/notifications/read-all`, () => {
      readAllCalls += 1;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  await renderNotifications(advisor, '/advisor/notifications');

  expect(await screen.findByText('2 unread')).toBeInTheDocument();
  expect(screen.getAllByText('Unread', { selector: '.sr-only' })).toHaveLength(
    2,
  );

  await userEvent.click(
    screen.getByRole('button', { name: 'Mark all as read' }),
  );

  await waitFor(() => expect(readAllCalls).toBe(1));
  await waitFor(() =>
    expect(
      screen.queryAllByText('Unread', { selector: '.sr-only' }),
    ).toHaveLength(0),
  );
  expect(screen.queryByText('2 unread')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Mark all as read' }),
  ).toBeDisabled();
});

test('loading skeletons match the item shape before the list arrives', async () => {
  const advisor = await createUser({ role: 'advisor' });
  seedNotification(advisor.id as number, { id: 'unread-1' });
  await loginAsUser(advisor);

  const view = rtlRender(
    <MemoryRouter initialEntries={['/advisor/notifications']}>
      <Routes>
        <Route
          path="/advisor/notifications"
          element={<AdvisorNotificationsRoute />}
        />
      </Routes>
    </MemoryRouter>,
    { wrapper: ({ children }) => <AppProvider>{children}</AppProvider> },
  );

  const pending = await screen.findByTestId('notifications-loading');
  expect(pending).toHaveAttribute('aria-busy', 'true');
  expect(pending.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

  expect(await screen.findByText('Plan returned')).toBeInTheDocument();
  expect(screen.queryByTestId('notifications-loading')).not.toBeInTheDocument();
  view.unmount();
});

test('a list error renders the compact error state', async () => {
  const advisor = await createUser({ role: 'advisor' });

  server.use(
    http.get(`${env.API_URL}/notifications`, () =>
      HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      ),
    ),
  );

  await renderNotifications(advisor, '/advisor/notifications');

  expect(
    await screen.findByText('Could not load this content.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});
