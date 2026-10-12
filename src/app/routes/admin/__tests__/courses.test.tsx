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

test('creating a course with prerequisites stores and shows them', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  db.course.create({
    id: 1,
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

  await userEvent.type(
    within(dialog).getByRole('combobox', { name: 'Add prerequisite' }),
    'MATH',
  );
  await userEvent.click(
    screen.getByRole('option', { name: 'MATH 101 Calculus I' }),
  );
  expect(
    within(dialog).getByRole('button', { name: 'Remove MATH 101' }),
  ).toBeInTheDocument();

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Create course' }),
  );

  await waitFor(() =>
    expect(
      db.course.findFirst({ where: { code: { equals: 'CS 402' } } })
        ?.prerequisite_course_codes,
    ).toEqual(['MATH 101']),
  );
  const row = await screen
    .findByText('Machine Learning')
    .then((title) => title.closest('tr'));
  expect(row).toHaveTextContent('MATH 101');
});

test('editing prerequisites adds and removes them', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  db.course.create({
    id: 1,
    code: 'MATH 101',
    title_en: 'Calculus I',
    title_ar: null,
    credits: 3,
    level: 1,
  });
  db.course.create({
    id: 2,
    code: 'ACC 111',
    title_en: 'Accounting Principles',
    title_ar: null,
    credits: 3,
    level: 1,
  });
  db.course.create({
    id: 3,
    code: 'CS 201',
    title_en: 'Data Structures',
    title_ar: null,
    credits: 3,
    level: 2,
    prerequisite_course_codes: ['MATH 101'],
  });

  await renderApp(<AdminCoursesRoute />, {
    user: admin,
    path: '/admin/courses',
    url: '/admin/courses',
  });

  const row = await screen
    .findByText('Data Structures')
    .then((title) => title.closest('tr') as HTMLTableRowElement);
  await userEvent.click(within(row).getByRole('button', { name: 'Edit' }));

  const dialog = await screen.findByRole('dialog', { name: 'Edit CS 201' });
  expect(
    within(dialog).getByRole('button', { name: 'Remove MATH 101' }),
  ).toBeInTheDocument();

  await userEvent.type(
    within(dialog).getByRole('combobox', { name: 'Add prerequisite' }),
    'ACC',
  );
  await userEvent.click(
    screen.getByRole('option', { name: 'ACC 111 Accounting Principles' }),
  );
  expect(
    within(dialog).getByRole('button', { name: 'Remove ACC 111' }),
  ).toBeInTheDocument();

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Remove MATH 101' }),
  );
  expect(
    within(dialog).queryByRole('button', { name: 'Remove MATH 101' }),
  ).not.toBeInTheDocument();

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save changes' }),
  );

  await waitFor(() =>
    expect(
      db.course.findFirst({ where: { code: { equals: 'CS 201' } } })
        ?.prerequisite_course_codes,
    ).toEqual(['ACC 111']),
  );
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

test('saving a course without credit hours shows a field error and saves nothing', async () => {
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
  await userEvent.clear(within(dialog).getByLabelText('Credits'));
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Create course' }),
  );

  expect(
    await within(dialog).findByRole('alert', {
      name: 'Enter credit hours from 1 to 6.',
    }),
  ).toBeInTheDocument();
  expect(
    db.course.findFirst({ where: { code: { equals: 'CS 402' } } }),
  ).toBeNull();
});

test('saving a course with more than six credit hours shows a field error and saves nothing', async () => {
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
  const credits = within(dialog).getByLabelText('Credits');
  await userEvent.clear(credits);
  await userEvent.type(credits, '9');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Create course' }),
  );

  expect(
    await within(dialog).findByRole('alert', {
      name: 'Enter credit hours from 1 to 6.',
    }),
  ).toBeInTheDocument();
  expect(
    db.course.findFirst({ where: { code: { equals: 'CS 402' } } }),
  ).toBeNull();
});

test('saving a course with a level outside 1 to 8 shows a field error and saves nothing', async () => {
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
  const level = within(dialog).getByLabelText('Level');
  await userEvent.type(level, '9');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Create course' }),
  );

  expect(
    await within(dialog).findByRole('alert', {
      name: 'Enter a level from 1 to 8.',
    }),
  ).toBeInTheDocument();
  expect(
    db.course.findFirst({ where: { code: { equals: 'CS 402' } } }),
  ).toBeNull();
});

test('saving a course with no level saves it without one', async () => {
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

  const row = await screen.findByText('CS 402');
  expect(row).toBeInTheDocument();
  expect(
    db.course.findFirst({ where: { code: { equals: 'CS 402' } } })?.level,
  ).toBeNull();
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
