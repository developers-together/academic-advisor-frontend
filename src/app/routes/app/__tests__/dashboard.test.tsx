import { db } from '@/testing/mocks/db';
import { CURRENT_TERM } from '@/testing/mocks/mock-auth';
import { createUser, renderApp, screen, userEvent } from '@/testing/test-utils';

import DashboardRoute from '../dashboard';

const seedPlan = async (
  userId: number,
  overrides: Record<string, unknown> = {},
) => {
  return db.plan.create({
    userId,
    status: 'draft',
    term_code: CURRENT_TERM,
    courses: JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
      { course_code: 'MATH 201', title: null, credits: 4, reason: null },
    ]),
    warnings: JSON.stringify([]),
    total_credit_hours: 0,
    ...overrides,
  });
};

test('shows the draft plan card with course count and builder CTA', async () => {
  const user = await createUser();
  await seedPlan(user.id as number);

  await renderApp(<DashboardRoute />, { user, path: '/app', url: '/app' });

  expect(await screen.findByText('2 courses planned')).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: /resume in builder/i }),
  ).toHaveAttribute('href', '/app/builder');
});

test('shows the empty state with the start action when no plan exists', async () => {
  const user = await createUser();

  await renderApp(<DashboardRoute />, { user, path: '/app', url: '/app' });

  expect(
    await screen.findByText('No plan for this term yet.'),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /start your plan/i }),
  ).toBeInTheDocument();
});

test('creates a plan from the empty state action', async () => {
  const user = await createUser({ advisor_id: 2 });

  await renderApp(<DashboardRoute />, { user, path: '/app', url: '/app' });

  expect(
    await screen.findByRole('button', { name: /start your plan/i }),
  ).toBeInTheDocument();

  await userEvent.click(
    screen.getByRole('button', { name: /start your plan/i }),
  );

  expect(await screen.findByText('0 courses planned')).toBeInTheDocument();
});
