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
  expect(screen.getByRole('main')).toHaveClass('p-4', 'md:p-6');
};

describe('advisor section', () => {
  test('sign-in lands on the queue with the staff rail and compact shell', async () => {
    const advisor = await staffUser('advisor');

    renderRealRouter('/');
    await signIn(advisor);

    await expectLanding('Queue', [
      ['Queue', '/advisor'],
      ['Students', '/advisor/students'],
      ['Meetings', '/advisor/meetings'],
      ['Office Hours', '/advisor/hours'],
      ['Profile', '/advisor/profile'],
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
    ['/advisor/meetings', 'Meetings', 'No meetings waiting on you'],
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

    await expectLanding('How is advising running in your faculty?', [
      ['Overview', '/dean'],
      ['Advisors', '/dean/advisors'],
      ['Analytics', '/dean/analytics'],
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
  test('sign-in lands on the overview with the staff rail and compact shell', async () => {
    const vp = await staffUser('vp');

    renderRealRouter('/');
    await signIn(vp);

    await expectLanding('How do faculties compare this term?', [
      ['Overview', '/vp'],
      ['Faculties', '/vp/faculties'],
      ['Trends', '/vp/trends'],
      ['Notifications', '/vp/notifications'],
    ]);
    expect(
      await screen.findByText('No overview data yet.'),
    ).toBeInTheDocument();
  });

  test('renders the faculties scorecard with its honest empty state', async () => {
    await loginAsUser(await staffUser('vp'));

    renderRealRouter('/vp/faculties');

    expect(
      await screen.findByRole('heading', {
        name: 'How does each faculty perform?',
      }),
    ).toBeInTheDocument();
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
  test('sign-in lands on the overview with the operations rail', async () => {
    const admin = await staffUser('admin');

    renderRealRouter('/');
    await signIn(admin);

    await expectLanding('Overview', [
      ['Overview', '/admin'],
      ['Users', '/admin/users'],
      ['Assignments', '/admin/assignments'],
      ['Courses', '/admin/courses'],
      ['Programs', '/admin/programs'],
      ['Rules', '/admin/rules'],
      ['Registration Windows', '/admin/registration-windows'],
      ['AI Configuration', '/admin/ai-configuration'],
      ['Notifications', '/admin/notifications'],
    ]);
    expect(
      await screen.findByText(/Jump into the operational task/),
    ).toBeInTheDocument();
  });

  test.each([
    ['/admin/users', 'Users', 'No student accounts yet.'],
    ['/admin/assignments', 'Assignments', 'No caseload assignments yet.'],
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

  test('/admin/staff redirects to Users and the staff tab holds the directory', async () => {
    await loginAsUser(
      await createUser({
        name: 'Nora Admin',
        email: 'nora.admin@ejust.edu.eg',
        role: 'admin',
        faculty: null,
      }),
    );

    renderRealRouter('/admin/staff');

    expect(
      await screen.findByRole('heading', { name: 'Users' }),
    ).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('tab', { name: 'Staff' }));
    expect(
      await screen.findByRole('button', { name: 'Add staff' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Edit Nora Admin' }),
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
        await screen.findByRole('heading', { name: 'Home' }),
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
