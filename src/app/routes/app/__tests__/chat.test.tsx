import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';

import { AppProvider } from '@/app/provider';
import ChatRoute from '@/app/routes/app/chat';
import ConversationRoute from '@/app/routes/app/conversation';
import { formatDateTime } from '@/lib/i18n/format';
import { db } from '@/testing/mocks/db';
import { createUser, loginAsUser } from '@/testing/test-utils';

const renderChat = async (
  url: string,
  seed?: (userId: number) => Promise<void>,
) => {
  const user = await createUser();
  await loginAsUser(user);
  await seed?.(user.id as number);

  rtlRender(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/app/chat" element={<ChatRoute />} />
        <Route
          path="/app/chat/:conversationId"
          element={<ConversationRoute />}
        />
      </Routes>
    </MemoryRouter>,
    { wrapper: ({ children }) => <AppProvider>{children}</AppProvider> },
  );
  await screen.findByRole('heading', { name: 'AI Advisor' });
  return { user };
};

const seedConversation = async (
  userId: number,
  overrides: Record<string, unknown> = {},
) => {
  const values = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== null),
  );
  return db.planConversation.create({
    userId,
    goal: 'maintain',
    messages: JSON.stringify([]),
    ...values,
  });
};

test('the empty conversation list renders the settled empty state with the new conversation action', async () => {
  await renderChat('/app/chat');

  await userEvent.click(
    screen.getByRole('button', { name: 'Conversation history' }),
  );
  expect(await screen.findByText('No conversations yet.')).toBeInTheDocument();
  expect(
    screen.getByText('Start one and your AI advisor will help you plan.'),
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole('button', { name: 'New conversation' }).length,
  ).toBeGreaterThan(0);
});

test('the conversation list shows each conversation with its title and updated time', async () => {
  await renderChat('/app/chat', async (userId) => {
    await seedConversation(userId, {
      id: 1,
      title: 'Keeping my schedule steady',
      goal: 'maintain',
      updatedAt: '2026-10-02T14:30:00.000Z',
    });
    await seedConversation(userId, {
      id: 2,
      title: null,
      goal: 'excel',
      updatedAt: '2026-10-01T09:00:00.000Z',
    });
  });

  await userEvent.click(
    screen.getByRole('button', { name: 'Conversation history' }),
  );
  expect(
    await screen.findByText('Keeping my schedule steady'),
  ).toBeInTheDocument();
  expect(screen.queryByText('Maintain my level')).not.toBeInTheDocument();
  expect(
    screen.getByText(formatDateTime('2026-10-02T14:30:00.000Z')),
  ).toBeInTheDocument();

  const untitled = screen
    .getAllByRole('link', { name: /New conversation/ })
    .find((link) => link.getAttribute('href') === '/app/chat/2');
  expect(untitled).toHaveTextContent(/^New conversation/);
});

test('New conversation opens a blank composer without creating an empty conversation', async () => {
  await renderChat('/app/chat');
  await userEvent.click(
    screen.getAllByRole('button', { name: 'New conversation' })[0],
  );
  expect(
    await screen.findByRole('button', { name: 'Send message' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toBeInTheDocument();
  expect(
    screen.queryByText('What do you want from this conversation?'),
  ).not.toBeInTheDocument();
  const conversations = db.planConversation.getAll();
  expect(conversations).toHaveLength(0);
});

test('a starter prompt becomes a draft and never sends without the student', async () => {
  await renderChat('/app/chat');
  await userEvent.click(
    await screen.findByRole('button', { name: 'Explain my prerequisites' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('textbox')).toHaveValue('Explain my prerequisites'),
  );
  expect(db.planConversation.getAll()).toHaveLength(0);
});

test('one send creates a conversation and sends its first message exactly once', async () => {
  await renderChat('/app/chat');
  await userEvent.type(
    screen.getByRole('textbox', { name: 'Message your AI advisor' }),
    'Help me review CS 201.',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(await screen.findByText('Help me review CS 201.')).toBeInTheDocument();
  await waitFor(() => {
    const conversations = db.planConversation.getAll();
    expect(conversations).toHaveLength(1);
    const messages = JSON.parse(conversations[0].messages as string) as {
      role: string;
      content: string;
    }[];
    expect(messages.filter((message) => message.role === 'user')).toEqual([
      expect.objectContaining({ content: 'Help me review CS 201.' }),
    ]);
  });
  await screen.findByText(/credit range stays inside 12 to 18/);
  await waitFor(() => {
    const messages = JSON.parse(
      db.planConversation.getAll()[0].messages as string,
    ) as { role: string }[];
    expect(messages.map((message) => message.role)).toEqual([
      'user',
      'assistant',
    ]);
  });
  expect(screen.getByRole('textbox')).toHaveValue('');
});
