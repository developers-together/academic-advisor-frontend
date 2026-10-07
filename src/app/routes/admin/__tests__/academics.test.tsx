import { HttpResponse, http } from 'msw';

import AdminAcademicsRoute from '@/app/routes/admin/academics';
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

const statisticsCard = () => screen.getByTestId('import-card-statistics');

beforeEach(() => {
  db.user.deleteMany({ where: {} });
});

test('the academics page shows the current term, the four import cards, and the mirror reset', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminAcademicsRoute />, {
    user: admin,
    path: '/admin/academics',
    url: '/admin/academics',
  });

  expect(
    await screen.findByRole('heading', { name: 'Current term' }),
  ).toBeInTheDocument();
  expect(await screen.findByLabelText('Term code')).toHaveValue('2026F');
  expect(screen.getByLabelText('Term kind')).toHaveValue('fall');

  for (const title of [
    'Statistics',
    'Active courses',
    'Credit allowances',
    'Curricula',
  ]) {
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  }
  expect(
    screen.getByRole('button', { name: 'Revoke mirror' }),
  ).toBeInTheDocument();
});

test('saving the current term puts every field', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const putTerm = vi.fn();
  server.use(
    http.put(`${env.API_URL}/admin/current-term`, async ({ request }) => {
      const body = (await request.json()) as Record<string, string>;
      putTerm(body);
      return HttpResponse.json({ data: body });
    }),
  );

  await renderApp(<AdminAcademicsRoute />, {
    user: admin,
    path: '/admin/academics',
    url: '/admin/academics',
  });

  const codeInput = await screen.findByLabelText('Term code');
  await userEvent.clear(codeInput);
  await userEvent.type(codeInput, '2027S');
  await userEvent.selectOptions(screen.getByLabelText('Term kind'), 'spring');
  await userEvent.selectOptions(screen.getByLabelText('Term kind'), 'spring');

  await userEvent.click(screen.getByRole('button', { name: 'Save term' }));

  await waitFor(() =>
    expect(putTerm).toHaveBeenCalledWith(
      expect.objectContaining({ code: '2027S', kind: 'spring' }),
    ),
  );
});

test('an import reports the counts and lists the rejected rows with a cap', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  server.use(
    http.post(`${env.API_URL}/admin/imports/statistics`, async () =>
      HttpResponse.json({
        data: {
          imported: 4,
          skipped: 3,
          errors: Array.from(
            { length: 23 },
            (_, index) =>
              `Row ${index + 1}: the value does not match the expected format.`,
          ),
        },
      }),
    ),
  );

  await renderApp(<AdminAcademicsRoute />, {
    user: admin,
    path: '/admin/academics',
    url: '/admin/academics',
  });

  const card = statisticsCard();
  const file = new File(['course_code,mean_grade'], 'rejected.csv', {
    type: 'text/csv',
  });
  await userEvent.upload(
    within(card).getByLabelText('CSV or XLSX up to 2 MB.'),
    file,
  );
  await userEvent.click(
    within(card).getByRole('button', { name: 'Import file' }),
  );
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Import file',
    }),
  );

  expect(
    await screen.findByText('Imported 4. Skipped 3. Rejected 23.'),
  ).toBeInTheDocument();
  const rows = within(card).getAllByText(/Row \d+:/);
  expect(rows).toHaveLength(20);
  expect(within(card).getByText('3 more rows not shown.')).toBeInTheDocument();
});

test('a clean import shows counts with no rejected-row table', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  server.use(
    http.post(`${env.API_URL}/admin/imports/statistics`, async () =>
      HttpResponse.json({
        data: { imported: 128, skipped: 3, errors: [] },
      }),
    ),
  );

  await renderApp(<AdminAcademicsRoute />, {
    user: admin,
    path: '/admin/academics',
    url: '/admin/academics',
  });

  const card = statisticsCard();
  const file = new File(['course_code,mean_grade'], 'statistics.csv', {
    type: 'text/csv',
  });
  await userEvent.upload(
    within(card).getByLabelText('CSV or XLSX up to 2 MB.'),
    file,
  );
  await userEvent.click(
    within(card).getByRole('button', { name: 'Import file' }),
  );
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Import file',
    }),
  );

  expect(
    await screen.findByText('Imported 128. Skipped 3. Rejected 0.'),
  ).toBeInTheDocument();
  expect(within(card).queryByText('Rejected rows')).not.toBeInTheDocument();
});

test('the mirror reset confirms once and posts the revoke', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const revoke = vi.fn();
  server.use(
    http.post(`${env.API_URL}/admin/sis/revoke`, async () => {
      revoke();
      return new HttpResponse(null, { status: 204 });
    }),
  );

  await renderApp(<AdminAcademicsRoute />, {
    user: admin,
    path: '/admin/academics',
    url: '/admin/academics',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'Revoke mirror' }),
  );

  const dialog = screen.getByRole('dialog');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Revoke mirror' }),
  );

  await waitFor(() => expect(revoke).toHaveBeenCalledTimes(1));
});
