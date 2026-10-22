import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { mapEntry } from '@/testing/mocks/map-entry';
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

import BuilderRoute from '../builder';

const prerequisiteMap = [
  mapEntry({
    course_code: 'CS 101',
    title: 'Introduction to Programming',
    level: 1,
    state: 'completed',
  }),
  mapEntry({
    course_code: 'MATH 101',
    title: 'Calculus I',
    level: 1,
    state: 'completed',
  }),
  mapEntry({
    course_code: 'CS 201',
    title: 'Data Structures',
    level: 3,
    state: 'eligible',
    prerequisites: ['CS 101'],
  }),
  mapEntry({
    course_code: 'MATH 201',
    title: 'Calculus II',
    level: 3,
    state: 'eligible',
    prerequisites: ['MATH 101'],
    warnings: ['Requires exception — talk to your academic advisor.'],
  }),
  mapEntry({
    course_code: 'CS 301',
    title: 'Algorithms',
    level: 5,
    state: 'locked',
    prerequisites: ['CS 201'],
    missing_prerequisites: ['CS 201'],
  }),
  mapEntry({
    course_code: 'CS 302',
    title: 'Operating Systems',
    level: 3,
    state: 'attempted',
    prerequisites: ['CS 102'],
    missing_prerequisites: ['CS 102'],
    warnings: ['Prerequisite CS 102 was attempted without a passing grade.'],
  }),
  mapEntry({
    course_code: 'EE 210',
    title: 'Circuits',
    level: 2,
    state: 'eligible',
  }),
  mapEntry({
    course_code: 'EE 220',
    title: 'Digital Logic',
    level: 2,
    state: 'planned',
  }),
  mapEntry({
    course_code: 'CS 401',
    title: 'Machine Learning',
    level: 5,
    state: 'eligible',
    prerequisites: ['CS 301'],
    available: false,
    reasons: ['CS 401 is above your current level.'],
  }),
];

const seedAcademicRecord = (userId: number) => {
  db.academicRecord.create({
    userId,
    cgpa: 3.2,
    curriculum_year_level: 2,
    history: JSON.stringify([]),
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
    await screen.findByRole('button', { name: 'Add MATH 201 to plan' }),
  );

  expect(
    await screen.findByRole('button', { name: 'Remove MATH 201' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Calculus II')).toBeInTheDocument();
  expect(planReads).toBe(1);
  expect(planCourses(user.id as number).map((c) => c.course_code)).toEqual([
    'CS 201',
    'MATH 201',
  ]);
});

test('the shelf lists mapped courses minus completed and plan members', async () => {
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

  const shelf = await screen.findByRole('complementary', {
    name: /courses for your plan/i,
  });
  expect(
    await within(shelf).findByRole('button', { name: 'Add CS 301 to plan' }),
  ).toBeDisabled();
  expect(within(shelf).getByText(/Requires CS 201/)).toBeInTheDocument();
  expect(within(shelf).getByText('EE 210')).toBeInTheDocument();
  expect(within(shelf).queryByText('EE 220')).not.toBeInTheDocument();
  expect(within(shelf).queryByText('CS 101')).not.toBeInTheDocument();
  expect(within(shelf).queryByText('MATH 101')).not.toBeInTheDocument();
  expect(
    within(shelf).queryByRole('button', { name: 'Add CS 201 to plan' }),
  ).not.toBeInTheDocument();
  expect(
    within(shelf).queryByRole('button', { name: 'Add MATH 201 to plan' }),
  ).not.toBeInTheDocument();
});

test('the picker keeps above-level courses visible but disabled with backend reasons', async () => {
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

  const shelf = await screen.findByRole('complementary', {
    name: /courses for your plan/i,
  });
  expect(
    await within(shelf).findByRole('button', { name: 'Add CS 301 to plan' }),
  ).toBeDisabled();
  expect(within(shelf).getByText('CS 401')).toBeInTheDocument();
  expect(
    within(shelf).getByText('CS 401 is above your current level.'),
  ).toBeInTheDocument();
  expect(
    within(shelf).getByRole('button', { name: 'Add CS 401 to plan' }),
  ).toBeDisabled();

  const input = within(shelf).getByRole('textbox', {
    name: /add a course/i,
  });
  await userEvent.type(input, 'Machine Learning');
  expect(
    await within(shelf).findByText('Machine Learning'),
  ).toBeInTheDocument();
  await userEvent.click(
    within(shelf).getByRole('button', { name: 'Add CS 401 to plan' }),
  );
  expect(
    screen.queryByRole('button', { name: 'Remove CS 401' }),
  ).not.toBeInTheDocument();
});

test('the picker shows the exception and prerequisite warnings on offered courses', async () => {
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

  const shelf = await screen.findByRole('complementary', {
    name: /courses for your plan/i,
  });
  expect(
    await within(shelf).findByText(
      'Requires exception — talk to your academic advisor.',
    ),
  ).toBeInTheDocument();
  expect(
    within(shelf).getByText(
      'Prerequisite CS 102 was attempted without a passing grade.',
    ),
  ).toBeInTheDocument();
});

test('dropping an unavailable course cannot add it to the plan', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(user.id as number, JSON.stringify([]));
  seedAcademicRecord(user.id as number);
  let unavailableAdds = 0;
  server.use(
    http.post(`${env.API_URL}/plan/courses`, async ({ request }) => {
      const body = await request.json();
      if (
        body &&
        typeof body === 'object' &&
        'course_code' in body &&
        body.course_code === 'CS 401'
      ) {
        unavailableAdds += 1;
      }
      return HttpResponse.json(
        { message: 'Course unavailable.' },
        { status: 422 },
      );
    }),
  );

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  await screen.findByRole('button', { name: 'Add MATH 201 to plan' });
  fireEvent.drop(
    screen.getByText('Drop a course here to add it to your plan.'),
    {
      dataTransfer: { getData: () => 'CS 401' },
    },
  );
  await userEvent.click(screen.getByRole('button', { name: 'Eligible' }));
  expect(unavailableAdds).toBe(0);
  expect(planCourses(user.id as number)).toEqual([]);
});

test('a lower-level outstanding course with no SIS attempt can be added to the plan', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(user.id as number, JSON.stringify([]));
  db.academicRecord.create({
    userId: user.id as number,
    curriculum_year_level: 3,
    history: JSON.stringify([]),
    prerequisite_map: JSON.stringify([
      {
        ...mapEntry({ course_code: 'CS 101', level: 1 }),
        type: 'compulsory',
        requirement_outstanding: true,
      },
    ]),
  });

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'Add CS 101 to plan' }),
  );
  expect(
    await screen.findByRole('button', { name: 'Remove CS 101' }),
  ).toBeInTheDocument();
});

test('a failed committed elective remains selectable while blocked alternatives explain the backend restriction', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(user.id as number, JSON.stringify([]));
  const electiveGroup = {
    key: 'technical',
    name: 'Technical elective',
    required_passes: 1,
    remaining_passes: 1,
    status: 'outstanding',
    passed_course_codes: [],
    committed_course_codes: ['CS 201'],
    planned_course_codes: [],
    course_codes: ['CS 201', 'CS 301'],
  };
  db.academicRecord.create({
    userId: user.id as number,
    curriculum_year_level: 3,
    history: JSON.stringify([{ course_code: 'CS 201', grade: 'F' }]),
    prerequisite_map: JSON.stringify([
      {
        ...mapEntry({ course_code: 'CS 201', level: 2, state: 'attempted' }),
        type: 'elective',
        elective_group: electiveGroup,
        elective_blocked: false,
        requirement_outstanding: true,
      },
      {
        ...mapEntry({
          course_code: 'CS 301',
          level: 2,
          available: false,
          reasons: [
            'Retake CS 201 before choosing another technical elective.',
          ],
        }),
        type: 'elective',
        elective_group: electiveGroup,
        elective_blocked: true,
        requirement_outstanding: true,
      },
    ]),
  });

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });

  const shelf = await screen.findByRole('complementary', {
    name: /courses for your plan/i,
  });
  expect(
    await within(shelf).findByRole('button', { name: 'Add CS 201 to plan' }),
  ).toBeEnabled();
  expect(
    within(shelf).getByRole('button', { name: 'Add CS 301 to plan' }),
  ).toBeDisabled();
  expect(
    within(shelf).getByText(
      'Retake CS 201 before choosing another technical elective.',
    ),
  ).toBeInTheDocument();

  await userEvent.click(within(shelf).getByRole('button', { name: 'Locked' }));
  expect(
    within(shelf).getByRole('button', { name: 'Add CS 301 to plan' }),
  ).toBeDisabled();
  expect(within(shelf).queryByText('CS 201')).not.toBeInTheDocument();
  await userEvent.click(
    within(shelf).getByRole('button', { name: 'Eligible' }),
  );
  expect(within(shelf).queryByText('CS 301')).not.toBeInTheDocument();
  await userEvent.click(
    within(shelf).getByRole('button', { name: 'Add CS 201 to plan' }),
  );
  expect(
    await screen.findByRole('button', { name: 'Remove CS 201' }),
  ).toBeInTheDocument();
});

test('adding and removing a course refreshes elective reservations in the shelf', async () => {
  const user = await createUser({ advisor_id: 2 });
  seedDraftPlan(
    user.id as number,
    JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
    ]),
  );
  seedAcademicRecord(user.id as number);

  server.use(
    http.get(`${env.API_URL}/academic-record`, () => {
      const reserved = planCourses(user.id as number).some(
        (course) => course.course_code === 'MATH 201',
      );
      return HttpResponse.json({
        data: {
          cgpa: 3.2,
          curriculum_year_level: 3,
          history: [],
          last_synced_at: '2026-10-01T12:00:00.000Z',
          prerequisite_map: prerequisiteMap.map((course) =>
            course.course_code === 'EE 210'
              ? {
                  ...course,
                  elective_blocked: reserved,
                  available: !reserved,
                  reasons: reserved
                    ? ['MATH 201 reserves the remaining elective slot.']
                    : [],
                }
              : course,
          ),
        },
      });
    }),
  );

  let recordReads = 0;
  server.events.on('request:start', ({ request }) => {
    if (new URL(request.url).pathname.endsWith('/academic-record')) {
      recordReads += 1;
    }
  });

  await renderApp(<BuilderRoute />, {
    user,
    path: '/app/builder',
    url: '/app/builder',
  });
  await screen.findByRole('button', { name: 'Add MATH 201 to plan' });
  const readsBeforeAdd = recordReads;

  await userEvent.click(
    screen.getByRole('button', { name: 'Add MATH 201 to plan' }),
  );
  await screen.findByRole('button', { name: 'Remove MATH 201' });

  await waitFor(() => expect(recordReads).toBeGreaterThan(readsBeforeAdd));
  expect(
    await screen.findByText('MATH 201 reserves the remaining elective slot.'),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Add EE 210 to plan' }),
  ).toBeDisabled();

  const readsBeforeRemove = recordReads;
  await userEvent.click(
    screen.getByRole('button', { name: 'Remove MATH 201' }),
  );
  await waitFor(() => expect(recordReads).toBeGreaterThan(readsBeforeRemove));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Add EE 210 to plan' }),
    ).toBeEnabled(),
  );
  expect(
    screen.queryByText('MATH 201 reserves the remaining elective slot.'),
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

  const input = await screen.findByRole('textbox', {
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
  expect(screen.queryByLabelText(/reason/i)).not.toBeInTheDocument();

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

  const cs999Line = screen
    .getByRole('button', { name: 'Remove CS 999' })
    .closest('li');
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

  const ee210Line = screen
    .getByRole('button', { name: 'Remove EE 210' })
    .closest('li');
  expect(ee210Line).not.toBeNull();
  expect(
    within(ee210Line as HTMLElement).getByText(
      'EE 210 is not offered this term. Pick a course from the active list.',
    ),
  ).toBeInTheDocument();

  const cs201Line = screen
    .getByRole('button', { name: 'Remove CS 201' })
    .closest('li');
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
    screen.getByText(
      'Your draft was not submitted. Contact your advisor about the registration window.',
    ),
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
  expect(
    await screen.findByRole('button', { name: 'Remove CS 201' }),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Remove MATH 201' }),
    ).not.toBeInTheDocument(),
  );
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
    await screen.findByRole('button', { name: 'Add EE 210 to plan' }),
  );
  expect(await screen.findByText('Circuits')).toBeInTheDocument();
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

  const search = await screen.findByRole('textbox', {
    name: /add a course/i,
  });
  search.focus();
  await userEvent.keyboard('MATH 201');

  await screen.findByRole('button', { name: 'Add MATH 201 to plan' });
  await userEvent.keyboard('{Tab}{Tab}{Tab}{Tab}');
  await userEvent.keyboard('{Enter}');

  expect(
    await screen.findByRole('button', { name: 'Remove MATH 201' }),
  ).toBeInTheDocument();

  const remove = screen.getByRole('button', { name: 'Remove MATH 201' });
  remove.focus();
  await userEvent.keyboard('{Enter}');
  await screen.findByText(/your plan is empty/i);

  await userEvent.clear(search);
  await userEvent.click(
    await screen.findByRole('button', { name: 'Add MATH 201 to plan' }),
  );
  expect(
    await screen.findByRole('button', { name: 'Remove MATH 201' }),
  ).toBeInTheDocument();

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
    await screen.findByRole('complementary', {
      name: /courses for your plan/i,
    }),
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
    await screen.findByRole('button', { name: /start your plan/i }),
  ).toBeInTheDocument();
  expect(
    db.plan.findFirst({ where: { userId: { equals: user.id as number } } })
      ?.status,
  ).toBe('discarded');
});
