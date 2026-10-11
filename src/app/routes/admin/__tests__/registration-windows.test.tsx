import AdminAcademicsRoute from '@/app/routes/admin/academics';
import AdminRegistrationWindowsRoute from '@/app/routes/admin/registration-windows';
import { db } from '@/testing/mocks/db';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';

beforeEach(() => {
  db.user.deleteMany({ where: {} });
  db.registrationWindow.deleteMany({ where: {} });
});

test('renders windows with state and activation actions', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  db.registrationWindow.create({
    term_code: '2026F',
    opens_at: '2026-09-20T00:00:00.000Z',
    closes_at: '2026-10-15T23:59:59.000Z',
    is_active: true,
  });
  db.registrationWindow.create({
    term_code: '2027S',
    opens_at: '2027-02-10T00:00:00.000Z',
    closes_at: '2027-03-10T23:59:59.000Z',
    is_active: false,
  });

  await renderApp(<AdminRegistrationWindowsRoute />, {
    user: admin,
    path: '/admin/registration-windows',
    url: '/admin/registration-windows',
  });

  const activeRow = await screen.findByRole('row', { name: /2026F/ });
  expect(within(activeRow).getByText('Active')).toBeInTheDocument();
  expect(
    within(activeRow).getByRole('button', { name: 'Deactivate' }),
  ).toBeInTheDocument();

  const inactiveRow = screen.getByRole('row', { name: /2027S/ });
  expect(within(inactiveRow).getByText('Inactive')).toBeInTheDocument();
  await userEvent.click(
    within(inactiveRow).getByRole('button', { name: 'Activate' }),
  );

  expect(
    await screen.findByText('Registration open for 2027S.'),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(
      db.registrationWindow.findFirst({
        where: { term_code: { equals: '2027S' } },
      })?.is_active,
    ).toBe(true),
  );
  expect(
    db.registrationWindow.findFirst({
      where: { term_code: { equals: '2026F' } },
    })?.is_active,
  ).toBe(false);
});

test('a fresh deployment renders the empty state naming the source', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminRegistrationWindowsRoute />, {
    user: admin,
    path: '/admin/registration-windows',
    url: '/admin/registration-windows',
    routes: [{ path: '/admin/academics', element: <AdminAcademicsRoute /> }],
  });

  expect(
    await screen.findByText('No registration windows yet.'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      'Setting the current term on Academics creates a window. Dates mirror the SIS; activation controls whether students can submit.',
    ),
  ).toBeInTheDocument();
  const goToAcademics = screen.getByRole('button', {
    name: 'Go to Academics',
  });
  expect(goToAcademics).toBeInTheDocument();
  await userEvent.click(goToAcademics);
  expect(
    await screen.findByRole('heading', { name: 'Current term' }),
  ).toBeInTheDocument();
});
