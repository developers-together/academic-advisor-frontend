import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { AcademicRecord } from '@/types/domain';

import { db } from '../db';
import { requireAuth } from '../mock-auth';
import { deniesPermission, injectsErrors } from '../scenarios';
import { networkDelay } from '../utils';

export const academicRecordHandlers = [
  http.get(`${env.API_URL}/academic-record`, async ({ request }) => {
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
    const row = db.academicRecord.findFirst({
      where: { userId: { equals: user.id as number } },
    });
    if (!row) {
      return HttpResponse.json(
        { message: 'No academic record found.' },
        { status: 404 },
      );
    }
    const record = {
      cgpa: row.cgpa,
      curriculum_year_level: row.curriculum_year_level,
      history: JSON.parse(row.history),
      prerequisite_map: JSON.parse(row.prerequisite_map),
      last_synced_at: row.last_synced_at,
    } as unknown as AcademicRecord;
    return HttpResponse.json({ data: record });
  }),
];
