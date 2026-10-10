import '@testing-library/jest-dom/vitest';

import { api } from '@/lib/api-client';
import { resetDb } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';

vi.mock('zustand');

api.interceptors.request.use(async (config) => {
  const data = config.data as unknown;
  if (typeof FormData === 'undefined' || !(data instanceof FormData)) {
    return config;
  }
  const boundary = `advaisor-test-${Math.random().toString(36).slice(2)}`;
  const parts: string[] = [];
  for (const [name, value] of data.entries()) {
    const payload = typeof value === 'string' ? value : await value.text();
    const contentType =
      typeof value === 'string'
        ? undefined
        : value.type || 'application/octet-stream';
    parts.push(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n${
        contentType ? `Content-Type: ${contentType}\r\n` : ''
      }\r\n${payload}\r\n`,
    );
  }
  parts.push(`--${boundary}--\r\n`);
  config.data = parts.join('');
  config.headers.setContentType(`multipart/form-data; boundary=${boundary}`);
  return config;
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(async () => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  Element.prototype.scrollTo = () => {};

  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });

  window.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
  window.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
});
afterEach(async () => {
  server.resetHandlers();
  await new Promise((resolve) => setTimeout(resolve, 50));
  resetDb();
});
