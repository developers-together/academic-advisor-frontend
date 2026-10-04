import { HttpResponse, http } from 'msw';
import { Routes, Route } from 'react-router';

import AdminIndexRoute from '@/app/routes/admin/index';
import AdminSettingsRoute from '@/app/routes/admin/settings';
import AdminStudentsRoute from '@/app/routes/admin/students';
import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
} from '@/testing/test-utils';

beforeEach(() => {
  db.user.deleteMany({ where: {} });
  db.adminSettings.deleteMany({ where: {} });
});

test('the settings page hosts only the queue-aging card and no staff creation', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  db.adminSettings.create({ id: 'admin', aging_threshold_days: 3 });

  await renderApp(<AdminSettingsRoute />, {
    user: admin,
    path: '/admin/settings',
    url: '/admin/settings',
  });

  expect(
    await screen.findByRole('heading', { name: 'Queue aging' }),
  ).toBeInTheDocument();
  await screen.findByLabelText('Days');
  expect(
    screen.queryByRole('heading', { name: 'Staff accounts' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Create staff account' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Add staff' }),
  ).not.toBeInTheDocument();
});

test('the threshold editor states what it affects and saves without a confirm', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  db.adminSettings.create({ id: 'admin', aging_threshold_days: 3 });

  server.use(
    http.put(
      `${env.API_URL}/admin/settings/queue-aging-threshold`,
      async ({ request }) => {
        const body = (await request.json()) as { days: number };
        expect(body.days).toBe(5);
        db.adminSettings.update({
          where: { id: { equals: 'admin' } },
          data: { aging_threshold_days: body.days },
        });
        return HttpResponse.json({ data: { days: body.days } });
      },
    ),
  );

  await renderApp(<AdminSettingsRoute />, {
    user: admin,
    path: '/admin/settings',
    url: '/admin/settings',
  });

  const daysInput = await screen.findByLabelText('Days');
  expect(daysInput).toHaveValue(3);
  expect(
    screen.getByText(
      'Advisor queue rows and caseload rows flag aging past this threshold. Dean and VP aging metrics use the same value.',
    ),
  ).toBeInTheDocument();

  await userEvent.clear(daysInput);
  await userEvent.type(daysInput, '5');
  await userEvent.click(screen.getByRole('button', { name: 'Save threshold' }));

  await waitFor(() =>
    expect(
      db.adminSettings.findFirst({ where: { id: { equals: 'admin' } } })
        ?.aging_threshold_days,
    ).toBe(5),
  );
  expect(
    screen.queryByRole('dialog', { name: 'Save threshold?' }),
  ).not.toBeInTheDocument();
});

test('the admin index redirects to the accounts surface', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  await createUser({ name: 'Lina Majors', role: 'student' });

  await renderApp(
    <Routes>
      <Route path="/admin" element={<AdminIndexRoute />} />
      <Route path="/admin/students" element={<AdminStudentsRoute />} />
    </Routes>,
    {
      user: admin,
      path: '*',
      url: '/admin',
    },
  );

  expect(await screen.findByText('Accounts')).toBeInTheDocument();
  expect(await screen.findByLabelText('Search students')).toBeInTheDocument();
});
