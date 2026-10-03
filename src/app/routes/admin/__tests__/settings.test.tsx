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
  within,
} from '@/testing/test-utils';

beforeEach(() => {
  db.user.deleteMany({ where: {} });
});

test('staff creation shows the share-the-password line without echoing it and offers the reset link', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminSettingsRoute />, {
    user: admin,
    path: '/admin/settings',
    url: '/admin/settings',
  });

  await userEvent.type(screen.getByLabelText('Name'), 'Nadia Sherif');
  await userEvent.type(
    screen.getByLabelText('Email'),
    'nadia.sherif@ejust.edu.eg',
  );
  await userEvent.type(
    screen.getByLabelText('Initial password'),
    'initial-secret-9',
  );
  await userEvent.selectOptions(screen.getByLabelText('Role'), 'advisor');
  await userEvent.click(
    screen.getByRole('button', { name: 'Create staff account' }),
  );

  expect(
    await screen.findByText(
      'Staff account created. Share the initial password with Nadia Sherif through a safe channel.',
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText('initial-secret-9')).not.toBeInTheDocument();

  await userEvent.click(
    screen.getByRole('button', { name: 'Send reset link' }),
  );
  const confirm = await screen.findByRole('dialog', {
    name: 'Send a password reset?',
  });
  expect(confirm).toHaveTextContent(
    'This emails a password reset link to nadia.sherif@ejust.edu.eg.',
  );
  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Send reset link' }),
  );

  expect(
    await screen.findByText('Password reset link sent.'),
  ).toBeInTheDocument();
});

test('a dean staff creation requires the faculty inline', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminSettingsRoute />, {
    user: admin,
    path: '/admin/settings',
    url: '/admin/settings',
  });

  await userEvent.type(screen.getByLabelText('Name'), 'Dalia Dean');
  await userEvent.type(
    screen.getByLabelText('Email'),
    'dalia.dean@ejust.edu.eg',
  );
  await userEvent.type(
    screen.getByLabelText('Initial password'),
    'initial-secret-9',
  );
  await userEvent.selectOptions(screen.getByLabelText('Role'), 'dean');
  await userEvent.click(
    screen.getByRole('button', { name: 'Create staff account' }),
  );

  expect(await screen.findByText('Deans need a faculty.')).toBeInTheDocument();
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
