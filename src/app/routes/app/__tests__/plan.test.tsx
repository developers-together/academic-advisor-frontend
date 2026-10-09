import dayjs from 'dayjs';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { formatDateTime } from '@/lib/i18n/format';
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

import PlanRoute from '../plan';

const courseMap = [
  {
    course_code: 'CS 201',
    title: 'Data Structures',
    state: 'eligible',
    prerequisites: [],
  },
  {
    course_code: 'CS 301',
    title: 'Algorithms',
    state: 'eligible',
    prerequisites: [],
  },
];

const planCourses = [
  { course_code: 'CS 201', title: null, credits: 3, reason: null },
  { course_code: 'CS 301', title: null, credits: 3, reason: null },
];

const seedAdvisor = async () =>
  createUser({ role: 'advisor', name: 'Amr Advisor' });

type PlanSeed = {
  status?: string;
  returnReason?: string | null;
  decidedAt?: string | null;
};

const seedPlan = async (
  userId: number,
  { status = 'draft', returnReason, decidedAt }: PlanSeed = {},
) => {
  return db.plan.create({
    userId,
    status,
    term_code: CURRENT_TERM,
    courses: JSON.stringify(planCourses),
    warnings: JSON.stringify([]),
    total_credit_hours: 0,
    submitted_at: dayjs().subtract(3, 'day').toISOString(),
    ...(decidedAt ? { decided_at: decidedAt } : {}),
    ...(returnReason ? { return_reason: returnReason } : {}),
  });
};

const seedComment = (
  planId: number,
  authorId: number,
  body: string,
  createdAt: string,
) => db.planComment.create({ planId, authorId, body, createdAt });

const seedStudentWithPlan = async (seed: PlanSeed = {}) => {
  const user = await createUser({ advisor_id: 2 });
  const advisor = await seedAdvisor();
  db.academicRecord.create({
    userId: user.id as number,
    cgpa: 3.2,
    curriculum_year_level: 2,
    history: JSON.stringify([]),
    current_enrollments: JSON.stringify([]),
    prerequisite_map: JSON.stringify(courseMap),
    last_synced_at: '2026-10-01T12:00:00.000Z',
  });
  const plan = await seedPlan(user.id as number, seed);
  return { user: user as MockUser, advisor, plan };
};

test('a returned plan shows the return reason, all comments at once, and Seen as the only primary action', async () => {
  const { user, advisor, plan } = await seedStudentWithPlan({
    status: 'returned',
    returnReason: 'Please repeat CS 201 first.',
    decidedAt: dayjs().subtract(1, 'day').toISOString(),
  });
  seedComment(
    plan.id as number,
    advisor.id as number,
    'The group choice is fine now.',
    dayjs().subtract(2, 'day').toISOString(),
  );
  seedComment(
    plan.id as number,
    advisor.id as number,
    'CS 301 sits behind CS 201 in your course map.',
    dayjs().subtract(2, 'hour').toISOString(),
  );

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

  expect(
    await screen.findByText('Please repeat CS 201 first.'),
  ).toBeInTheDocument();
  expect(
    await screen.findByText('The group choice is fine now.'),
  ).toBeInTheDocument();
  expect(
    await screen.findByText('CS 301 sits behind CS 201 in your course map.'),
  ).toBeInTheDocument();

  const seen = screen.getByRole('button', { name: 'Seen' });
  expect(seen).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /submit plan/i }),
  ).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /more actions/i }));
  const menu = screen.getByRole('menu');
  expect(
    within(menu).getByRole('menuitem', { name: 'Discard plan' }),
  ).toBeInTheDocument();
  expect(
    within(menu).queryByRole('menuitem', { name: 'Withdraw plan' }),
  ).not.toBeInTheDocument();
});

test('Seen confirms with focus on cancel, applies the server plan, and the chip announces Draft', async () => {
  const { user, plan } = await seedStudentWithPlan({
    status: 'returned',
    returnReason: 'Please repeat CS 201 first.',
    decidedAt: dayjs().subtract(1, 'day').toISOString(),
  });

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

  await userEvent.click(await screen.findByRole('button', { name: 'Seen' }));

  const confirm = screen.getByRole('dialog', {
    name: 'Mark feedback as seen?',
  });
  expect(confirm).toHaveTextContent(
    'This marks the feedback as read and unlocks editing for this plan.',
  );
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

  await userEvent.click(within(confirm).getByRole('button', { name: 'Seen' }));

  await waitFor(() =>
    expect(
      db.plan.findFirst({ where: { id: { equals: plan.id as number } } })
        ?.status,
    ).toBe('draft'),
  );

  const chip = await screen.findByText('Plan status: Draft');
  const region = chip.closest('[aria-live="polite"]');
  expect(region).not.toBeNull();
  expect(within(region as HTMLElement).getByText('Draft')).toBeInTheDocument();
  expect(
    screen.queryByRole('dialog', { name: 'Mark feedback as seen?' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText('Please repeat CS 201 first.'),
  ).not.toBeInTheDocument();
});

test('comments newer than the return carry the unread tint and New badge, and Seen clears both across the plan replace', async () => {
  const { user, advisor, plan } = await seedStudentWithPlan({
    status: 'returned',
    returnReason: 'Please repeat CS 201 first.',
    decidedAt: dayjs().subtract(1, 'day').toISOString(),
  });
  seedComment(
    plan.id as number,
    advisor.id as number,
    'The group choice is fine now.',
    dayjs().subtract(2, 'day').toISOString(),
  );
  seedComment(
    plan.id as number,
    advisor.id as number,
    'CS 301 sits behind CS 201 in your course map.',
    dayjs().subtract(2, 'hour').toISOString(),
  );

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

  const readItem = (
    await screen.findByText('The group choice is fine now.')
  ).closest('li') as HTMLElement;
  const unreadItem = (
    await screen.findByText('CS 301 sits behind CS 201 in your course map.')
  ).closest('li') as HTMLElement;
  expect(readItem).not.toHaveClass('bg-crimson-100');
  expect(within(readItem).queryByText('New')).not.toBeInTheDocument();
  expect(unreadItem).toHaveClass('bg-crimson-100');
  expect(within(unreadItem).getByText('New')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Seen' }));
  await userEvent.click(
    within(
      screen.getByRole('dialog', { name: 'Mark feedback as seen?' }),
    ).getByRole('button', { name: 'Seen' }),
  );

  await screen.findByText('Plan status: Draft');
  expect(readItem).not.toHaveClass('bg-crimson-100');
  expect(unreadItem).not.toHaveClass('bg-crimson-100');
  expect(screen.queryByText('New')).not.toBeInTheDocument();
});

test('withdraw confirms with the consequence and the verb label before it locks the plan', async () => {
  const { user, plan } = await seedStudentWithPlan();

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

  const moreActions = await screen.findByRole('button', {
    name: /more actions/i,
  });
  moreActions.focus();
  await userEvent.keyboard('{Enter}');
  await userEvent.click(
    screen.getByRole('menuitem', { name: 'Withdraw plan' }),
  );

  const confirm = screen.getByRole('dialog', { name: 'Withdraw plan?' });
  expect(confirm).toHaveTextContent(
    `This plan is withdrawn for ${CURRENT_TERM}. You cannot submit another plan this term.`,
  );
  const confirmButton = within(confirm).getByRole('button', {
    name: 'Withdraw plan',
  });
  expect(confirmButton).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

  await userEvent.click(confirmButton);

  await screen.findByText('Your plan was withdrawn for this term.');
  expect(
    db.plan.findFirst({ where: { id: { equals: plan.id as number } } })?.status,
  ).toBe('withdrawn');
  expect(screen.getByText('Plan status: Withdrawn')).toBeInTheDocument();
});

test('discard confirms with the consequence and the verb label before it discards the plan', async () => {
  const { user, plan } = await seedStudentWithPlan();

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

  const moreActions = await screen.findByRole('button', {
    name: /more actions/i,
  });
  moreActions.focus();
  await userEvent.keyboard('{Enter}');
  await userEvent.click(screen.getByRole('menuitem', { name: 'Discard plan' }));

  const confirm = screen.getByRole('dialog', { name: 'Discard plan?' });
  expect(confirm).toHaveTextContent(
    `This plan is discarded. You can start a new plan for ${CURRENT_TERM}.`,
  );
  const confirmButton = within(confirm).getByRole('button', {
    name: 'Discard plan',
  });
  expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

  await userEvent.click(confirmButton);

  await screen.findByText('Your previous plan was discarded.');
  expect(
    db.plan.findFirst({ where: { id: { equals: plan.id as number } } })?.status,
  ).toBe('discarded');
});

test('submit posts without a dialog and the chip flips to Submitted', async () => {
  const { user, plan } = await seedStudentWithPlan();

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

  const submit = await screen.findByRole('button', { name: /submit plan/i });
  await userEvent.click(submit);

  await screen.findByText('Plan status: Submitted');
  expect(
    db.plan.findFirst({ where: { id: { equals: plan.id as number } } })?.status,
  ).toBe('submitted');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('Waiting for your advisor.')).toBeInTheDocument();
});

test('each comment carries its author and absolute 24h time, and students get no reply affordance', async () => {
  const { user, advisor, plan } = await seedStudentWithPlan();
  seedComment(
    plan.id as number,
    advisor.id as number,
    'The group choice is fine now.',
    '2026-10-01T10:30:00.000Z',
  );

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

  const thread = await screen.findByRole('region', {
    name: 'Advisor comments',
  });
  expect(within(thread).getByText('Amr Advisor')).toBeInTheDocument();
  expect(
    within(thread).getByText(formatDateTime('2026-10-01T10:30:00.000Z')),
  ).toBeInTheDocument();
  expect(within(thread).queryByRole('textbox')).not.toBeInTheDocument();
  expect(
    within(thread).queryByRole('button', { name: /add comment/i }),
  ).not.toBeInTheDocument();
});

test('the plan page labels the record data with its as-of time', async () => {
  const { user } = await seedStudentWithPlan();

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

  expect(await screen.findByText(/Data as of/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});

test('a submitted plan shows its notice line with no plan controls', async () => {
  const { user } = await seedStudentWithPlan({ status: 'submitted' });

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

  expect(
    await screen.findByText('Waiting for your advisor.'),
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole('button').map((button) => button.textContent),
  ).toEqual(['Retry']);
  expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
});

test('an approved plan shows its notice line with no plan controls', async () => {
  const { user } = await seedStudentWithPlan({ status: 'approved' });

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

  expect(
    await screen.findByText('Approved. Register your courses in the SIS.'),
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole('button').map((button) => button.textContent),
  ).toEqual(['Retry']);
});

test('the window 422 renders the closed-window banner at the CTA instead of the submit button', async () => {
  const { user } = await seedStudentWithPlan();

  server.use(
    http.post(`${env.API_URL}/plan/submit`, async () =>
      networkDelay().then(() =>
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

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

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
});

test('a validation 422 lists each check message under its line plus the summary panel and the builder link', async () => {
  const { user } = await seedStudentWithPlan();

  server.use(
    http.post(`${env.API_URL}/plan/submit`, async () =>
      networkDelay().then(() =>
        HttpResponse.json(
          {
            message: 'The given data was invalid.',
            key: 'plan.validation',
            errors: {
              allowance: [
                'Your course load is above the allowed limit for the term.',
              ],
              'map_membership.CS 201': [
                'CS 201 is not in your course map. Remove it or pick a mapped course.',
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

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

  await userEvent.click(
    await screen.findByRole('button', { name: /submit plan/i }),
  );

  const panel = await screen.findByRole('region', { name: /validation/i });
  expect(panel).toHaveTextContent(
    'Your course load is above the allowed limit for the term.',
  );
  expect(panel).toHaveTextContent(
    'CS 201 is not in your course map. Remove it or pick a mapped course.',
  );
  expect(panel).toHaveTextContent(
    'CS 301 requires CS 201 first. Complete the missing prerequisites or pick an eligible course.',
  );

  const line = screen.getByText('CS 201').closest('li') as HTMLElement;
  expect(
    within(line).getByText(
      'CS 201 is not in your course map. Remove it or pick a mapped course.',
    ),
  ).toBeInTheDocument();

  expect(
    screen.getByText(
      'The checks below block submission. Edit in the Plan Builder to fix these.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Edit in the Plan Builder' }),
  ).toHaveAttribute('href', '/app/builder');
});

test('a 503 submit renders the destructive retry banner at the CTA', async () => {
  const { user } = await seedStudentWithPlan();

  server.use(
    http.post(`${env.API_URL}/plan/submit`, async () =>
      networkDelay().then(() =>
        HttpResponse.json(
          {
            message: 'The registration service is unavailable.',
            key: 'plan.window_unavailable',
          },
          { status: 503, headers: { 'x-request-id': 'req-503' } },
        ),
      ),
    ),
  );

  await renderApp(<PlanRoute />, { user, path: '/app/plan', url: '/app/plan' });

  await userEvent.click(
    await screen.findByRole('button', { name: /submit plan/i }),
  );

  expect(
    await screen.findByText('Your plan was not submitted'),
  ).toBeInTheDocument();
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByText('Request reference: req-503')).toBeInTheDocument();
  expect(
    within(screen.getByRole('alert')).getByRole('button', {
      name: /retry/i,
    }),
  ).toBeInTheDocument();
});
