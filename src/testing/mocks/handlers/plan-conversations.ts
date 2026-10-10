import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type {
  GoalSuggestions,
  PlanConversation,
  PlanConversationMessage,
  PlanGoal,
} from '@/types/domain';

import { db } from '../db';
import { requireAuth } from '../mock-auth';
import { quotaExhausted, registrationClosed } from '../scenarios';
import { networkDelay } from '../utils';

type ConversationRow = {
  id: number;
  userId: number;
  goal: string;
  title: string | null;
  submission_confirmed_at: string | null;
  messages: string;
  createdAt: string;
  updatedAt: string;
};

type StoredMessage = PlanConversationMessage;

const GOALS: PlanGoal[] = ['maintain', 'improve', 'excel'];

const goalSuggestions = (): GoalSuggestions => ({
  maintain: 'Help me keep my current level steady this term.',
  improve: 'My standing slipped last term and I want it back up.',
  excel: 'I want to aim higher than passing. What would excellence look like?',
});

const parseMessages = (row: ConversationRow): StoredMessage[] =>
  JSON.parse(row.messages) as StoredMessage[];

const toConversation = (row: ConversationRow): PlanConversation => {
  const messages = parseMessages(row);
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === 'user');
  return {
    id: row.id,
    goal: row.goal as PlanGoal,
    title: row.title ?? null,
    submission_confirmed_at: row.submission_confirmed_at ?? null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    messages,
    ...(lastUserMessage ? {} : { goal_suggestions: goalSuggestions() }),
  };
};

const conversationOf = (userId: number, id: number) =>
  db.planConversation.findFirst({
    where: { id: { equals: id }, userId: { equals: userId as number } },
  }) as ConversationRow | null;

const notFound = () =>
  HttpResponse.json({ message: 'No conversation found.' }, { status: 404 });

const sseGapMs = () => (import.meta.env.TEST ? 60 : 150);

export const sseResponse = (
  frames: Array<{ event: string; data: Record<string, unknown> }>,
  options: { gapMs?: number; onComplete?: () => void } = {},
) => {
  const encoder = new TextEncoder();
  let cancelled = false;
  const gapMs = options.gapMs ?? sseGapMs();
  return new HttpResponse(
    new ReadableStream({
      start(controller) {
        frames.forEach((frame, index) => {
          setTimeout(
            () => {
              if (cancelled) {
                return;
              }
              controller.enqueue(
                encoder.encode(
                  `event: ${frame.event}\ndata: ${JSON.stringify(frame.data)}\n\n`,
                ),
              );
              if (index === frames.length - 1) {
                options.onComplete?.();
                controller.close();
              }
            },
            gapMs * (index + 1),
          );
        });
      },
      cancel() {
        cancelled = true;
      },
    }),
    { headers: { 'content-type': 'text/event-stream' } },
  );
};

let turnCounter = 0;

const turnId = () => `turn-${Date.now()}-${++turnCounter}`;

const tokenFrames = (id: string, text: string) => {
  const chunks = text.match(/.{1,24}(\s|$)/g) ?? [text];
  return chunks.map((chunk, index) => ({
    event: 'token',
    data: { turn_id: id, seq: index + 1, token: chunk },
  }));
};

const appendMessage = (
  row: ConversationRow,
  message: Omit<StoredMessage, 'id' | 'created_at'>,
) => {
  const current = db.planConversation.findFirst({
    where: { id: { equals: row.id } },
  });
  const messages = parseMessages(current ?? row);
  const next: StoredMessage = {
    id: messages.length + 1,
    created_at: new Date().toISOString(),
    ...message,
  };
  db.planConversation.update({
    where: { id: { equals: row.id } },
    data: {
      messages: JSON.stringify(messages.concat(next)),
      updatedAt: new Date().toISOString(),
    },
  });
};

const planOf = (userId: number) =>
  db.plan.findFirst({ where: { userId: { equals: userId as number } } });

const submitOutcome = (userId: number) => {
  const row = planOf(userId);
  if (!row) {
    return {
      status: 'blocked' as const,
      errors: { allowance: ['You have no plan for this term yet.'] },
    };
  }
  if (registrationClosed()) {
    return {
      status: 'blocked' as const,
      errors: {
        window: [
          'Registration is closed. Your approved plan waits for the next window.',
        ],
      },
    };
  }
  if (row.courses === JSON.stringify([])) {
    return {
      status: 'blocked' as const,
      errors: {
        allowance: [
          'Your plan holds no courses yet. Add at least one course before submitting.',
        ],
      },
    };
  }
  db.plan.update({
    where: { id: { equals: row.id as number } },
    data: {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    },
  });
  return { status: 'submitted' as const, plan_id: row.id as number };
};

export const planConversationHandlers = [
  http.get(`${env.API_URL}/plan-conversations`, async ({ request }) => {
    await networkDelay();
    const user = requireAuth(request);
    const rows = db.planConversation
      .findMany({ where: { userId: { equals: user.id as number } } })
      .sort((a, b) =>
        (b.updatedAt as string).localeCompare(a.updatedAt as string),
      ) as ConversationRow[];
    return HttpResponse.json({
      data: rows.map((row) => ({
        id: row.id,
        goal: row.goal,
        title: row.title ?? null,
        submission_confirmed_at: row.submission_confirmed_at ?? null,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
      })),
    });
  }),

  http.post(`${env.API_URL}/plan-conversations`, async ({ request }) => {
    await networkDelay();
    const user = requireAuth(request);
    const body = (await request.json()) as { goal?: unknown };
    if (
      typeof body.goal !== 'string' ||
      !GOALS.includes(body.goal as PlanGoal)
    ) {
      return HttpResponse.json(
        {
          message: 'The given data was invalid.',
          errors: { goal: ['Pick one of the three goals.'] },
        },
        { status: 422 },
      );
    }
    const row = db.planConversation.create({
      userId: user.id as number,
      goal: body.goal,
      messages: JSON.stringify([]),
    }) as ConversationRow;
    return HttpResponse.json({ data: toConversation(row) }, { status: 201 });
  }),

  http.get(
    `${env.API_URL}/plan-conversations/:conversation`,
    async ({ request, params }) => {
      await networkDelay();
      const user = requireAuth(request);
      const row = conversationOf(
        user.id as number,
        Number(params.conversation),
      );
      if (!row) {
        return notFound();
      }
      return HttpResponse.json({ data: toConversation(row) });
    },
  ),

  http.post(
    `${env.API_URL}/plan-conversations/:conversation/turns`,
    async ({ request, params }) => {
      await networkDelay();
      const user = requireAuth(request);
      const row = conversationOf(
        user.id as number,
        Number(params.conversation),
      );
      if (!row) {
        return notFound();
      }
      if (quotaExhausted()) {
        return HttpResponse.json(
          {
            message:
              'You have used your conversation limit for this term. You can still edit and submit your plan in the Plan Builder.',
            key: 'advisor.quota_exhausted',
          },
          { status: 429 },
        );
      }
      const body = (await request.json()) as { message?: unknown };
      const message =
        typeof body.message === 'string' ? body.message.trim() : '';
      if (!message || message.length > 10000) {
        return HttpResponse.json(
          {
            message: 'The given data was invalid.',
            errors: { message: ['Write a message first.'] },
          },
          { status: 422 },
        );
      }
      appendMessage(row, { role: 'user', content: message });
      const id = turnId();
      if (row.submission_confirmed_at) {
        db.planConversation.update({
          where: { id: { equals: row.id } },
          data: { submission_confirmed_at: null as unknown as string },
        });
        const outcome = submitOutcome(user.id as number);
        const prose =
          outcome.status === 'submitted'
            ? 'Your plan passed the checks and is now with your advisor for review.'
            : 'Your plan could not be submitted yet. The reasons are listed below.';
        const frames = [
          ...tokenFrames(id, prose),
          {
            event: 'submit.result',
            data: { turn_id: id, seq: 0, ...outcome },
          },
          {
            event: 'turn.completed',
            data: { turn_id: id, seq: 0, title: null },
          },
        ].map((frame, index) => ({
          ...frame,
          data: { ...frame.data, seq: index + 1 },
        }));
        return sseResponse(frames, {
          onComplete: () =>
            appendMessage(row, { role: 'assistant', content: prose }),
        });
      }
      const reply =
        'Here is how I read your goal against your record. Your map leaves CS 301 eligible once CS 201 is done, and the credit range stays inside 12 to 18 with either choice. Want me to adjust the plan?';
      const frames = [
        ...tokenFrames(id, reply),
        {
          event: 'turn.completed',
          data: {
            turn_id: id,
            seq: 0,
            title:
              row.title ?? `${message.split(/\s+/).slice(0, 5).join(' ')}...`,
          },
        },
      ].map((frame, index) => ({
        ...frame,
        data: { ...frame.data, seq: index + 1 },
      }));
      return sseResponse(frames, {
        onComplete: () => {
          appendMessage(row, { role: 'assistant', content: reply });
          if (!row.title) {
            db.planConversation.update({
              where: { id: { equals: row.id } },
              data: {
                title: `${message.split(/\s+/).slice(0, 5).join(' ')}...`,
              },
            });
          }
        },
      });
    },
  ),

  http.post(
    `${env.API_URL}/plan-conversations/:conversation/submit-arm`,
    async ({ request, params }) => {
      await networkDelay();
      const user = requireAuth(request);
      const row = conversationOf(
        user.id as number,
        Number(params.conversation),
      );
      if (!row) {
        return notFound();
      }
      const confirmedAt = new Date().toISOString();
      db.planConversation.update({
        where: { id: { equals: row.id } },
        data: { submission_confirmed_at: confirmedAt },
      });
      return sseResponse([
        {
          event: 'submit.armed',
          data: {
            conversation_id: row.id,
            submission_confirmed_at: confirmedAt,
          },
        },
      ]);
    },
  ),
];
