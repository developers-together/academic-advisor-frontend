import { act, render } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { MemoryRouter } from 'react-router';

import { AppProvider } from '@/app/provider';
import { env } from '@/config/env';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { server } from '@/testing/mocks/server';
import { createUser, loginAsUser } from '@/testing/test-utils';

const setTabVisible = (visible: boolean) => {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (visible ? 'visible' : 'hidden'),
  });
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => !visible,
  });
  window.dispatchEvent(new Event('visibilitychange'));
};

test('the 30-second poll pauses when the tab hides and resumes on return', async () => {
  const student = await createUser();
  await loginAsUser(student);

  let listReads = 0;
  server.use(
    http.get(`${env.API_URL}/notifications`, () => {
      listReads += 1;
      return HttpResponse.json({ data: [], unread_count: 0 });
    }),
  );

  vi.useFakeTimers();
  try {
    render(
      <MemoryRouter>
        <NotificationBell forRole="student" />
      </MemoryRouter>,
      { wrapper: ({ children }) => <AppProvider>{children}</AppProvider> },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    const readsAfterLoad = listReads;
    expect(readsAfterLoad).toBeGreaterThanOrEqual(1);

    setTabVisible(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(90_000);
    });
    expect(listReads).toBe(readsAfterLoad);

    setTabVisible(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(35_000);
    });
    expect(listReads).toBeGreaterThan(readsAfterLoad);
  } finally {
    setTabVisible(true);
    vi.useRealTimers();
  }
});
