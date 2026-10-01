import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { PlannedCourse, Plan } from '@/types/domain';

import { db } from '../db';
import { CURRENT_TERM, requireAuth } from '../mock-auth';
import { deniesPermission, injectsErrors } from '../scenarios';
import { networkDelay } from '../utils';

const parsePlan = (row: {
  id: unknown;
  status: string;
  term_code: string;
  summary: string | null;
  courses: string;
  warnings: string;
  total_credit_hours: number;
  submitted_at: string | null;
  decided_at: string | null;
  return_reason: string | null;
}): Plan => ({
  id: row.id as number,
  status: row.status as Plan['status'],
  term_code: row.term_code,
  summary: row.summary,
  courses: JSON.parse(row.courses) as PlannedCourse[],
  total_credit_hours: row.total_credit_hours,
  warnings: JSON.parse(row.warnings) as string[],
  submitted_at: row.submitted_at,
  decided_at: row.decided_at,
  return_reason: row.return_reason,
});

const planOf = (userId: number) =>
  db.plan.findFirst({ where: { userId: { equals: userId as number } } });

export const planHandlers = [
  http.get(`${env.API_URL}/plan`, async ({ request }) => {
    await networkDelay();
    if (injectsErrors()) {
      return HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      );
    }
    if (deniesPermission()) {
      return HttpResponse.json(
        { message: 'This action is unauthorized.' },
        { status: 403 },
      );
    }
    const user = requireAuth(request);
    const row = planOf(user.id as number);
    if (!row) {
      return HttpResponse.json({ message: 'No plan found.' }, { status: 404 });
    }
    return HttpResponse.json({ data: parsePlan(row) });
  }),

  http.post(`${env.API_URL}/plan`, async ({ request }) => {
    await networkDelay();
    const user = requireAuth(request);
    if (planOf(user.id as number)) {
      return HttpResponse.json(
        { message: 'An active plan already exists for this term.' },
        { status: 409 },
      );
    }
    if (!user.advisor_id) {
      return HttpResponse.json(
        { message: 'You have no assigned advisor yet.' },
        { status: 409 },
      );
    }
    const row = db.plan.create({
      userId: user.id as number,
      status: 'draft',
      term_code: CURRENT_TERM,
      courses: JSON.stringify([]),
      warnings: JSON.stringify([]),
      total_credit_hours: 0,
    });
    return HttpResponse.json({ data: parsePlan(row) }, { status: 201 });
  }),
];
