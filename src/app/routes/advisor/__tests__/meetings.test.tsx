import { HttpResponse, http } from 'msw';

import AdvisorMeetingsRoute from '@/app/routes/advisor/meetings';
import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { CURRENT_TERM } from '@/testing/mocks/mock-auth';
import { server } from '@/testing/mocks/server';
import { networkDelay } from '@/testing/mocks/utils';
import {
  createUser,
  fireEvent,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';
import type { MockUser } from '@/testing/test-utils';

const seedStudent = async (advisor: MockUser, name: string, id: string) =>
  createUser({ name, student_id: id, advisor_id: advisor.id as number });

const seedVisitRequest = (studentId: number, initiatorId: number) =>
  db.visitRequest.create({
    studentId,
    initiatorId,
    status: 'proposed',
    term_code: CURRENT_TERM,
    slots: JSON.stringify([
      {
        starts_at: '2026-11-05T12:00:00.000Z',
        ends_at: '2026-11-05T13:00:00.000Z',
      },
    ]),
  });

test('mark done flips the badge with no dialog and moves the request to Done', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const student = await seedStudent(advisor, 'Lina Majors', '3020451');
  const request = seedVisitRequest(student.id as number, student.id as number);

  await renderApp(<AdvisorMeetingsRoute />, {
    user: advisor,
    path: '/advisor/meetings',
    url: '/advisor/meetings',
  });

  expect(await screen.findByText('Lina Majors')).toBeInTheDocument();
  expect(screen.getByText('Requested by Lina Majors')).toBeInTheDocument();
  expect(screen.getByText('05 Nov 2026, 14:00-15:00')).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Open (1)' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await userEvent.click(screen.getByRole('button', { name: 'Mark done' }));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await waitFor(() =>
    expect(
      db.visitRequest.findFirst({
        where: { id: { equals: request.id as number } },
      })?.status,
    ).toBe('done'),
  );
  expect(await screen.findByRole('tab', { name: 'Done (1)' })).toHaveAttribute(
    'aria-selected',
    'false',
  );
  expect(
    await screen.findByText('No open meeting requests.'),
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole('tab', { name: /Done/ }));
  expect(
    await screen.findByText('Requested by Lina Majors'),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Mark done' }),
  ).not.toBeInTheDocument();
});

test('propose slots blocks an end-before-start row, sends Cairo instants, and renders the returned row', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const student = await seedStudent(advisor, 'Lina Majors', '3020451');
  seedVisitRequest(student.id as number, student.id as number);

  let sentSlots: Array<{ starts_at: string; ends_at: string }> = [];
  server.use(
    http.post(
      `${env.API_URL}/advisor/visit-requests/:visitRequestId/slots`,
      async ({ request }) => {
        await networkDelay();
        const row = db.visitRequest.findFirst({ where: {} });
        sentSlots = ((await request.json()) as { slots: typeof sentSlots })
          .slots;
        db.visitRequest.update({
          where: { id: { equals: row?.id as number } },
          data: { slots: JSON.stringify(sentSlots) },
        });
        return HttpResponse.json({
          data: {
            id: row?.id,
            status: 'proposed',
            term_code: CURRENT_TERM,
            initiator_id: student.id,
            student: {
              id: student.id,
              name: student.name,
              student_id: student.student_id,
            },
            slots: sentSlots.map((slot, index) => ({
              id: index + 1,
              ...slot,
            })),
            created_at: new Date().toISOString(),
          },
        });
      },
    ),
  );

  await renderApp(<AdvisorMeetingsRoute />, {
    user: advisor,
    path: '/advisor/meetings',
    url: '/advisor/meetings',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'Propose slots' }),
  );

  const dialog = await screen.findByRole('dialog', {
    name: 'Propose slots for Lina Majors',
  });
  expect(
    within(dialog).getByText('Times are Africa/Cairo time.'),
  ).toBeInTheDocument();

  const dateField = within(dialog).getByLabelText('Date');
  const startField = within(dialog).getByLabelText('Start');
  const endField = within(dialog).getByLabelText('End');
  fireEvent.change(dateField, { target: { value: '2026-11-05' } });
  fireEvent.change(startField, { target: { value: '14:00' } });
  fireEvent.change(endField, { target: { value: '13:00' } });

  expect(
    await within(dialog).findByText('End time must be after the start time.'),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByRole('button', { name: 'Send slots' }),
  ).toBeDisabled();

  fireEvent.change(endField, { target: { value: '15:00' } });
  await waitFor(() =>
    expect(
      within(dialog).getByRole('button', { name: 'Send slots' }),
    ).toBeEnabled(),
  );

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Send slots' }),
  );

  await waitFor(() => expect(sentSlots).toHaveLength(1));
  expect(sentSlots[0].starts_at).toBe('2026-11-05T12:00:00.000Z');
  expect(sentSlots[0].ends_at).toBe('2026-11-05T13:00:00.000Z');

  expect(
    await screen.findByText('Slots sent. Lina Majors is notified in the app.'),
  ).toBeInTheDocument();
  expect(
    await screen.findByText('05 Nov 2026, 14:00-15:00'),
  ).toBeInTheDocument();
});

test('a 409 on propose invalidates the list and toasts the calm line', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const student = await seedStudent(advisor, 'Lina Majors', '3020451');
  seedVisitRequest(student.id as number, student.id as number);

  let listReads = 0;
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (
      url.pathname.endsWith('/advisor/visit-requests') &&
      request.method === 'GET'
    ) {
      listReads += 1;
    }
  });

  server.use(
    http.post(
      `${env.API_URL}/advisor/visit-requests/:visitRequestId/slots`,
      () =>
        networkDelay().then(() =>
          HttpResponse.json(
            {
              message: 'Only a proposed visit request accepts proposed times.',
              key: 'visit.not_slotable',
            },
            { status: 409 },
          ),
        ),
    ),
  );

  await renderApp(<AdvisorMeetingsRoute />, {
    user: advisor,
    path: '/advisor/meetings',
    url: '/advisor/meetings',
  });
  const readsAfterLoad = listReads;

  await userEvent.click(
    await screen.findByRole('button', { name: 'Propose slots' }),
  );
  const dialog = await screen.findByRole('dialog', {
    name: 'Propose slots for Lina Majors',
  });
  fireEvent.change(within(dialog).getByLabelText('Date'), {
    target: { value: '2026-11-06' },
  });
  fireEvent.change(within(dialog).getByLabelText('Start'), {
    target: { value: '10:00' },
  });
  fireEvent.change(within(dialog).getByLabelText('End'), {
    target: { value: '11:00' },
  });

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Send slots' }),
  );

  expect(
    await screen.findByText(
      'That action is no longer available. Your view is up to date.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('dialog', { name: /Propose slots/ }),
  ).not.toBeInTheDocument();
  await waitFor(() => expect(listReads).toBeGreaterThan(readsAfterLoad));
});

test('an empty meetings list renders the open empty state', async () => {
  const advisor = await createUser({ role: 'advisor' });

  await renderApp(<AdvisorMeetingsRoute />, {
    user: advisor,
    path: '/advisor/meetings',
    url: '/advisor/meetings',
  });

  expect(
    await screen.findByText('No open meeting requests.'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Requests from your students appear here.'),
  ).toBeInTheDocument();
});

test('a list error renders the shared error state with retry', async () => {
  const advisor = await createUser({ role: 'advisor' });

  server.use(
    http.get(`${env.API_URL}/advisor/visit-requests`, () =>
      HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      ),
    ),
  );

  await renderApp(<AdvisorMeetingsRoute />, {
    user: advisor,
    path: '/advisor/meetings',
    url: '/advisor/meetings',
  });

  expect(
    await screen.findByText('Could not load this content.'),
  ).toBeInTheDocument();
});
