import { render as rtlRender, screen } from '@testing-library/react';
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
    messages: JSON.stringify([]),
    ...values,
  });
};

test('the empty conversation list renders the settled empty state with the new conversation action', async () => {
  await renderChat('/app/chat');

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
      updatedAt: '2026-10-02T14:30:00.000Z',
    });
    await seedConversation(userId, {
      id: 2,
      title: null,
      updatedAt: '2026-10-01T09:00:00.000Z',
    });
  });

  expect(
    await screen.findByText('Keeping my schedule steady'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(formatDateTime('2026-10-02T14:30:00.000Z')),
  ).toBeInTheDocument();

  const untitled = screen
    .getAllByRole('link', { name: /Untitled conversation/ })
    .find((link) => link.getAttribute('href') === '/app/chat/2');
  expect(untitled).toHaveTextContent(/^Untitled conversation/);
});

test('starting a conversation lands on the composer view with the suggested prompts', async () => {
  await renderChat('/app/chat');

  await screen.findByText('No conversations yet.');
  await userEvent.click(
    screen.getAllByRole('button', { name: 'New conversation' })[0],
  );

  expect(
    await screen.findByLabelText('Message your AI advisor'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Help me keep my current level steady this term.'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('My standing slipped last term and I want it back up.'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      'I want to aim higher than passing. What would excellence look like?',
    ),
  ).toBeInTheDocument();
});
