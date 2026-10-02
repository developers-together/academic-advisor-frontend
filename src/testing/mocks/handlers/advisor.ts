import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { db } from '../db';
import { requireAuth } from '../mock-auth';
import { injectsErrors } from '../scenarios';
import { networkDelay } from '../utils';

export const advisorHandlers = [
  http.get(`${env.API_URL}/my/advisor`, async ({ request }) => {
    await networkDelay();
    if (injectsErrors()) {
      return HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      );
    }
    const user = requireAuth(request);
    const advisorId = user.advisor_id;
    const advisor = advisorId
      ? db.user.findFirst({ where: { id: { equals: advisorId as number } } })
      : null;
    if (!advisor) {
      return HttpResponse.json(
        { message: 'No advisor is assigned to you yet.' },
        { status: 404 },
      );
    }
    const profile = db.advisorProfile.findFirst({
      where: { advisorId: { equals: advisor.id as number } },
    });
    return HttpResponse.json({
      data: {
        advisor: { id: advisor.id, name: advisor.name },
        availability_window: {
          rows: profile ? JSON.parse(profile.rows) : [],
        },
      },
    });
  }),
];
