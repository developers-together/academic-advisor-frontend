import { db, resetDb } from './db';

test('reset removes in-memory models and persisted browser data', () => {
  db.user.create({
    id: 701,
    name: 'Test student',
    email: 'reset@ejust.edu.eg',
  });
  db.notification.create({
    id: 'reset-notice',
    userId: 701,
    title: 'Test notice',
  });
  localStorage.setItem('msw-db', JSON.stringify({ user: [{ id: 701 }] }));

  resetDb();

  expect(db.user.getAll()).toEqual([]);
  expect(db.notification.getAll()).toEqual([]);
  expect(localStorage.getItem('msw-db')).toBeNull();
});
