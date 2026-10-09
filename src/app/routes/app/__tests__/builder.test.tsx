import { HttpResponse, http } from 'msw';

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

import BuilderRoute from '../builder';

const prerequisiteMap = [
  {
    course_code: 'CS 101',
    title: 'Introduction to Programming',
    state: 'completed',
    prerequisites: [],
  },
  {
    course_code: 'MATH 101',
    title: 'Calculus I',
    state: 'completed',
    prerequisites: [],
  },
  {
    course_code: 'CS 201',
    title: 'Data Structures',
    state: 'eligible',
    prerequisites: ['CS 101'],
  },
  {
    course_code: 'MATH 201',
    title: 'Calculus II',
    state: 'eligible',
    prerequisites: ['MATH 101'],
  },
  {
    course_code: 'CS 301',
    title: 'Algorithms',
    state: 'locked',
    prerequisites: ['CS 201'],
  },
  {
    course_code: 'EE 210',
    title: 'Circuits',
    state: 'planned',
    prerequisites: [],
  },
];

const seedAcademicRecord = (userId: number) => {
  db.academicRecord.create({
    userId,
    cgpa: 3.2,
    curriculum_year_level: 2,
    history: JSON.stringify([]),
    current_enrollments: JSON.stringify([]),
    prerequisite_map: JSON.stringify(prerequisiteMap),
    last_synced_at: '2026-10-01T12:00:00.000Z',
  });
};

const seedDraftPlan = (userId: number, courses: string) => {
  return db.plan.create({
    userId,
    status: 'draft',
    term_code: CURRENT_TERM,
    courses,
    warnings: JSON.stringify([]),
    total_credit_hours: 0,
  });
};

const planCourses = (userId: number) => {
  const row = db.plan.findFirst({ where: { userId: { equals: userId } } });
  return row ? (JSON.parse(row.courses) as { course_code: string }[]) : [];
};

test('adding a course posts it and shows the returned plan row without a refetch', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(
    user.id as number,
    JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
    ]),
  );
  seedAcademicRecord(user.id as number);

  let planReads = 0;
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/plan') && request.method === 'GET') {
      planReads += 1;
    }
  });

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });
  expect(planReads).toBe(1);

  await userEvent.click(
    await screen.findByRole('combobox', { name: /add a course/i }),
  );
  await userEvent.click(await screen.findByRole('option', { name: /CS 301/ }));

  expect(await screen.findByText('CS 301')).toBeInTheDocument();
  expect(screen.getByText('Algorithms')).toBeInTheDocument();
  expect(planReads).toBe(1);
  expect(planCourses(user.id as number).map((c) => c.course_code)).toEqual([
    'CS 201',
    'CS 301',
  ]);
});

test('the picker lists map entries minus plan members with their map state', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(
    user.id as number,
    JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
      { course_code: 'MATH 201', title: null, credits: 4, reason: null },
    ]),
  );
  seedAcademicRecord(user.id as number);

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  await userEvent.click(
    await screen.findByRole('combobox', { name: /add a course/i }),
  );

  expect(
    await screen.findByRole('option', { name: /CS 101/ }),
  ).toHaveTextContent('Completed');
  expect(screen.getByRole('option', { name: /MATH 101/ })).toHaveTextContent(
    'Completed',
  );
  expect(screen.getByRole('option', { name: /CS 301/ })).toHaveTextContent(
    'Locked',
  );
  expect(
    screen.queryByRole('option', { name: /CS 201/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('option', { name: /MATH 201/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('option', { name: /EE 210/ }),
  ).not.toBeInTheDocument();
});

test('an empty picker search names the query', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(
    user.id as number,
    JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
    ]),
  );
  seedAcademicRecord(user.id as number);

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  const input = await screen.findByRole('combobox', {
    name: /add a course/i,
  });
  await userEvent.type(input, 'zzz');

  expect(
    await screen.findByText('No courses in your course map match "zzz".'),
  ).toBeInTheDocument();
});

test('remove is one click without a dialog', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(
    user.id as number,
    JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
    ]),
  );
  seedAcademicRecord(user.id as number);

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  expect(await screen.findByText('CS 201')).toBeInTheDocument();
  expect(screen.getByText('3 credits')).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Remove CS 201' }));

  await screen.findByText(/your plan is empty/i);
  expect(
    screen.queryByRole('button', { name: 'Remove CS 201' }),
  ).not.toBeInTheDocument();
  expect(
    JSON.parse(
      db.plan.findFirst({ where: { userId: { equals: user.id as number } } })
        ?.courses ?? '[]',
    ),
  ).toEqual([]);
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test('a failed submit renders each server message under its line plus the grouped summary and blocks resubmit until a course mutation', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(
    user.id as number,
    JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
      { course_code: 'CS 301', title: null, credits: 3, reason: null },
      { course_code: 'CS 999', title: null, credits: 3, reason: null },
    ]),
  );
  seedAcademicRecord(user.id as number);

  server.use(
    http.post(
      `${env.API_URL}/plan/submit`,
      async () =>
        await networkDelay().then(() =>
          HttpResponse.json(
            {
              message: 'The given data was invalid.',
              key: 'plan.validation',
              errors: {
                allowance: [
                  'Your course load is above the allowed limit for the term.',
                ],
                'map_membership.CS 999': [
                  'CS 999 is not in your course map. Remove it or pick a mapped course.',
                ],
                'prerequisite_chain.CS 301': [
                  'CS 301 requires CS 201 first. Complete the missing prerequisites or pick an eligible course.',
                ],
              },
            },
            { status: 422 },
          ),
        ),
    ),
  );

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: /submit plan/i }),
  );

  expect(
    await screen.findByText('Resolve 3 issues to submit.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /submit plan/i })).toBeDisabled();

  const panel = screen.getByRole('region', { name: /validation/i });
  expect(panel).toHaveTextContent(
    'Your course load is above the allowed limit for the term.',
  );
  expect(panel).toHaveTextContent(
    'CS 999 is not in your course map. Remove it or pick a mapped course.',
  );
  expect(panel).toHaveTextContent(
    'CS 301 requires CS 201 first. Complete the missing prerequisites or pick an eligible course.',
  );

  const cs999Line = screen.getByText('CS 999').closest('li');
  expect(cs999Line).not.toBeNull();
  expect(
    within(cs999Line as HTMLElement).getByText(
      'CS 999 is not in your course map. Remove it or pick a mapped course.',
    ),
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Remove CS 999' }));

  await waitFor(() =>
    expect(screen.getByRole('button', { name: /submit plan/i })).toBeEnabled(),
  );
  expect(
    screen.queryByText('Resolve 3 issues to submit.'),
  ).not.toBeInTheDocument();
});

test('an inactive course shows its message under the line and the plan keeps other lines clean', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(
    user.id as number,
    JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
      { course_code: 'EE 210', title: null, credits: 3, reason: null },
    ]),
  );
  seedAcademicRecord(user.id as number);

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: /submit plan/i }),
  );

  expect(
    await screen.findByText('Resolve 1 issue to submit.'),
  ).toBeInTheDocument();

  const ee210Line = screen.getByText('EE 210').closest('li');
  expect(ee210Line).not.toBeNull();
  expect(
    within(ee210Line as HTMLElement).getByText(
      'EE 210 is not offered this term. Pick a course from the active list.',
    ),
  ).toBeInTheDocument();

  const cs201Line = screen.getByText('CS 201').closest('li');
  expect(
    within(cs201Line as HTMLElement).queryByRole('status'),
  ).not.toBeInTheDocument();
});

test('the window 422 renders the closed-window banner at the submit gate and the builder stays editable', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(
    user.id as number,
    JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
      { course_code: 'MATH 201', title: null, credits: 4, reason: null },
    ]),
  );
  seedAcademicRecord(user.id as number);

  server.use(
    http.post(
      `${env.API_URL}/plan/submit`,
      async () =>
        await networkDelay().then(() =>
          HttpResponse.json(
            {
              message: 'The given data was invalid.',
              key: 'window',
              errors: {
                window: [
                  'Registration is closed. Your approved plan waits for the next window.',
                ],
              },
            },
            { status: 422 },
          ),
        ),
    ),
  );

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: /submit plan/i }),
  );

  expect(await screen.findByText('Registration is closed')).toBeInTheDocument();
  expect(
    screen.getByText('Your approved plan waits for the next window.'),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /submit plan/i }),
  ).not.toBeInTheDocument();

  await userEvent.click(
    screen.getByRole('button', { name: 'Remove MATH 201' }),
  );

  expect(
    await screen.findByRole('button', { name: /submit plan/i }),
  ).toBeInTheDocument();
  expect(screen.getByText('CS 201')).toBeInTheDocument();
});

test('a 503 submit renders the destructive retry banner and the builder stays editable', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(
    user.id as number,
    JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
    ]),
  );
  seedAcademicRecord(user.id as number);

  server.use(
    http.post(
      `${env.API_URL}/plan/submit`,
      async () =>
        await networkDelay().then(() =>
          HttpResponse.json(
            {
              message: 'The registration service is unavailable.',
              key: 'plan.window_unavailable',
            },
            { status: 503 },
          ),
        ),
    ),
  );

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: /submit plan/i }),
  );

  expect(
    await screen.findByText('Your plan was not submitted'),
  ).toBeInTheDocument();
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();

  await userEvent.click(
    await screen.findByRole('combobox', { name: /add a course/i }),
  );
  await userEvent.click(await screen.findByRole('option', { name: /CS 301/ }));
  expect(await screen.findByText('CS 301')).toBeInTheDocument();
});

test('the builder flow is operable with the keyboard alone', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(user.id as number, JSON.stringify([]));
  seedAcademicRecord(user.id as number);

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  expect(await screen.findByText(/your plan is empty/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /submit plan/i })).toBeDisabled();

  const picker = await screen.findByRole('combobox', {
    name: /add a course/i,
  });
  picker.focus();
  await screen.findByRole('option', { name: /CS 101/ });
  await userEvent.keyboard('MATH 201');
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{Enter}');

  expect(await screen.findByText('MATH 201')).toBeInTheDocument();

  const remove = screen.getByRole('button', { name: 'Remove MATH 201' });
  remove.focus();
  await userEvent.keyboard('{Enter}');
  await screen.findByText(/your plan is empty/i);

  await userEvent.click(
    await screen.findByRole('combobox', { name: /add a course/i }),
  );
  await userEvent.click(await screen.findByRole('option', { name: /CS 101/ }));
  await screen.findByText('CS 101');

  const submit = screen.getByRole('button', { name: /submit plan/i });
  submit.focus();
  await userEvent.keyboard('{Enter}');

  await screen.findByText(/only a draft can be edited/i);
});

test('the builder renders no reason field or AI note anywhere', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(
    user.id as number,
    JSON.stringify([
      {
        course_code: 'CS 201',
        title: null,
        credits: 3,
        reason: 'The AI advisor suggested this course for your goal.',
      },
    ]),
  );
  seedAcademicRecord(user.id as number);

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  expect(await screen.findByText('CS 201')).toBeInTheDocument();
  expect(screen.queryByLabelText(/reason/i)).not.toBeInTheDocument();
  expect(
    screen.queryByText(/The AI advisor suggested this course/),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/AI note/i)).not.toBeInTheDocument();
});

test('starting a plan from the builder creates it', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedAcademicRecord(user.id as number);

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: /start your plan/i }),
  );

  expect(
    await screen.findByRole('combobox', { name: /add a course/i }),
  ).toBeInTheDocument();
  expect(await screen.findByText(/your plan is empty/i)).toBeInTheDocument();
});

test('a 409 plan start renders the calm no-advisor banner', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedAcademicRecord(user.id as number);

  server.use(
    http.post(
      `${env.API_URL}/plan`,
      async () =>
        await networkDelay().then(() =>
          HttpResponse.json(
            { message: 'You have no assigned advisor yet.' },
            { status: 409 },
          ),
        ),
    ),
  );

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: /start your plan/i }),
  );

  expect(
    await screen.findByText(/you have no assigned advisor yet/i),
  ).toBeInTheDocument();
});

test('discarding a plan confirms once and the plan leaves the draft builder', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(
    user.id as number,
    JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
    ]),
  );
  seedAcademicRecord(user.id as number);

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: /discard plan/i }),
  );

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(
    db.plan.findFirst({ where: { userId: { equals: user.id as number } } })
      ?.status,
  ).toBe('draft');

  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Discard plan',
    }),
  );

  expect(
    await screen.findByText(/only a draft can be edited/i),
  ).toBeInTheDocument();
  expect(
    db.plan.findFirst({ where: { userId: { equals: user.id as number } } })
      ?.status,
  ).toBe('discarded');
});
