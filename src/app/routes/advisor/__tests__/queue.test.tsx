import dayjs from 'dayjs';
import { HttpResponse, http } from 'msw';

import AdvisorQueueRoute from '@/app/routes/advisor';
import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { CURRENT_TERM } from '@/testing/mocks/mock-auth';
import { server } from '@/testing/mocks/server';
import { networkDelay } from '@/testing/mocks/utils';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';
import type { MockUser } from '@/testing/test-utils';

const courseMap = [
  {
    course_code: 'CS 201',
    title: 'Data Structures',
    state: 'eligible',
    prerequisites: [],
  },
];

type QueueStudent = {
  name: string;
  studentId: string;
  cgpa: number | null;
  status: 'submitted' | 'under_review';
  daysAgo: number;
};

const seedQueueStudent = async (
  advisor: MockUser,
  { name, studentId, cgpa, status, daysAgo }: QueueStudent,
) => {
  const student = await createUser({
    name,
    student_id: studentId,
    advisor_id: advisor.id as number,
  });
  db.academicRecord.create({
    userId: student.id as number,
    ...(cgpa !== null ? { cgpa } : {}),
    curriculum_year_level: 3,
    history: JSON.stringify([]),
    current_enrollments: JSON.stringify([]),
    prerequisite_map: JSON.stringify(courseMap),
    last_synced_at: '2026-10-01T12:00:00.000Z',
  });
  db.plan.create({
    userId: student.id as number,
    status,
    term_code: CURRENT_TERM,
    courses: JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
    ]),
    warnings: JSON.stringify([]),
    total_credit_hours: 0,
    submitted_at: dayjs().subtract(daysAgo, 'day').toISOString(),
  });
  return student;
};

const rowOf = (name: string) => {
  const match = screen
    .getAllByText(name)
    .find((element) => element.closest('li'));
  return match?.closest('li') as HTMLElement;
};

const openDrawer = async (name: string) => {
  await userEvent.click(
    await screen.findByRole('button', { name: `Review ${name}'s plan` }),
  );
  const dialog = await screen.findByRole('dialog', {
    name: new RegExp(name),
  });
  await within(dialog).findByText('CS 201');
  return dialog;
};

const queueReads = () => {
  let reads = 0;
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/advisor/queue') && request.method === 'GET') {
      reads += 1;
    }
  });
  return () => reads;
};

test('the queue renders oldest first with waiting days, the aging badge, and filter counts', async () => {
  const advisor = await createUser({ role: 'advisor' });
  await seedQueueStudent(advisor, {
    name: 'Lina Majors',
    studentId: '3020451',
    cgpa: 2.8,
    status: 'submitted',
    daysAgo: 6,
  });
  await seedQueueStudent(advisor, {
    name: 'Omar Fathi',
    studentId: '3020452',
    cgpa: 3.6,
    status: 'submitted',
    daysAgo: 1,
  });
  await seedQueueStudent(advisor, {
    name: 'Nour Adel',
    studentId: '3020453',
    cgpa: null,
    status: 'under_review',
    daysAgo: 2,
  });

  await renderApp(<AdvisorQueueRoute />, {
    user: advisor,
    path: '/advisor',
    url: '/advisor',
  });

  await screen.findByRole('button', { name: "Review Lina Majors's plan" });
  const rows = screen
    .getAllByRole('button', { name: /Review .* plan$/ })
    .map((button) => button.textContent);
  expect(rows[0]).toContain('Lina Majors');
  expect(rows[1]).toContain('Nour Adel');
  expect(rows[2]).toContain('Omar Fathi');

  const lina = rowOf('Lina Majors');
  expect(within(lina).getByText('6 days')).toHaveClass('tabular-nums');
  expect(within(lina).getByText('Aging')).toBeInTheDocument();
  expect(within(lina).getByText('Submitted')).toBeInTheDocument();

  const omar = rowOf('Omar Fathi');
  expect(within(omar).getByText('1 day')).toBeInTheDocument();
  expect(within(omar).queryByText('Aging')).not.toBeInTheDocument();

  expect(await screen.findByRole('tab', { name: 'All (3)' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(
    screen.getByRole('tab', { name: 'Submitted (2)' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('tab', { name: 'Under review (1)' }),
  ).toBeInTheDocument();

  expect(screen.queryAllByRole('columnheader')).toHaveLength(0);
});

test('activating a row opens the drawer, marks the plan under review, and refetches the queue', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const student = await seedQueueStudent(advisor, {
    name: 'Lina Majors',
    studentId: '3020451',
    cgpa: 2.8,
    status: 'submitted',
    daysAgo: 6,
  });
  const countQueueReads = queueReads();

  await renderApp(<AdvisorQueueRoute />, {
    user: advisor,
    path: '/advisor',
    url: '/advisor',
  });
  expect(countQueueReads()).toBe(1);

  const dialog = await openDrawer('Lina Majors');
  expect(dialog).toHaveTextContent('CGPA 2.8');

  await waitFor(() => expect(countQueueReads()).toBe(2));
  expect(
    db.plan.findFirst({ where: { userId: { equals: student.id as number } } })
      ?.status,
  ).toBe('under_review');

  const lina = rowOf('Lina Majors');
  await waitFor(() =>
    expect(within(lina).getByText('Under review')).toBeInTheDocument(),
  );
  expect(lina).toHaveAttribute('aria-current', 'true');
});

test('approve confirms, locks the plan, closes the drawer, invalidates both roots, and confirms with a toast', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const student = await seedQueueStudent(advisor, {
    name: 'Lina Majors',
    studentId: '3020451',
    cgpa: 2.8,
    status: 'under_review',
    daysAgo: 6,
  });
  let caseloadReads = 0;
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (
      url.pathname.endsWith('/advisor/students') &&
      request.method === 'GET'
    ) {
      caseloadReads += 1;
    }
  });

  await renderApp(<AdvisorQueueRoute />, {
    user: advisor,
    path: '/advisor',
    url: '/advisor',
  });
  const readsAfterLoad = caseloadReads;

  await openDrawer('Lina Majors');

  await userEvent.click(await screen.findByRole('button', { name: 'Approve' }));

  const confirm = screen.getByRole('dialog', { name: 'Approve plan?' });
  expect(confirm).toHaveTextContent('Approval locks this plan.');
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Approve plan' }),
  );

  await waitFor(() =>
    expect(
      db.plan.findFirst({ where: { userId: { equals: student.id as number } } })
        ?.status,
    ).toBe('approved'),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: /Lina Majors/ }),
    ).not.toBeInTheDocument(),
  );
  expect(
    await screen.findByText('No plans are waiting for review.'),
  ).toBeInTheDocument();
  expect(caseloadReads).toBeGreaterThan(readsAfterLoad);
  expect(await screen.findByText('Plan approved.')).toBeInTheDocument();
  expect(document.querySelector('[role="alert"]')).toBeNull();
});

test('return demands a reason before the confirm and merges the server 422 inline', async () => {
  const advisor = await createUser({ role: 'advisor' });
  await seedQueueStudent(advisor, {
    name: 'Lina Majors',
    studentId: '3020451',
    cgpa: 2.8,
    status: 'under_review',
    daysAgo: 6,
  });

  server.use(
    http.post(`${env.API_URL}/advisor/plans/:planId/return`, async () =>
      networkDelay().then(() =>
        HttpResponse.json(
          {
            message: 'The given data was invalid.',
            errors: { reason: ['The plan was already decided.'] },
          },
          { status: 422 },
        ),
      ),
    ),
  );

  await renderApp(<AdvisorQueueRoute />, {
    user: advisor,
    path: '/advisor',
    url: '/advisor',
  });

  await openDrawer('Lina Majors');

  await userEvent.click(screen.getByRole('button', { name: 'Return plan' }));

  expect(
    await screen.findByText(
      'Write the reason so Lina Majors knows what to change.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('dialog', { name: 'Return plan?' }),
  ).not.toBeInTheDocument();

  await userEvent.type(
    screen.getByPlaceholderText('Write the return reason'),
    'Please repeat CS 201.',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Return plan' }));
  await userEvent.click(
    within(
      await screen.findByRole('dialog', { name: 'Return plan?' }),
    ).getByRole('button', { name: 'Return plan' }),
  );

  expect(
    await screen.findByText('The plan was already decided.'),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('dialog', { name: /Lina Majors/ }),
  ).toBeInTheDocument();
});

test('ESC with a drafted reason survives through the discard confirm and empty closes clean', async () => {
  const advisor = await createUser({ role: 'advisor' });
  await seedQueueStudent(advisor, {
    name: 'Lina Majors',
    studentId: '3020451',
    cgpa: 2.8,
    status: 'under_review',
    daysAgo: 6,
  });

  await renderApp(<AdvisorQueueRoute />, {
    user: advisor,
    path: '/advisor',
    url: '/advisor',
  });

  await openDrawer('Lina Majors');

  await userEvent.type(
    screen.getByPlaceholderText('Write the return reason'),
    'Repeat CS 201 first.',
  );
  await userEvent.keyboard('{Escape}');

  const discard = await screen.findByRole('dialog', {
    name: 'Discard the return reason?',
  });
  expect(discard).toBeInTheDocument();
  expect(
    screen.getByRole('dialog', { name: /Lina Majors/ }),
  ).toBeInTheDocument();

  await userEvent.click(
    within(discard).getByRole('button', { name: 'Discard reason' }),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: /Lina Majors/ }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.getByText(/Submitted plans waiting/)).toBeInTheDocument();
  expect(document.activeElement).toHaveAttribute(
    'id',
    expect.stringMatching(/^queue-row-/),
  );

  await userEvent.click(
    await screen.findByRole('button', { name: "Review Lina Majors's plan" }),
  );
  await screen.findByRole('dialog', { name: /Lina Majors/ });
  await userEvent.keyboard('{Escape}');
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: /Lina Majors/ }),
    ).not.toBeInTheDocument(),
  );
});

test('approve gate 422s render the validation list in the drawer body and return stays available', async () => {
  const advisor = await createUser({ role: 'advisor' });
  await seedQueueStudent(advisor, {
    name: 'Lina Majors',
    studentId: '3020451',
    cgpa: 2.8,
    status: 'under_review',
    daysAgo: 6,
  });

  server.use(
    http.post(`${env.API_URL}/advisor/plans/:planId/approve`, async () =>
      networkDelay().then(() =>
        HttpResponse.json(
          {
            message: 'The given data was invalid.',
            key: 'plan.validation',
            errors: {
              allowance: [
                'The course load is above the allowed limit for the term.',
              ],
              'prerequisite_chain.CS 201': ['CS 201 requires CS 101 first.'],
            },
          },
          { status: 422 },
        ),
      ),
    ),
  );

  await renderApp(<AdvisorQueueRoute />, {
    user: advisor,
    path: '/advisor',
    url: '/advisor',
  });

  await openDrawer('Lina Majors');

  await userEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  await userEvent.click(
    within(
      await screen.findByRole('dialog', { name: 'Approve plan?' }),
    ).getByRole('button', { name: 'Approve plan' }),
  );

  expect(await screen.findByText('Validation results')).toBeInTheDocument();
  expect(
    screen.getByText(
      'The course load is above the allowed limit for the term.',
    ),
  ).toBeInTheDocument();
  expect(screen.getByText('CS 201 requires CS 101 first.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Return plan' })).toBeEnabled();
  expect(
    screen.getByRole('dialog', { name: /Lina Majors/ }),
  ).toBeInTheDocument();
});

test('a 503 approve renders the retry banner next to the actions', async () => {
  const advisor = await createUser({ role: 'advisor' });
  await seedQueueStudent(advisor, {
    name: 'Lina Majors',
    studentId: '3020451',
    cgpa: 2.8,
    status: 'under_review',
    daysAgo: 6,
  });

  server.use(
    http.post(`${env.API_URL}/advisor/plans/:planId/approve`, async () =>
      networkDelay().then(() =>
        HttpResponse.json(
          {
            message: 'The student data service is unavailable.',
            key: 'plan.sis_unavailable',
          },
          { status: 503, headers: { 'x-request-id': 'req-503' } },
        ),
      ),
    ),
  );

  await renderApp(<AdvisorQueueRoute />, {
    user: advisor,
    path: '/advisor',
    url: '/advisor',
  });

  await openDrawer('Lina Majors');

  await userEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  await userEvent.click(
    within(
      await screen.findByRole('dialog', { name: 'Approve plan?' }),
    ).getByRole('button', { name: 'Approve plan' }),
  );

  expect(
    await screen.findByText('The university data service is unavailable.'),
  ).toBeInTheDocument();
  expect(screen.getByText('Request reference: req-503')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});

test('the queue passes an added comment to the plan thread', async () => {
  const advisor = await createUser({ role: 'advisor' });
  await seedQueueStudent(advisor, {
    name: 'Lina Majors',
    studentId: '3020451',
    cgpa: 2.8,
    status: 'under_review',
    daysAgo: 6,
  });

  await renderApp(<AdvisorQueueRoute />, {
    user: advisor,
    path: '/advisor',
    url: '/advisor',
  });

  const dialog = await openDrawer('Lina Majors');
  expect(
    await within(dialog).findByText('No comments on this plan yet.'),
  ).toBeInTheDocument();

  await userEvent.type(
    within(dialog).getByPlaceholderText('Write a comment for the student'),
    'Please repeat CS 201 first.',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Add comment' }),
  );

  expect(
    await within(dialog).findByText('Please repeat CS 201 first.'),
  ).toBeInTheDocument();
});

test('an empty queue renders the shared empty state', async () => {
  const advisor = await createUser({ role: 'advisor' });

  await renderApp(<AdvisorQueueRoute />, {
    user: advisor,
    path: '/advisor',
    url: '/advisor',
  });

  expect(
    await screen.findByText('No plans are waiting for review.'),
  ).toBeInTheDocument();
});

test('a queue error renders the shared error state with retry', async () => {
  const advisor = await createUser({ role: 'advisor' });

  server.use(
    http.get(`${env.API_URL}/advisor/queue`, () =>
      HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      ),
    ),
  );

  await renderApp(<AdvisorQueueRoute />, {
    user: advisor,
    path: '/advisor',
    url: '/advisor',
  });

  expect(
    await screen.findByText('Could not load this content.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});

test('a 403 queue read renders the permission panel', async () => {
  const advisor = await createUser({ role: 'advisor' });

  server.use(
    http.get(`${env.API_URL}/advisor/queue`, () =>
      HttpResponse.json(
        { message: 'This action is unauthorized.' },
        { status: 403 },
      ),
    ),
  );

  await renderApp(<AdvisorQueueRoute />, {
    user: advisor,
    path: '/advisor',
    url: '/advisor',
  });

  expect(
    await screen.findByText('This area is for Advisors.'),
  ).toBeInTheDocument();
});
