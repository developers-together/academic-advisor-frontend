import {
  fireEvent,
  render as rtlRender,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { AppProvider } from '@/app/provider';
import ChatRoute from '@/app/routes/app/chat';
import ConversationRoute from '@/app/routes/app/conversation';
import { env } from '@/config/env';
import { useTurnStreamStore } from '@/features/ai-chat/stores/turn-stream-store';
import { usePlan } from '@/features/plan/api/get-plan';
import { db } from '@/testing/mocks/db';
import { sseResponse } from '@/testing/mocks/handlers/plan-conversations';
import { server } from '@/testing/mocks/server';
import { createUser, loginAsUser, type MockUser } from '@/testing/test-utils';

const PlanProbe = () => {
  const plan = usePlan();
  return (
    <p data-testid="plan-courses">
      {plan.data?.courses.map((course) => course.course_code).join(',')}
    </p>
  );
};

const renderChat = async (url: string, user: MockUser, extra?: ReactNode) => {
  await loginAsUser(user);
  rtlRender(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/app/chat" element={<ChatRoute />} />
        <Route
          path="/app/chat/:conversationId"
          element={<ConversationRoute />}
        />
      </Routes>
      {extra}
    </MemoryRouter>,
    { wrapper: ({ children }) => <AppProvider>{children}</AppProvider> },
  );
  return { user };
};

const seedConversation = (
  userId: number,
  overrides: Record<string, unknown> = {},
) => {
  const values = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== null),
  );
  return db.planConversation.create({
    userId,
    messages: JSON.stringify([]),
    ...values,
  });
};

beforeEach(() => {
  useTurnStreamStore.setState({
    turns: {},
    toolEvents: {},
    submitSuggested: {},
    quotaExhausted: false,
  });
});

const typeMessage = async (message: string) => {
  const composer = await screen.findByLabelText('Message your AI advisor');
  await userEvent.type(composer, message);
  await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
};

const CONSTITUTION =
  'The AI advisor explains and drafts. Your advisor approves. Only you can submit.';

test('a missing conversation shows recovery without restarting its failed request', async () => {
  let requests = 0;
  server.use(
    http.get(`${env.API_URL}/plan-conversations/99999`, () => {
      requests += 1;
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }),
  );
  const user = await createUser();
  await renderChat('/app/chat/99999', user);
  const back = await screen.findByRole('button', { name: 'All conversations' });
  await userEvent.click(back);
  expect(await screen.findByLabelText('Message your AI advisor')).toBeEnabled();
  expect(requests).toBe(1);
});

test('an empty conversation shows goal suggestions without the removed disclaimer', async () => {
  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  expect(
    await screen.findByText('Help me keep my current level steady this term.'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('My standing slipped last term and I want it back up.'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      'I want to aim higher than passing. What would excellence look like?',
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText(CONSTITUTION)).not.toBeInTheDocument();
});

test('the transcript renders assistant bodies as markdown and user bodies as plain text', async () => {
  const user = await createUser();
  const conversation = seedConversation(user.id as number, {
    title: 'Keeping my schedule steady',
    messages: JSON.stringify([
      {
        id: 1,
        role: 'user',
        content: 'Can I take **CS 301** next term?',
        created_at: '2026-10-01T10:00:00.000Z',
      },
      {
        id: 2,
        role: 'assistant',
        content:
          'Yes. The credit range rule **REG-001** keeps your load between 12 and 18 credits.',
        created_at: '2026-10-01T10:00:05.000Z',
      },
    ]),
  });
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  const transcript = await screen.findByRole('list', {
    name: /conversation/i,
  });
  const strong = within(transcript).getByText('REG-001');
  expect(strong).toHaveProperty('tagName', 'STRONG');

  const userBubble = within(transcript).getByText(
    'Can I take **CS 301** next term?',
  );
  expect(userBubble).toBeInTheDocument();
});

test('sending a turn shows the typing indicator, streams the reply, and updates the conversation title', async () => {
  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  await typeMessage('How should I plan this term?');

  expect(
    screen.getAllByText('Your AI advisor is replying.').length,
  ).toBeGreaterThan(0);
  expect(screen.getByText('How should I plan this term?')).toBeInTheDocument();

  expect(
    await screen.findByText(/credit range stays inside 12 to 18/),
  ).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.queryAllByText('Your AI advisor is replying.')).toHaveLength(
      0,
    );
  });
  expect(screen.getByLabelText('Message your AI advisor')).toBeEnabled();
  await userEvent.click(
    screen.getByRole('button', { name: 'Conversation history' }),
  );
  await screen.findByText('How should I plan this...');
});

test('stopping the reply keeps the partial text and closes it with a Stopped line', async () => {
  server.use(
    http.post(`${env.API_URL}/plan-conversations/:conversation/turns`, () =>
      sseResponse(
        [
          {
            event: 'token',
            data: { turn_id: 'turn-stop', seq: 1, token: 'Partial ' },
          },
          {
            event: 'token',
            data: { turn_id: 'turn-stop', seq: 2, token: 'text so far' },
          },
          {
            event: 'turn.completed',
            data: { turn_id: 'turn-stop', seq: 3, title: null },
          },
        ],
        { gapMs: 1000 },
      ),
    ),
  );

  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  await typeMessage('Cut the reply early, please.');

  const partial = await screen.findByText(/Partial/);
  expect(partial).toBeInTheDocument();

  const composer = screen.getByLabelText('Message your AI advisor');
  await userEvent.type(composer, 'My next question');
  expect(composer).toHaveValue('My next question');

  await userEvent.click(screen.getByRole('button', { name: 'Stop reply' }));

  expect(await screen.findByText('Stopped.')).toBeInTheDocument();
  expect(screen.getByText(/Partial/)).toBeInTheDocument();
  expect(screen.getByLabelText('Message your AI advisor')).toBeEnabled();
  await expect(
    screen.findByText(/text so far/, {}, { timeout: 1800 }),
  ).rejects.toThrow();

  server.use(
    http.post(`${env.API_URL}/plan-conversations/:conversation/turns`, () =>
      sseResponse([
        {
          event: 'token',
          data: { turn_id: 'turn-next', seq: 1, token: 'Your next answer' },
        },
        {
          event: 'turn.completed',
          data: { turn_id: 'turn-next', seq: 2, title: null },
        },
      ]),
    ),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(await screen.findByText('Your next answer')).toBeInTheDocument();
  expect(screen.getByText(/Partial/)).toBeInTheDocument();
  expect(screen.getByText('My next question')).toBeInTheDocument();
});

test('an applied plan edit renders a localized system row with the isolated course code and refreshes the plan cache', async () => {
  server.use(
    http.post(
      `${env.API_URL}/plan-conversations/:conversation/turns`,
      async ({ request }) => {
        const auth = request.headers.get('authorization') ?? '';
        const userId = Number(/advaisor-mock-(\d+)$/.exec(auth)?.[1]);
        const row = db.plan.findFirst({
          where: { userId: { equals: userId } },
        });
        if (row) {
          const courses = JSON.parse(row.courses as string) as Array<{
            course_code: string;
            title: string | null;
            credits: number;
            reason: string | null;
          }>;
          db.plan.update({
            where: { id: { equals: row.id as number } },
            data: {
              courses: JSON.stringify(
                courses.concat({
                  course_code: 'CS 301',
                  title: null,
                  credits: 3,
                  reason: null,
                }),
              ),
            },
          });
        }
        return sseResponse([
          {
            event: 'tool.applied',
            data: {
              turn_id: 'turn-tool',
              seq: 1,
              tool: 'plan.add_course',
              payload: { course_code: 'CS 301' },
            },
          },
          {
            event: 'turn.completed',
            data: { turn_id: 'turn-tool', seq: 2, title: null },
          },
        ]);
      },
    ),
  );

  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  db.plan.create({
    userId: user.id as number,
    status: 'draft',
    term_code: '2026F',
    courses: JSON.stringify([
      { course_code: 'CS 201', title: null, credits: 3, reason: null },
    ]),
    warnings: JSON.stringify([]),
    total_credit_hours: 0,
  });
  await renderChat(
    `/app/chat/${conversation.id as number}`,
    user,
    <PlanProbe />,
  );

  await typeMessage('Add an algorithm course for me.');

  const toolLine = await screen.findByText(
    (_, element) =>
      element?.tagName === 'P' &&
      element.textContent === 'Added CS 301 to your plan.',
  );
  expect(within(toolLine).getByText('CS 301')).toHaveClass('bidi-code');
  await waitFor(() => {
    expect(screen.getByTestId('plan-courses')).toHaveTextContent(
      'CS 201,CS 301',
    );
  });
});

test('the composer counts down within 200 characters of the limit', async () => {
  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  const composer = await screen.findByLabelText('Message your AI advisor');
  expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  fireEvent.change(composer, {
    target: { value: 'a'.repeat(9950) },
  });
  expect(screen.getByText('50 characters left')).toBeInTheDocument();
});

const suggestFrames = sseResponse([
  {
    event: 'token',
    data: {
      turn_id: 'turn-suggest',
      seq: 1,
      token: 'Your plan looks complete and ready for the checks.',
    },
  },
  {
    event: 'submit.suggested',
    data: { turn_id: 'turn-suggest', seq: 2 },
  },
  {
    event: 'turn.completed',
    data: { turn_id: 'turn-suggest', seq: 3, title: null },
  },
]);

test('the submit suggestion card arms through the confirm dialog and the suggestion fills the composer', async () => {
  server.use(
    http.post(
      `${env.API_URL}/plan-conversations/:conversation/turns`,
      () => suggestFrames,
    ),
  );

  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  await typeMessage('I think my plan is complete now.');

  expect(await screen.findByText('Ready to submit?')).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: 'Confirm submission' }),
  );

  const dialog = screen.getByRole('dialog');
  expect(
    within(dialog).getByText(
      'This confirms you want to submit. Your next message lets your AI advisor submit the plan through the normal checks. Your advisor then reviews it.',
    ),
  ).toBeInTheDocument();
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Confirm submission' }),
  );

  expect(
    await screen.findByText(
      'Submission confirmed. Send a message and your AI advisor will submit your plan.',
    ),
  ).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: 'Please submit my plan now.' }),
  );
  expect(screen.getByLabelText('Message your AI advisor')).toHaveValue(
    'Please submit my plan now.',
  );
});

test('the armed state renders from the conversation submission_confirmed_at', async () => {
  const user = await createUser();
  const conversation = seedConversation(user.id as number, {
    title: 'Keeping my schedule steady',
    submission_confirmed_at: '2026-10-02T09:00:00.000Z',
    messages: JSON.stringify([
      {
        id: 1,
        role: 'user',
        content: 'Please submit my plan now.',
        created_at: '2026-10-01T10:00:00.000Z',
      },
    ]),
  });
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  expect(
    await screen.findByText(
      'Submission confirmed. Send a message and your AI advisor will submit your plan.',
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText('Ready to submit?')).not.toBeInTheDocument();
});

test('a submitted result renders the success row with a link to My Plan', async () => {
  server.use(
    http.post(`${env.API_URL}/plan-conversations/:conversation/turns`, () =>
      sseResponse([
        {
          event: 'submit.result',
          data: {
            turn_id: 'turn-result',
            seq: 1,
            status: 'submitted',
            plan_id: 5,
          },
        },
        {
          event: 'turn.completed',
          data: { turn_id: 'turn-result', seq: 2, title: null },
        },
      ]),
    ),
  );

  const user = await createUser();
  const conversation = seedConversation(user.id as number, {
    submission_confirmed_at: '2026-10-02T09:00:00.000Z',
  });
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  await typeMessage('Please submit my plan now.');

  expect(
    await screen.findByText('Your plan was submitted for review.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open My Plan' })).toHaveAttribute(
    'href',
    '/app/plan',
  );
  await waitFor(() => {
    expect(screen.getByLabelText('Message your AI advisor')).toBeEnabled();
  });
  expect(
    screen.getByText('Your plan was submitted for review.'),
  ).toBeInTheDocument();
});

test('a blocked result lists the server constraint messages', async () => {
  server.use(
    http.post(`${env.API_URL}/plan-conversations/:conversation/turns`, () =>
      sseResponse([
        {
          event: 'submit.result',
          data: {
            turn_id: 'turn-blocked',
            seq: 1,
            status: 'blocked',
            errors: {
              allowance: ['Your course load would exceed the 18 credit limit.'],
            },
          },
        },
        {
          event: 'turn.completed',
          data: { turn_id: 'turn-blocked', seq: 2, title: null },
        },
      ]),
    ),
  );

  const user = await createUser();
  const conversation = seedConversation(user.id as number, {
    submission_confirmed_at: '2026-10-02T09:00:00.000Z',
  });
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  await typeMessage('Please submit my plan now.');

  expect(await screen.findByText('Submission is blocked.')).toBeInTheDocument();
  expect(
    screen.getByText('Your course load would exceed the 18 credit limit.'),
  ).toBeInTheDocument();
});

test('a retryable mid-stream failure keeps partial text and Retry resends the same message', async () => {
  let turnHits = 0;
  server.use(
    http.post(
      `${env.API_URL}/plan-conversations/:conversation/turns`,
      async () => {
        turnHits += 1;
        return sseResponse([
          {
            event: 'token',
            data: { turn_id: 'turn-fail', seq: 1, token: 'Working on it' },
          },
          {
            event: 'error',
            data: {
              turn_id: 'turn-fail',
              seq: 2,
              code: 'turn_failed',
              retryable: true,
              key: 'advisor.turn_failed',
              message: 'The advisor reply failed. Nothing was lost.',
            },
          },
        ]);
      },
    ),
  );

  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  await typeMessage('Which electives fit my plan?');

  expect(await screen.findByText(/Working on it/)).toBeInTheDocument();
  expect(
    await screen.findByText('The advisor reply failed. Nothing was lost.'),
  ).toBeInTheDocument();
  expect(turnHits).toBe(1);

  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => {
    expect(turnHits).toBe(2);
  });
  expect(await screen.findByText(/Working on it/)).toBeInTheDocument();
});

test('a non-retryable failure offers no Retry and never auto-resumes', async () => {
  let turnHits = 0;
  server.use(
    http.post(
      `${env.API_URL}/plan-conversations/:conversation/turns`,
      async () => {
        turnHits += 1;
        return sseResponse([
          {
            event: 'token',
            data: { turn_id: 'turn-dead', seq: 1, token: 'Halfway' },
          },
          {
            event: 'error',
            data: {
              turn_id: 'turn-dead',
              seq: 2,
              code: 'turn_timeout',
              retryable: false,
              key: 'advisor.turn_timeout',
              message: 'The reply timed out.',
            },
          },
        ]);
      },
    ),
  );

  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  await typeMessage('Explain the rule for repeats.');

  expect(await screen.findByText('The reply timed out.')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Retry' }),
  ).not.toBeInTheDocument();
  await new Promise((resolve) => setTimeout(resolve, 1200));
  expect(turnHits).toBe(1);
});

test('the 429 quota disables the composer with the fixed copy, a builder link, and the draft back', async () => {
  server.use(
    http.post(`${env.API_URL}/plan-conversations/:conversation/turns`, () =>
      HttpResponse.json(
        {
          message: 'You have used your conversation limit for this term.',
          key: 'advisor.quota_exhausted',
        },
        { status: 429 },
      ),
    ),
  );

  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  const storageBefore = [
    ...Object.keys(window.localStorage),
    ...Object.keys(window.sessionStorage),
  ];
  await typeMessage('One more question, please.');

  expect(
    await screen.findByText(
      'You have used your conversation limit for this term. You can still edit and submit your plan in the Plan Builder.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Open Plan Builder' }),
  ).toHaveAttribute('href', '/app/builder');
  expect(screen.getByLabelText('Message your AI advisor')).toBeDisabled();
  expect(screen.getByLabelText('Message your AI advisor')).toHaveValue(
    'One more question, please.',
  );

  const storageAfter = [
    ...Object.keys(window.localStorage),
    ...Object.keys(window.sessionStorage),
  ];
  expect(storageAfter.filter((key) => !storageBefore.includes(key))).toEqual(
    [],
  );
});

test('a delayed transcript refresh keeps the sent message and streamed reply', async () => {
  server.use(
    http.post(`${env.API_URL}/plan-conversations/:conversation/turns`, () =>
      sseResponse([
        {
          event: 'token',
          data: {
            turn_id: 'delayed-save',
            seq: 1,
            token: 'Your next step is ready.',
          },
        },
        {
          event: 'turn.completed',
          data: { turn_id: 'delayed-save', seq: 2, title: null },
        },
      ]),
    ),
  );
  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);
  await typeMessage('Keep this message visible.');
  await screen.findByText('Your next step is ready.');
  await waitFor(() =>
    expect(
      useTurnStreamStore.getState().turns[String(conversation.id)],
    ).toBeUndefined(),
  );
  expect(
    await screen.findByText(
      'Your AI advisor has replied. Read the latest message.',
    ),
  ).toHaveAttribute('role', 'status');
  expect(screen.getByText('Keep this message visible.')).toBeInTheDocument();
  expect(screen.getByText('Your next step is ready.')).toBeInTheDocument();
});

test('an interrupted event stream retains the message and permits retry', async () => {
  server.use(
    http.post(`${env.API_URL}/plan-conversations/:conversation/turns`, () =>
      sseResponse([
        {
          event: 'token',
          data: { turn_id: 'interrupted', seq: 1, token: 'A partial answer' },
        },
      ]),
    ),
  );
  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);
  await typeMessage('Keep my interrupted question.');
  await screen.findByRole('button', { name: /^Retry$/ });
  expect(screen.getByText('Keep my interrupted question.')).toBeInTheDocument();
  expect(screen.getByText('A partial answer')).toBeInTheDocument();
  expect(screen.getByLabelText('Message your AI advisor')).toBeEnabled();
});
