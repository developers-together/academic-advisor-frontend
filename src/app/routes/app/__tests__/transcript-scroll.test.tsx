import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { AppProvider } from '@/app/provider';
import ChatRoute from '@/app/routes/app/chat';
import ConversationRoute from '@/app/routes/app/conversation';
import { env } from '@/config/env';
import { useTurnStreamStore } from '@/features/ai-chat/stores/turn-stream-store';
import { db } from '@/testing/mocks/db';
import { sseResponse } from '@/testing/mocks/handlers/plan-conversations';
import { server } from '@/testing/mocks/server';
import { createUser, loginAsUser, type MockUser } from '@/testing/test-utils';

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

const typeMessage = async (message: string) => {
  const composer = await screen.findByLabelText('Message your AI advisor');
  await userEvent.type(composer, message);
  await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
};

const SCROLL_BOX = { scrollHeight: 2000, clientHeight: 500 };

const mockScrollBox = (container: HTMLElement) => {
  Object.defineProperty(container, 'scrollHeight', {
    configurable: true,
    value: SCROLL_BOX.scrollHeight,
  });
  Object.defineProperty(container, 'clientHeight', {
    configurable: true,
    value: SCROLL_BOX.clientHeight,
  });
  container.scrollTop = SCROLL_BOX.scrollHeight - SCROLL_BOX.clientHeight;
  const scrollTo = vi.fn();
  Object.defineProperty(container, 'scrollTo', {
    configurable: true,
    value: scrollTo,
  });
  return scrollTo;
};

beforeEach(() => {
  useTurnStreamStore.setState({
    turns: {},
    toolEvents: {},
    submitResults: {},
    submitSuggested: {},
    quotaExhausted: false,
  });
});

test('the transcript follows stream tokens while pinned and stops after the user scrolls up', async () => {
  server.use(
    http.post(`${env.API_URL}/plan-conversations/:conversation/turns`, () =>
      sseResponse(
        [
          {
            event: 'token',
            data: { turn_id: 'turn-follow', seq: 1, token: 'First ' },
          },
          {
            event: 'token',
            data: { turn_id: 'turn-follow', seq: 2, token: 'second ' },
          },
          {
            event: 'token',
            data: { turn_id: 'turn-follow', seq: 3, token: 'third part.' },
          },
          {
            event: 'turn.completed',
            data: { turn_id: 'turn-follow', seq: 4, title: null },
          },
        ],
        { gapMs: 400 },
      ),
    ),
  );

  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  const container = await screen.findByTestId('transcript-scroll');
  const scrollTo = mockScrollBox(container);

  await typeMessage('Walk me through the plan.');

  expect(await screen.findByText('First')).toBeInTheDocument();
  expect(scrollTo).toHaveBeenCalledWith({
    top: SCROLL_BOX.scrollHeight,
    behavior: 'auto',
  });

  fireEvent.scroll(container, { target: { scrollTop: 0 } });
  scrollTo.mockClear();

  expect(await screen.findByText(/second/)).toBeInTheDocument();
  await screen.findByText(/third part/);
  expect(scrollTo).not.toHaveBeenCalled();
});

test('scrolling up unpins the transcript and Jump to latest scrolls back and re-pins', async () => {
  const user = await createUser();
  const conversation = seedConversation(user.id as number, {
    title: 'Keeping my schedule steady',
    messages: JSON.stringify([
      {
        id: 1,
        role: 'user',
        content: 'How should I plan this term?',
        created_at: '2026-10-01T10:00:00.000Z',
      },
      {
        id: 2,
        role: 'assistant',
        content: 'Balance your core requirements first.',
        created_at: '2026-10-01T10:00:05.000Z',
      },
    ]),
  });
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  const container = await screen.findByTestId('transcript-scroll');
  const scrollTo = mockScrollBox(container);

  expect(
    screen.queryByRole('button', { name: 'Jump to latest' }),
  ).not.toBeInTheDocument();

  fireEvent.scroll(container, { target: { scrollTop: 0 } });

  const jump = screen.getByRole('button', { name: 'Jump to latest' });
  await userEvent.click(jump);

  expect(scrollTo).toHaveBeenCalledWith({
    top: SCROLL_BOX.scrollHeight,
    behavior: 'smooth',
  });
  expect(
    screen.queryByRole('button', { name: 'Jump to latest' }),
  ).not.toBeInTheDocument();
});

test('sending always scrolls down, even from an unpinned transcript', async () => {
  server.use(
    http.post(`${env.API_URL}/plan-conversations/:conversation/turns`, () =>
      sseResponse([
        {
          event: 'turn.completed',
          data: { turn_id: 'turn-send', seq: 1, title: null },
        },
      ]),
    ),
  );

  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  const container = await screen.findByTestId('transcript-scroll');
  const scrollTo = mockScrollBox(container);

  fireEvent.scroll(container, { target: { scrollTop: 0 } });
  expect(
    screen.getByRole('button', { name: 'Jump to latest' }),
  ).toBeInTheDocument();
  scrollTo.mockClear();

  await typeMessage('One more question.');

  expect(scrollTo).toHaveBeenCalledWith({
    top: SCROLL_BOX.scrollHeight,
    behavior: 'auto',
  });
  expect(
    screen.queryByRole('button', { name: 'Jump to latest' }),
  ).not.toBeInTheDocument();
});

test('jumping respects prefers-reduced-motion with an instant scroll', async () => {
  window.matchMedia = (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });

  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  const container = await screen.findByTestId('transcript-scroll');
  const scrollTo = mockScrollBox(container);

  fireEvent.scroll(container, { target: { scrollTop: 0 } });
  await userEvent.click(screen.getByRole('button', { name: 'Jump to latest' }));

  expect(scrollTo).toHaveBeenCalledWith({
    top: SCROLL_BOX.scrollHeight,
    behavior: 'auto',
  });
});

test('intermediate scroll frames of a jump animation do not unpin the transcript', async () => {
  const user = await createUser();
  const conversation = seedConversation(user.id as number);
  await renderChat(`/app/chat/${conversation.id as number}`, user);

  const container = await screen.findByTestId('transcript-scroll');
  mockScrollBox(container);

  fireEvent.scroll(container, { target: { scrollTop: 0 } });
  fireEvent.click(screen.getByRole('button', { name: 'Jump to latest' }));

  fireEvent.scroll(container, { target: { scrollTop: 800 } });
  expect(
    screen.queryByRole('button', { name: 'Jump to latest' }),
  ).not.toBeInTheDocument();

  fireEvent.scroll(container, { target: { scrollTop: 1500 } });
  expect(
    screen.queryByRole('button', { name: 'Jump to latest' }),
  ).not.toBeInTheDocument();

  await new Promise((resolve) => setTimeout(resolve, 700));

  fireEvent.scroll(container, { target: { scrollTop: 300 } });
  expect(
    screen.getByRole('button', { name: 'Jump to latest' }),
  ).toBeInTheDocument();
});
