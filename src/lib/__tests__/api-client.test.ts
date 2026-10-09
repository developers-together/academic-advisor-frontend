import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { api } from '@/lib/api-client';
import { tokenStorage } from '@/lib/token-storage';
import { server } from '@/testing/mocks/server';

const endpoint = `${env.API_URL}/session-check`;

test('a late unauthorized response preserves the newer session', async () => {
  let release = () => {};
  let entered = () => {};
  const requestEntered = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const responseReady = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.get(endpoint, async () => {
      entered();
      await responseReady;
      return HttpResponse.json(
        { message: 'Unauthenticated.' },
        { status: 401 },
      );
    }),
  );
  tokenStorage.set('old-session');
  const pending = api.get('/session-check');
  await requestEntered;
  tokenStorage.set('new-session');
  release();

  await expect(pending).rejects.toMatchObject({ status: 401 });
  expect(tokenStorage.get()).toBe('new-session');
});

test('an unauthorized response expires its current session', async () => {
  server.use(
    http.get(endpoint, () =>
      HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 }),
    ),
  );
  tokenStorage.set('current-session');

  await expect(api.get('/session-check')).rejects.toMatchObject({
    status: 401,
  });
  expect(tokenStorage.get()).toBeNull();
});
