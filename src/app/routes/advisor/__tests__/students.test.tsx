import { fireEvent } from '@testing-library/react';
import dayjs from 'dayjs';
import { HttpResponse, http } from 'msw';

import AdvisorStudentsRoute from '@/app/routes/advisor/students';
import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { CURRENT_TERM } from '@/testing/mocks/mock-auth';
import { server } from '@/testing/mocks/server';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';
import type { MockUser } from '@/testing/test-utils';

const staleness = {
  identity: false,
  academic_record: false,
  course_catalog: false,
};

const courseMap = [
  {
    course_code: 'CS 201',
    title: 'Data Structures',
    state: 'eligible',
    prerequisites: [],
  },
];

type ExplorerStudent = {
  name: string;
  studentId: string;
  cgpa: number | null;
  status?: 'draft' | 'submitted' | 'under_review';
  faculty?: string;
  withPlan?: boolean;
  withOpenRequest?: boolean;
  daysAgo?: number;
};

const seedExplorerStudent = async (
  advisor: MockUser,
  {
    name,
    studentId,
    cgpa,
    status,
    faculty,
    withPlan = true,
    withOpenRequest = false,
    daysAgo = 1,
  }: ExplorerStudent,
) => {
  const student = await createUser({
    name,
    student_id: studentId,
    advisor_id: advisor.id as number,
    faculty,
  });
  db.academicRecord.create({
    userId: student.id as number,
    ...(cgpa !== null ? { cgpa } : {}),
    curriculum_year_level: 3,
    remaining_requirements: '40 credit hours',
    history: JSON.stringify([]),
    current_enrollments: JSON.stringify([]),
    prerequisite_map: JSON.stringify(courseMap),
    last_synced_at: '2026-10-01T12:00:00.000Z',
    staleness: JSON.stringify(staleness),
  });
  if (withPlan) {
    db.plan.create({
      userId: student.id as number,
      status: status ?? 'submitted',
      term_code: CURRENT_TERM,
      courses: JSON.stringify([
        { course_code: 'CS 201', group: 'G1', section: '01', reason: null },
      ]),
      warnings: JSON.stringify([]),
      total_credit_hours: 0,
      ...(status === 'submitted' || status === 'under_review'
        ? { submitted_at: dayjs().subtract(daysAgo, 'day').toISOString() }
        : {}),
    });
  }
  if (withOpenRequest) {
    db.visitRequest.create({
      studentId: student.id as number,
      initiatorId: student.id as number,
      status: 'proposed',
      term_code: CURRENT_TERM,
      slots: JSON.stringify([]),
    });
  }
  return student;
};

const rowButton = (name: string) =>
  screen.findByRole('button', { name: `Open ${name}'s plan` });

const caseloadReads = () => {
  let reads = 0;
  let searchedRead: string | null = null;
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/advisor/students')) {
      reads += 1;
      const search = url.searchParams.get('search');
      if (search !== null) {
        searchedRead = search;
      }
    }
  });
  return { count: () => reads, searchedRead: () => searchedRead };
};

test('search hits the server once per settled query and filters client-side with counts', async () => {
  const advisor = await createUser({ role: 'advisor' });
  await seedExplorerStudent(advisor, {
    name: 'Lina Majors',
    studentId: '3020451',
    cgpa: 2.8,
    status: 'submitted',
    faculty: 'Engineering',
    withOpenRequest: true,
    daysAgo: 6,
  });
  await seedExplorerStudent(advisor, {
    name: 'Omar Fathi',
    studentId: '3020452',
    cgpa: 3.6,
    status: 'submitted',
    faculty: 'Engineering',
  });
  await seedExplorerStudent(advisor, {
    name: 'Nour Adel',
    studentId: '3020453',
    cgpa: null,
    status: 'under_review',
  });
  const counter = caseloadReads();

  await renderApp(<AdvisorStudentsRoute />, {
    user: advisor,
    path: '/advisor/students',
    url: '/advisor/students',
  });

  await screen.findByRole('button', { name: "Open Lina Majors's plan" });
  expect(counter.count()).toBe(1);

  const searchField = screen.getByLabelText('Search students');
  await userEvent.type(searchField, 'lina');

  await waitFor(() => expect(counter.searchedRead()).toBe('lina'));
  expect(counter.count()).toBe(2);

  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: "Open Omar Fathi's plan" }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.getByRole('button', { name: "Open Lina Majors's plan" }),
  ).toBeInTheDocument();
  await userEvent.clear(searchField);
  expect(
    await screen.findByRole('button', { name: "Open Omar Fathi's plan" }),
  ).toBeInTheDocument();

  expect(screen.getByRole('tab', { name: 'All (3)' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await userEvent.click(screen.getByRole('tab', { name: /Unmet meeting/ }));
  expect(
    screen.getByRole('button', { name: "Open Lina Majors's plan" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: "Open Omar Fathi's plan" }),
  ).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('tab', { name: /Aging/ }));
  expect(
    screen.getByRole('button', { name: "Open Lina Majors's plan" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: "Open Nour Adel's plan" }),
  ).not.toBeInTheDocument();

  const lina = screen
    .getByRole('button', { name: "Open Lina Majors's plan" })
    .closest('tr') as HTMLElement;
  expect(within(lina).getByText('Aging')).toBeInTheDocument();
  expect(within(lina).getByText('Meeting not met')).toBeInTheDocument();
  expect(within(lina).getByText('Engineering')).toBeInTheDocument();
  expect(within(lina).getByText('3')).toBeInTheDocument();
  expect(within(lina).getByText('2.8')).toBeInTheDocument();
});

test('an empty caseload and a missed search render the settled empty states', async () => {
  const advisor = await createUser({ role: 'advisor' });

  await renderApp(<AdvisorStudentsRoute />, {
    user: advisor,
    path: '/advisor/students',
    url: '/advisor/students',
  });

  expect(
    await screen.findByText('No students are assigned to you yet.'),
  ).toBeInTheDocument();
  expect(screen.getByText('The Admin assigns caseloads.')).toBeInTheDocument();
});

test('a missed search offers the clear search action', async () => {
  const advisor = await createUser({ role: 'advisor' });
  await seedExplorerStudent(advisor, {
    name: 'Omar Fathi',
    studentId: '3020452',
    cgpa: 3.6,
    status: 'submitted',
  });

  await renderApp(<AdvisorStudentsRoute />, {
    user: advisor,
    path: '/advisor/students',
    url: '/advisor/students',
  });

  await screen.findByRole('button', { name: "Open Omar Fathi's plan" });
  await userEvent.type(screen.getByLabelText('Search students'), 'zz');

  expect(
    await screen.findByText('No students match "zz".'),
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(
    await screen.findByRole('button', { name: "Open Omar Fathi's plan" }),
  ).toBeInTheDocument();
});

test('activating a row opens the shared review drawer with the request meeting entry', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const student = await seedExplorerStudent(advisor, {
    name: 'Lina Majors',
    studentId: '3020451',
    cgpa: 2.8,
    status: 'submitted',
  });

  await renderApp(<AdvisorStudentsRoute />, {
    user: advisor,
    path: '/advisor/students',
    url: '/advisor/students',
  });

  await userEvent.click(await rowButton('Lina Majors'));

  const dialog = await screen.findByRole('dialog', {
    name: /Lina Majors/,
  });
  expect(await within(dialog).findByText('CS 201')).toBeInTheDocument();
  expect(within(dialog).getByText('CGPA 2.8')).toBeInTheDocument();
  expect(within(dialog).getByRole('button', { name: 'Approve' })).toBeEnabled();
  expect(
    within(dialog).getByRole('button', { name: 'Request meeting' }),
  ).toBeInTheDocument();

  await waitFor(() =>
    expect(
      db.plan.findFirst({ where: { userId: { equals: student.id as number } } })
        ?.status,
    ).toBe('under_review'),
  );
});

test('a student without a plan renders the no-plan empty state in the drawer', async () => {
  const advisor = await createUser({ role: 'advisor' });
  await seedExplorerStudent(advisor, {
    name: 'Nour Adel',
    studentId: '3020453',
    cgpa: null,
    withPlan: false,
  });

  await renderApp(<AdvisorStudentsRoute />, {
    user: advisor,
    path: '/advisor/students',
    url: '/advisor/students',
  });

  await userEvent.click(await rowButton('Nour Adel'));

  const dialog = await screen.findByRole('dialog', { name: /Nour Adel/ });
  expect(
    await within(dialog).findByText(
      'Nour Adel has not created a plan this term.',
    ),
  ).toBeInTheDocument();
  expect(
    within(dialog).queryByRole('button', { name: 'Approve' }),
  ).not.toBeInTheDocument();
  expect(
    within(dialog).getByRole('button', { name: 'Request meeting' }),
  ).toBeInTheDocument();
});

test('a draft plan renders without the decision actions and names the queue', async () => {
  const advisor = await createUser({ role: 'advisor' });
  await seedExplorerStudent(advisor, {
    name: 'Omar Fathi',
    studentId: '3020452',
    cgpa: 3.6,
    status: 'draft',
  });

  await renderApp(<AdvisorStudentsRoute />, {
    user: advisor,
    path: '/advisor/students',
    url: '/advisor/students',
  });

  await userEvent.click(await rowButton('Omar Fathi'));

  const dialog = await screen.findByRole('dialog', { name: /Omar Fathi/ });
  expect(await within(dialog).findByText('CS 201')).toBeInTheDocument();
  expect(
    within(dialog).getByText(
      'This plan is not waiting for review. Plans you can act on appear in the queue.',
    ),
  ).toBeInTheDocument();
  expect(
    within(dialog).queryByRole('button', { name: 'Approve' }),
  ).not.toBeInTheDocument();
  expect(
    within(dialog).queryByRole('button', { name: 'Return plan' }),
  ).not.toBeInTheDocument();
});

test('requesting a meeting from the drawer creates the visit request and toasts the sent line', async () => {
  const advisor = await createUser({ role: 'advisor' });
  await seedExplorerStudent(advisor, {
    name: 'Lina Majors',
    studentId: '3020451',
    cgpa: 2.8,
    status: 'submitted',
  });

  await renderApp(<AdvisorStudentsRoute />, {
    user: advisor,
    path: '/advisor/students',
    url: '/advisor/students',
  });

  await userEvent.click(await rowButton('Lina Majors'));
  const dialog = await screen.findByRole('dialog', { name: /Lina Majors/ });
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Request meeting' }),
  );

  const requestDialog = await screen.findByRole('dialog', {
    name: 'Request a meeting with Lina Majors',
  });
  await userEvent.click(
    within(requestDialog).getByRole('button', { name: 'Add a time' }),
  );
  fireEvent.change(within(requestDialog).getByLabelText('Date'), {
    target: { value: '2026-11-05' },
  });
  fireEvent.change(within(requestDialog).getByLabelText('Start'), {
    target: { value: '10:00' },
  });
  fireEvent.change(within(requestDialog).getByLabelText('End'), {
    target: { value: '11:00' },
  });
  await userEvent.click(
    within(requestDialog).getByRole('button', { name: 'Send request' }),
  );

  expect(
    await screen.findByText(
      'Request sent. Lina Majors is notified in the app.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('dialog', { name: /Request a meeting/ }),
  ).not.toBeInTheDocument();
});

test('a caseload error renders the shared error state with retry', async () => {
  const advisor = await createUser({ role: 'advisor' });

  server.use(
    http.get(`${env.API_URL}/advisor/students`, () =>
      HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      ),
    ),
  );

  await renderApp(<AdvisorStudentsRoute />, {
    user: advisor,
    path: '/advisor/students',
    url: '/advisor/students',
  });

  expect(
    await screen.findByText('Could not load this content.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});
