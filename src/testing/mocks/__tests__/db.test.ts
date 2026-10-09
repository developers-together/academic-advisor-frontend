import * as mockDb from '@/testing/mocks/db';

it('keeps the mock db in memory with no persisted loader', () => {
  expect(mockDb).not.toHaveProperty('loadDb');
  expect(mockDb).not.toHaveProperty('initializeDb');
});
