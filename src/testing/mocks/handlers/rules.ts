import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { UniversityRuleSummary } from '@/types/domain';

import { db } from '../db';
import { requireAuth } from '../mock-auth';
import { deniesPermission, injectsErrors } from '../scenarios';
import { networkDelay } from '../utils';

const unauthorised = () =>
  HttpResponse.json(
    { message: 'This action is unauthorized.' },
    { status: 403 },
  );

const ruleOf = (row: {
  id: unknown;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
}): UniversityRuleSummary => ({
  id: row.id as number,
  title_en: row.title_en,
  title_ar: row.title_ar,
  body_en: row.body_en,
  body_ar: row.body_ar,
});

export const rulesHandlers = [
  http.get(`${env.API_URL}/rules`, async ({ request }) => {
    if (injectsErrors()) {
      return HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      );
    }
    if (deniesPermission()) {
      return unauthorised();
    }
    requireAuth(request);
    await networkDelay();
    const rules: UniversityRuleSummary[] = db.rule
      .getAll()
      .sort((a, b) => a.title_en.localeCompare(b.title_en))
      .map((rule) => ruleOf(rule));
    return HttpResponse.json({ data: rules });
  }),
];
