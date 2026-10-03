import { render as rtlRender, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import AdminShellRoute from '@/app/routes/admin/shell';
import AdvisorShellRoute from '@/app/routes/advisor/shell';
import StudentShellRoute from '@/app/routes/app/shell';
import DeanShellRoute from '@/app/routes/dean/shell';
import VpShellRoute from '@/app/routes/vp/shell';
import { useTableDensity } from '@/components/layouts';
import { createUser, loginAsUser, type MockUser } from '@/testing/test-utils';
import type { UserRole } from '@/types/domain';

const renderRealRouter = (url: string) => {
  window.history.pushState({}, '', url);
  return rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
};

const staffUser = (role: Exclude<UserRole, 'student'>): Promise<MockUser> =>
  createUser({
    name: `Staff ${role}`,
    email: `${role}@ejust.edu.eg`,
    role,
    faculty: role === 'advisor' || role === 'dean' ? 'Engineering' : null,
  });

const signIn = async (user: MockUser) => {
  await userEvent.type(
    await screen.findByLabelText(/university email/i),
    user.email,
  );
  await userEvent.type(screen.getByLabelText(/^password/i), user.password);
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
};

const rail = () => within(screen.getByRole('navigation'));

const expectLanding = async (
  heading: string,
  links: Array<[string, string]>,
) => {
  expect(
    await screen.findByRole('heading', { name: heading }),
  ).toBeInTheDocument();
  for (const [name, href] of links) {
    expect(rail().getByRole('link', { name })).toHaveAttribute('href', href);
  }
  expect(screen.getByRole('main')).toHaveClass('p-3', 'lg:p-4');
};

describe('advisor section', () => {
  test('sign-in lands on the queue with the staff rail and compact shell', async () => {
    const advisor = await staffUser('advisor');

    renderRealRouter('/');
    await signIn(advisor);

    await expectLanding('Queue', [
      ['Queue', '/advisor'],
      ['Student Explorer', '/advisor/students'],
      ['Meetings', '/advisor/meetings'],
      ['Office Hours', '/advisor/hours'],
      ['Notifications', '/advisor/notifications'],
    ]);
    expect(
      await screen.findByText('No plans are waiting for review.'),
    ).toBeInTheDocument();
  });

  test.each([
    [
      '/advisor/students',
      'Student Explorer',
      'No students are assigned to you yet.',
    ],
    ['/advisor/meetings', 'Meetings', 'No open meeting requests.'],
    [
      '/advisor/hours',
      'Office Hours',
      'These are the default hours. Publish to make them yours.',
    ],
    ['/advisor/notifications', 'Notifications', 'No notifications yet.'],
  ])(
    'renders the %s slot with its honest settled state',
    async (url, title, empty) => {
      await loginAsUser(await staffUser('advisor'));

      renderRealRouter(url);

      expect(
        await screen.findByRole('heading', { name: title }),
      ).toBeInTheDocument();
      expect(await screen.findByText(empty)).toBeInTheDocument();
    },
  );
});

describe('dean section', () => {
  test('sign-in lands on the overview with the staff rail and compact shell', async () => {
    const dean = await staffUser('dean');

    renderRealRouter('/');
    await signIn(dean);

    await expectLanding('Department Overview', [
      ['Overview', '/dean'],
      ['Notifications', '/dean/notifications'],
    ]);
    expect(
      await screen.findByText('No overview data yet.'),
    ).toBeInTheDocument();
  });

  test('renders the notifications slot with its honest empty state', async () => {
    await loginAsUser(await staffUser('dean'));

    renderRealRouter('/dean/notifications');

    expect(
      await screen.findByRole('heading', { name: 'Notifications' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('No notifications yet.'),
    ).toBeInTheDocument();
  });
});

describe('vp section', () => {
  test('sign-in lands on the scorecard with the staff rail and compact shell', async () => {
    const vp = await staffUser('vp');

    renderRealRouter('/');
    await signIn(vp);

    await expectLanding('University Scorecard', [
      ['Scorecard', '/vp'],
      ['Drill-down', '/vp/drilldown'],
    ]);
    expect(
      await screen.findByText('No scorecard data yet.'),
    ).toBeInTheDocument();
  });

  test('renders the drilldown slot with its honest empty state', async () => {
    await loginAsUser(await staffUser('vp'));

    renderRealRouter('/vp/drilldown');

    expect(
      await screen.findByRole('heading', { name: 'Drill-down' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('No drill-down data yet.'),
    ).toBeInTheDocument();
  });
});

describe('admin section', () => {
  test('sign-in lands on the accounts with the staff rail and compact shell', async () => {
    const admin = await staffUser('admin');

    renderRealRouter('/');
    await signIn(admin);

    await expectLanding('Accounts', [
      ['Accounts', '/admin/students'],
      ['Caseloads', '/admin/assignments'],
      ['Rules', '/admin/rules'],
      ['Settings', '/admin/settings'],
    ]);
    expect(
      await screen.findByText('No student accounts yet.'),
    ).toBeInTheDocument();
  });

  test('the /admin index redirects to the accounts', async () => {
    await loginAsUser(await staffUser('admin'));

    renderRealRouter('/admin');

    expect(
      await screen.findByRole('heading', { name: 'Accounts' }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/students');
  });

  test.each([
    ['/admin/assignments', 'Caseloads', 'No caseload assignments yet.'],
    ['/admin/rules', 'University Rules', 'No university rules yet.'],
  ])(
    'renders the %s slot with its honest settled state',
    async (url, title, empty) => {
      await loginAsUser(await staffUser('admin'));

      renderRealRouter(url);

      expect(
        await screen.findByRole('heading', { name: title }),
      ).toBeInTheDocument();
      expect(await screen.findByText(empty)).toBeInTheDocument();
    },
  );

  test('renders the /admin/settings slot with the staff and aging cards', async () => {
    await loginAsUser(await staffUser('admin'));

    renderRealRouter('/admin/settings');

    expect(
      await screen.findByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Staff accounts' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Queue aging' }),
    ).toBeInTheDocument();
  });
});

describe('cross-role hits', () => {
  test.each([
    ['/advisor', 'Advisors.'],
    ['/dean', 'Deans.'],
    ['/vp', 'Vice Presidents.'],
    ['/admin', 'Administrators.'],
  ])(
    'a student hitting %s sees the permission panel with a way back',
    async (url, audience) => {
      await loginAsUser(await createUser());

      renderRealRouter(url);

      expect(
        await screen.findByText(`This area is for ${audience}`),
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('link', { name: 'Go to your dashboard' }),
      );

      expect(
        await screen.findByRole('heading', { name: 'Dashboard' }),
      ).toBeInTheDocument();
      expect(window.location.pathname).toMatch(/^\/app\/?$/);
    },
  );
});

describe('staff shell density', () => {
  const DensityProbe = () => {
    const density = useTableDensity();
    return <p>density: {density}</p>;
  };

  const renderShellWithProbe = (path: string, Shell: () => ReactElement) => {
    return rtlRender(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={<Shell />}>
            <Route index element={<DensityProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { wrapper: ({ children }) => <AppProvider>{children}</AppProvider> },
    );
  };

  test.each([
    ['/advisor', 'advisor', AdvisorShellRoute],
    ['/dean', 'dean', DeanShellRoute],
    ['/vp', 'vp', VpShellRoute],
    ['/admin', 'admin', AdminShellRoute],
  ])(
    'the %s shell runs the compact table density context',
    async (path, role, Shell) => {
      await loginAsUser(await createUser({ role }));

      renderShellWithProbe(path, Shell);

      expect(await screen.findByText('density: compact')).toBeInTheDocument();
    },
  );

  test('the student shell keeps the spacious context', async () => {
    await loginAsUser(await createUser());

    renderShellWithProbe('/app', StudentShellRoute);

    expect(await screen.findByText('density: spacious')).toBeInTheDocument();
  });
});
