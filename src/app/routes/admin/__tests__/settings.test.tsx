import { HttpResponse, http } from 'msw';

import AdminIndexRoute from '@/app/routes/admin/index';
import AdminRulesRoute from '@/app/routes/admin/rules';
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

test('the admin index lands on the operational overview', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminIndexRoute />, {
    user: admin,
    path: '/admin',
    url: '/admin',
  });

  expect(
    await screen.findByRole('heading', { name: 'Overview' }),
  ).toBeInTheDocument();
  expect(
    await screen.findByRole('button', { name: /Users/ }),
  ).toBeInTheDocument();
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

  await renderApp(<AdminRulesRoute />, {
    user: admin,
    path: '/admin/rules',
    url: '/admin/rules',
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
});
