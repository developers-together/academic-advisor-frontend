import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import type { Scenario } from '../scenarios';
import { scenarios, setScenario } from '../scenarios';
import { networkDelay } from '../utils';

import { academicRecordHandlers } from './academic-record';
import { adminHandlers } from './admin';
import { advisorHandlers } from './advisor';
import { authHandlers } from './auth';
import { governanceHandlers } from './governance';
import { notificationsHandlers } from './notifications';
import { planHandlers } from './plan';
import { planConversationHandlers } from './plan-conversations';

export const handlers = [
  ...authHandlers,
  ...planHandlers,
  ...planConversationHandlers,
  ...academicRecordHandlers,
  ...advisorHandlers,
  ...notificationsHandlers,
  ...governanceHandlers,
  ...adminHandlers,
  http.get(`${env.API_URL}/healthcheck`, async () => {
    await networkDelay();
    return HttpResponse.json({ ok: true });
  }),
  // Scenario switching for Playwright and the standalone mock server.
  // Browser dev switches with ?scenario= before the worker starts.
  http.post(`${env.API_URL}/__mocks/scenario`, async ({ request }) => {
    const body = (await request.json()) as { name?: Scenario };
    if (!body.name || !scenarios.includes(body.name)) {
      return HttpResponse.json(
        { message: 'Unknown scenario.' },
        { status: 422 },
      );
    }
    setScenario(body.name);
    return HttpResponse.json({ scenario: body.name });
  }),
];
