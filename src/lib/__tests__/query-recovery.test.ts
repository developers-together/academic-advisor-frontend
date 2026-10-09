import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { server } from '@/testing/mocks/server';

import { api } from '../api-client';
import { queryConfig } from '../react-query';

const endpoint = '*/transient-recovery';

test('a read recovers from one temporary server failure without a page refresh', async () => {
  let requests = 0;
  server.use(
    http.get(endpoint, () => {
      requests += 1;
      return requests === 1
        ? new HttpResponse(null, { status: 503 })
        : HttpResponse.json({ ready: true });
    }),
  );
  const client = new QueryClient({ defaultOptions: queryConfig });
  const result = await client.fetchQuery({
    queryKey: ['recovery'],
    queryFn: () => api.get('/transient-recovery'),
  });
  expect(result).toEqual({ ready: true });
  expect(requests).toBe(2);
  client.clear();
});

test('a forbidden read fails once and does not repeat the request', async () => {
  let requests = 0;
  server.use(
    http.get(endpoint, () => {
      requests += 1;
      return new HttpResponse(null, { status: 403 });
    }),
  );
  const client = new QueryClient({ defaultOptions: queryConfig });
  await expect(
    client.fetchQuery({
      queryKey: ['forbidden'],
      queryFn: () => api.get('/transient-recovery'),
    }),
  ).rejects.toMatchObject({ status: 403 });
  expect(requests).toBe(1);
  client.clear();
});
