import { afterEach, expect, it, vi } from 'vitest';

const envState = vi.hoisted(() => ({ ENABLE_API_MOCKING: true }));
const workerStart = vi.hoisted(() => vi.fn());
const initializeDb = vi.hoisted(() => vi.fn());
const setScenario = vi.hoisted(() => vi.fn());

vi.mock('@/config/env', () => ({ env: envState }));
vi.mock('@/testing/mocks/browser', () => ({ worker: { start: workerStart } }));
vi.mock('@/testing/mocks/db', () => ({ initializeDb }));
vi.mock('@/testing/mocks/scenarios', () => ({
  scenarios: ['happy'],
  setScenario,
}));

import { enableMocking } from '../index';

afterEach(() => {
  vi.unstubAllEnvs();
  workerStart.mockClear();
  initializeDb.mockClear();
  setScenario.mockClear();
});

it('does not start the mock worker outside development', async () => {
  vi.stubEnv('DEV', false);
  envState.ENABLE_API_MOCKING = true;

  await enableMocking();

  expect(workerStart).not.toHaveBeenCalled();
  expect(initializeDb).not.toHaveBeenCalled();
});

it('starts the mock worker in development when API mocking is enabled', async () => {
  vi.stubEnv('DEV', true);
  envState.ENABLE_API_MOCKING = true;

  await enableMocking();

  expect(workerStart).toHaveBeenCalledWith({ onUnhandledRequest: 'bypass' });
  expect(initializeDb).toHaveBeenCalled();
  expect(setScenario).toHaveBeenCalledWith('happy');
});

it('does not start the mock worker in development when API mocking is disabled', async () => {
  vi.stubEnv('DEV', true);
  envState.ENABLE_API_MOCKING = false;

  await enableMocking();

  expect(workerStart).not.toHaveBeenCalled();
  expect(initializeDb).not.toHaveBeenCalled();
});
