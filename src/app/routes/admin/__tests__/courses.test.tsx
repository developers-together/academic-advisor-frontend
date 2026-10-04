import { db } from '@/testing/mocks/db';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';

import AdminCoursesRoute from '../courses';

beforeEach(() => {
  db.course.deleteMany({ where: {} });
});

test('creating a course adds it to the table with its credits', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminCoursesRoute />, {
    user: admin,
    path: '/admin/courses',
    url: '/admin/courses',
  });

  const addButtons = await screen.findAllByRole('button', {
    name: 'Add course',
  });
  await userEvent.click(addButtons[0]);

  const dialog = await screen.findByRole('dialog', { name: 'Add a course' });
  await userEvent.type(within(dialog).getByLabelText('Course code'), 'CS 402');
  await userEvent.type(
    within(dialog).getByLabelText('Title'),
    'Machine Learning',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Create course' }),
  );

  expect(await screen.findByText('CS 402')).toBeInTheDocument();
  expect(await screen.findByText('Machine Learning')).toBeInTheDocument();
});

test('editing credits updates the row', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  db.course.create({
    id: 1,
    code: 'CS 201',
    title_en: 'Data Structures',
    title_ar: null,
    credits: 3,
    level: 2,
  });

  await renderApp(<AdminCoursesRoute />, {
    user: admin,
    path: '/admin/courses',
    url: '/admin/courses',
  });

  await userEvent.click(await screen.findByRole('button', { name: /Edit/ }));

  const dialog = await screen.findByRole('dialog', { name: 'Edit CS 201' });
  const credits = within(dialog).getByLabelText('Credits');
  await userEvent.clear(credits);
  await userEvent.type(credits, '4');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save changes' }),
  );

  await waitFor(() =>
    expect(
      db.course.findFirst({ where: { code: { equals: 'CS 201' } } })?.credits,
    ).toBe(4),
  );
  expect(await screen.findByText('CS 201')).toBeInTheDocument();
});

test('deleting a course asks for confirmation and removes the row', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  db.course.create({
    id: 2,
    code: 'MATH 101',
    title_en: 'Calculus I',
    title_ar: null,
    credits: 3,
    level: 1,
  });

  await renderApp(<AdminCoursesRoute />, {
    user: admin,
    path: '/admin/courses',
    url: '/admin/courses',
  });

  await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

  const confirm = await screen.findByRole('dialog', {
    name: 'Delete MATH 101?',
  });
  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Delete' }),
  );

  await waitFor(() =>
    expect(
      db.course.findFirst({ where: { code: { equals: 'MATH 101' } } }),
    ).toBeNull(),
  );
  expect(await screen.findByText('No courses yet.')).toBeInTheDocument();
});
