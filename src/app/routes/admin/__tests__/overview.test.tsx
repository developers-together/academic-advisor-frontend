import { HttpResponse, http } from 'msw';

import AdminAcademicsRoute from '@/app/routes/admin/academics';
import AdminIndexRoute from '@/app/routes/admin/index';
import AdminOperationsRoute from '@/app/routes/admin/operations';
import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
import { createUser, renderApp, screen, userEvent } from '@/testing/test-utils';

beforeEach(() => {
  db.user.deleteMany({ where: {} });
});

test('the overview shows the student count without loading the student list', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  await createUser({ role: 'student', name: 'Adam First' });
  await createUser({ role: 'student', name: 'Dalia Second' });
  server.use(
    http.get(`${env.API_URL}/admin/students`, () =>
      HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      ),
    ),
  );

  await renderApp(<AdminIndexRoute />, {
    user: admin,
    path: '/admin',
    url: '/admin',
  });

  expect(await screen.findByText('2 students')).toBeInTheDocument();
});

test('the overview links the operations hub and the academics imports', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminIndexRoute />, {
    user: admin,
    path: '/admin',
    url: '/admin',
    routes: [
      { path: '/admin/operations', element: <AdminOperationsRoute /> },
      { path: '/admin/academics', element: <AdminAcademicsRoute /> },
    ],
  });

  const operationsLink = await screen.findByRole('link', {
    name: 'Operations',
  });
  expect(operationsLink).toHaveAttribute('href', '/admin/operations');
  const academicsLink = screen.getByRole('link', { name: 'Academics' });
  expect(academicsLink).toHaveAttribute('href', '/admin/academics');

  await userEvent.click(academicsLink);
  expect(
    await screen.findByRole('heading', { name: 'Academics data' }),
  ).toBeInTheDocument();
});
