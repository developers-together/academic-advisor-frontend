import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import NotificationCenter from '@/app/routes/advisor/notifications';
import { db } from '@/testing/mocks/db';
import { createUser, loginAsUser, type MockUser } from '@/testing/test-utils';
import type { UserRole } from '@/types/domain';

const renderRealRouter = (url: string) => {
  window.history.pushState({}, '', url);
  return rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
};

const seedNotification = (
  userId: number,
  deepLink: Record<string, unknown> | string,
) =>
  db.notification.create({
    id: `route-${Math.random().toString(36).slice(2)}`,
    userId,
    slug: 'caseload_student_added',
    title: 'Caseload student added',
    body: 'Nour Adel joined your caseload.',
    deep_link:
      typeof deepLink === 'string' ? deepLink : JSON.stringify(deepLink),
  });

const LocationProbe = () => {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
};

const renderWithProbe = () =>
  rtlRender(
    <MemoryRouter initialEntries={['/notifications']}>
      <Routes>
        <Route path="/notifications" element={<NotificationCenter />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
    { wrapper: ({ children }) => <AppProvider>{children}</AppProvider> },
  );

describe('notification routing', () => {
  test.each([
    [
      '/app/notifications',
      'student',
      { screen: 'plan', plan_id: 11 },
      '/app/plan',
    ],
    [
      '/advisor/notifications',
      'advisor',
      { screen: 'student', student_id: 13 },
      '/advisor/students',
    ],
    [
      '/advisor/notifications',
      'advisor',
      { screen: 'visit', visit_request_id: 100 },
      '/advisor/meetings',
    ],
  ])(
    'opening an item in the %s section routes a %s recipient by the screen map',
    async (url, role, deepLink, expectedPath) => {
      const user = await createUser({ role });
      seedNotification(user.id as number, deepLink);
      await loginAsUser(user);

      renderRealRouter(url);

      await userEvent.click(
        await screen.findByRole('button', { name: /Caseload student added/ }),
      );

      await waitFor(() => expect(window.location.pathname).toBe(expectedPath));
    },
  );

  test('opening an item with a legacy link falls back to the role landing', async () => {
    const student = await createUser({ role: 'student' });
    seedNotification(student.id as number, 'app/plan/3');
    await loginAsUser(student);

    renderWithProbe();

    await userEvent.click(
      await screen.findByRole('button', { name: /Caseload student added/ }),
    );

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/app'),
    );
  });

  test('opening an item with no link falls back to the role landing', async () => {
    const advisor = await createUser({ role: 'advisor' });
    await loginAsUser(advisor);
    const row = seedNotification(advisor.id as number, {
      screen: 'student',
      student_id: 13,
    });
    db.notification.update({
      where: { id: { equals: row.id as string } },
      data: { deep_link: '' },
    });

    renderWithProbe();

    await userEvent.click(
      await screen.findByRole('button', { name: /Caseload student added/ }),
    );

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/advisor'),
    );
  });
});

describe('notification routes per section', () => {
  test.each([
    ['/app/notifications', 'student'],
    ['/advisor/notifications', 'advisor'],
    ['/dean/notifications', 'dean'],
    ['/vp/notifications', 'vp'],
    ['/admin/notifications', 'admin'],
  ])('%s renders the notification center for the %s', async (url, role) => {
    const user: MockUser = await createUser({ role: role as UserRole });
    await loginAsUser(user);

    renderRealRouter(url);

    expect(
      await screen.findByRole('heading', { name: 'Notifications' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('No notifications yet.'),
    ).toBeInTheDocument();
  });
});
