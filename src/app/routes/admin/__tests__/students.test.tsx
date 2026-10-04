import { HttpResponse, http } from 'msw';

import AdminStudentsRoute from '@/app/routes/admin/students';
import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
import { networkDelay } from '@/testing/mocks/utils';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';

beforeEach(() => {
  db.user.deleteMany({ where: {} });
});

const clearStudentId = (userId: number) =>
  db.user.update({
    where: { id: { equals: userId } },
    data: { student_id: null as unknown as string },
  });

const openPanel = async (name: string) => {
  await userEvent.click(
    await screen.findByRole('button', { name: `Manage ${name}` }),
  );
  return screen.findByRole('dialog', { name });
};

const advisorFor = async () =>
  createUser({
    name: 'Amr Advisor',
    email: 'advisor@ejust.edu.eg',
    role: 'advisor',
  });

test('the accounts table renders status, binding, and assignment badges with server search', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const advisor = await advisorFor();
  const suspended = await createUser({
    name: 'Basma Tariq',
    role: 'student',
    advisor_id: advisor.id as number,
  });
  db.user.update({
    where: { id: { equals: suspended.id as number } },
    data: { suspended_at: '2026-09-20T10:00:00.000Z' },
  });
  await createUser({
    name: 'Lina Majors',
    role: 'student',
    advisor_id: advisor.id as number,
  });
  const unassigned = await createUser({
    name: 'Omar Fathi',
    role: 'student',
  });
  clearStudentId(unassigned.id as number);

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });

  const basma = (await screen.findByText('Basma Tariq')).closest(
    'tr',
  ) as HTMLElement;
  expect(within(basma).getByText('Suspended')).toBeInTheDocument();
  expect(within(basma).getByText('Bound')).toBeInTheDocument();

  const lina = screen.getByText('Lina Majors').closest('tr') as HTMLElement;
  expect(within(lina).getByText('Active')).toBeInTheDocument();
  expect(within(lina).getByText('Bound')).toBeInTheDocument();
  expect(within(lina).getByText('Assigned')).toBeInTheDocument();
  expect(within(lina).queryByText('Amr Advisor')).not.toBeInTheDocument();

  const omar = screen.getByText('Omar Fathi').closest('tr') as HTMLElement;
  expect(within(omar).getByText('Binding pending')).toBeInTheDocument();
  expect(within(omar).getByText('Unassigned')).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText('Search students'), 'Lina');

  await waitFor(() =>
    expect(screen.queryByText('Basma Tariq')).not.toBeInTheDocument(),
  );
  await waitFor(() =>
    expect(screen.queryByText('Omar Fathi')).not.toBeInTheDocument(),
  );
  await screen.findByText('Lina Majors');
});

test('suspend and correct ID confirm with the settled copy; a bound account offers no ID edit', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const advisor = await advisorFor();
  const student = await createUser({
    name: 'Lina Majors',
    role: 'student',
    advisor_id: advisor.id as number,
  });

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });

  const panel = await openPanel('Lina Majors');
  expect(
    within(panel).getByText(/Bound to student ID 302/),
  ).toBeInTheDocument();
  expect(
    within(panel).queryByRole('button', { name: 'Correct student ID' }),
  ).not.toBeInTheDocument();

  await userEvent.click(within(panel).getByRole('button', { name: 'Suspend' }));

  const suspendConfirm = await screen.findByRole('dialog', {
    name: 'Suspend Lina Majors?',
  });
  expect(suspendConfirm).toHaveTextContent(
    'Suspension blocks login immediately and signs the student out.',
  );
  expect(
    within(suspendConfirm).getByRole('button', { name: 'Cancel' }),
  ).toHaveFocus();

  await userEvent.click(
    within(suspendConfirm).getByRole('button', { name: 'Suspend' }),
  );

  await waitFor(() =>
    expect(
      db.user.findFirst({ where: { id: { equals: student.id as number } } })
        ?.suspended_at,
    ).not.toBeNull(),
  );
  await waitFor(() =>
    expect(
      screen.queryByText('Suspension blocks login immediately'),
    ).not.toBeInTheDocument(),
  );
  const row = screen
    .getByRole('button', { name: 'Manage Lina Majors', hidden: true })
    .closest('tr') as HTMLElement;
  await within(row).findByText('Suspended');

  await userEvent.click(
    within(panel).getByRole('button', { name: 'Reactivate' }),
  );
  await waitFor(() =>
    expect(
      db.user.findFirst({ where: { id: { equals: student.id as number } } })
        ?.suspended_at,
    ).toBeNull(),
  );
  expect(
    await within(panel).findByText(/Bound to student ID 302/),
  ).toBeInTheDocument();
});

test('correcting the student ID requires the settled confirm and applies the new ID', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const student = await createUser({
    name: 'Faris Fail',
    role: 'student',
  });
  clearStudentId(student.id as number);
  db.user.update({
    where: { id: { equals: student.id as number } },
    data: { pending_admin_at: '2026-09-16T10:00:00.000Z' },
  });

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });

  const panel = await openPanel('Faris Fail');
  expect(
    within(panel).getByText(/no record for this account/),
  ).toBeInTheDocument();

  await userEvent.click(
    within(panel).getByRole('button', { name: 'Correct student ID' }),
  );
  await userEvent.type(
    within(panel).getByLabelText('New student ID'),
    '3020999',
  );
  await userEvent.click(within(panel).getByRole('button', { name: 'Save' }));

  const confirm = await screen.findByRole('dialog', {
    name: 'Set the student ID?',
  });
  expect(confirm).toHaveTextContent(
    'This sets the student ID for this account. The ID cannot be edited again.',
  );

  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Save student ID' }),
  );

  await waitFor(() =>
    expect(
      db.user.findFirst({ where: { id: { equals: student.id as number } } })
        ?.student_id,
    ).toBe('3020999'),
  );
  expect(
    await within(panel).findByText('Bound to student ID 3020999.'),
  ).toBeInTheDocument();
});

test('retrying the SIS check applies the returned user without a dialog', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const student = await createUser({
    name: 'Hana Held',
    role: 'student',
  });
  clearStudentId(student.id as number);

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });

  const panel = await openPanel('Hana Held');
  expect(
    within(panel).getByText(
      'The student ID binding has not completed yet. Retry the check.',
    ),
  ).toBeInTheDocument();

  await userEvent.click(
    within(panel).getByRole('button', { name: 'Retry SIS check' }),
  );

  await waitFor(() =>
    expect(
      db.user.findFirst({ where: { id: { equals: student.id as number } } })
        ?.student_id,
    ).toMatch(/^3020\d+$/),
  );
  expect(
    await within(panel).findByText(/Bound to student ID 3020/),
  ).toBeInTheDocument();
});

test('a 503 SIS check renders the retry banner scoped to the panel', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const student = await createUser({
    name: 'Hana Held',
    role: 'student',
  });
  clearStudentId(student.id as number);

  server.use(
    http.post(`${env.API_URL}/admin/students/:studentId/retry-sis`, async () =>
      networkDelay().then(() =>
        HttpResponse.json(
          {
            message: 'The student information system is unavailable.',
            key: 'sis.unavailable',
          },
          { status: 503, headers: { 'x-request-id': 'req-sis-503' } },
        ),
      ),
    ),
  );

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });

  const panel = await openPanel('Hana Held');
  await userEvent.click(
    within(panel).getByRole('button', { name: 'Retry SIS check' }),
  );

  const alert = await within(panel).findByRole('alert');
  expect(alert).toHaveTextContent(
    'The student information system is unavailable.',
  );
  expect(
    within(alert).getByRole('button', { name: 'Retry' }),
  ).toBeInTheDocument();
  expect(panel).toBeInTheDocument();
  expect(
    screen.queryByText('Could not load this content.'),
  ).not.toBeInTheDocument();
});

test('deleting the account confirms the caseload consequence and removes the row', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const advisor = await advisorFor();
  const student = await createUser({
    name: 'Lina Majors',
    role: 'student',
    advisor_id: advisor.id as number,
  });

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });

  const panel = await openPanel('Lina Majors');
  await userEvent.click(
    within(panel).getByRole('button', { name: 'Delete account' }),
  );

  const confirm = await screen.findByRole('dialog', {
    name: 'Delete Lina Majors?',
  });
  expect(confirm).toHaveTextContent(
    "This deletes the student account and removes the student from their advisor's caseload.",
  );

  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Delete account' }),
  );

  await waitFor(() =>
    expect(
      db.user.findFirst({ where: { id: { equals: student.id as number } } }),
    ).toBeNull(),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: 'Lina Majors' }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.queryByText('Lina Majors')).not.toBeInTheDocument();
});

test('reassigning moves the student to the advisor by email without a dialog', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const advisor = await advisorFor();
  const nextAdvisor = await createUser({
    name: 'Nadia Sherif',
    email: 'nadia.sherif@ejust.edu.eg',
    role: 'advisor',
  });
  const student = await createUser({
    name: 'Lina Majors',
    role: 'student',
    advisor_id: advisor.id as number,
  });

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });

  const panel = await openPanel('Lina Majors');
  await userEvent.type(
    within(panel).getByLabelText('Advisor email'),
    'nadia.sherif@ejust.edu.eg',
  );
  await userEvent.click(
    within(panel).getByRole('button', { name: 'Reassign' }),
  );

  await waitFor(() =>
    expect(
      db.user.findFirst({ where: { id: { equals: student.id as number } } })
        ?.advisor_id,
    ).toBe(nextAdvisor.id),
  );
  expect(
    await within(panel).findByText('Lina Majors moved to the new advisor.'),
  ).toBeInTheDocument();
  const row = screen
    .getByRole('button', { name: 'Manage Lina Majors', hidden: true })
    .closest('tr') as HTMLElement;
  await within(row).findByText('Assigned');
});

test('a true empty directory renders the no-rows empty state with the add action', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });
  expect(
    await screen.findByText('No student accounts yet.'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Add the first student account with their SIS ID.'),
  ).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Add student' })).toHaveLength(
    2,
  );

  await userEvent.click(
    screen.getAllByRole('button', { name: 'Add student' })[0],
  );
  expect(
    await screen.findByRole('dialog', { name: 'Add student' }),
  ).toBeInTheDocument();
});

test('adding a student creates the account, prepends the row, and surfaces the credentials', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  await createUser({ name: 'Lina Majors', role: 'student' });

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });
  await screen.findByText('Lina Majors');

  await userEvent.click(screen.getByRole('button', { name: 'Add student' }));
  const dialog = await screen.findByRole('dialog', { name: 'Add student' });

  await userEvent.type(
    within(dialog).getByLabelText('SIS student ID'),
    '3020801',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Display name'),
    'Laila Hassan',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Temporary password'),
    'temp12345',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Create account' }),
  );

  expect(
    await within(dialog).findByText(
      'Student account created. Share the temporary password with Laila Hassan through a safe channel.',
    ),
  ).toBeInTheDocument();
  expect(within(dialog).getByText('3020801')).toBeInTheDocument();
  expect(within(dialog).getByText('3020801@ejust.edu.eg')).toBeInTheDocument();
  expect(within(dialog).getByText('temp12345')).toBeInTheDocument();
  expect(screen.getByText('Student account created.')).toBeInTheDocument();

  const created = db.user.findFirst({
    where: { student_id: { equals: '3020801' } },
  });
  expect(created?.role).toBe('student');
  expect(created?.name).toBe('Laila Hassan');

  const lailaRow = screen
    .getByText('Laila Hassan')
    .closest('tr') as HTMLElement;
  const linaRow = screen.getByText('Lina Majors').closest('tr') as HTMLElement;
  expect(
    lailaRow.compareDocumentPosition(linaRow) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();

  await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: 'Add student' }),
    ).not.toBeInTheDocument(),
  );
});

test('a SIS-unknown ID renders the distinct 422 state and creates nothing', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  await createUser({ name: 'Lina Majors', role: 'student' });

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });
  await screen.findByText('Lina Majors');

  await userEvent.click(screen.getByRole('button', { name: 'Add student' }));
  const dialog = await screen.findByRole('dialog', { name: 'Add student' });

  await userEvent.type(
    within(dialog).getByLabelText('SIS student ID'),
    '3020404',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Display name'),
    'Laila Hassan',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Temporary password'),
    'temp12345',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Create account' }),
  );

  const alert = await within(dialog).findByRole('alert');
  expect(alert).toHaveTextContent(
    'The student information system has no student with this ID. Check the ID and try again.',
  );
  expect(
    db.user.findFirst({ where: { student_id: { equals: '3020404' } } }),
  ).toBeNull();
  expect(
    within(dialog).getByRole('button', { name: 'Create account' }),
  ).toBeInTheDocument();
});

test('a SIS outage on create renders the distinct 503 state', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  await createUser({ name: 'Lina Majors', role: 'student' });

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });
  await screen.findByText('Lina Majors');

  await userEvent.click(screen.getByRole('button', { name: 'Add student' }));
  const dialog = await screen.findByRole('dialog', { name: 'Add student' });

  await userEvent.type(
    within(dialog).getByLabelText('SIS student ID'),
    '3020503',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Display name'),
    'Laila Hassan',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Temporary password'),
    'temp12345',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Create account' }),
  );

  const alert = await within(dialog).findByRole('alert');
  expect(alert).toHaveTextContent(
    'The student information system is unavailable. Try again in a moment.',
  );
  expect(
    db.user.findFirst({ where: { student_id: { equals: '3020503' } } }),
  ).toBeNull();
});

test('the account panel edits name and language preference and keeps SIS fields read-only', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const student = await createUser({
    name: 'Lina Majors',
    role: 'student',
    faculty: 'Engineering',
  });

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });

  const panel = await openPanel('Lina Majors');
  await userEvent.click(
    within(panel).getByRole('button', { name: 'Edit account' }),
  );
  const dialog = await screen.findByRole('dialog', { name: 'Edit account' });

  const nameInput = await within(dialog).findByLabelText('Display name');
  expect(nameInput).toHaveValue('Lina Majors');
  expect(within(dialog).getByText(student.email)).toBeInTheDocument();
  expect(
    within(dialog).queryByDisplayValue(student.email),
  ).not.toBeInTheDocument();
  const studentId = db.user.findFirst({
    where: { id: { equals: student.id as number } },
  })?.student_id as string;
  expect(within(dialog).getByText(studentId)).toBeInTheDocument();
  expect(within(dialog).getByText('Engineering')).toBeInTheDocument();

  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, 'Lina Hassan Majors');
  await userEvent.selectOptions(
    within(dialog).getByLabelText('Language preference'),
    'ar',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save changes' }),
  );

  await waitFor(() =>
    expect(
      db.user.findFirst({ where: { id: { equals: student.id as number } } })
        ?.name,
    ).toBe('Lina Hassan Majors'),
  );
  expect(
    db.user.findFirst({ where: { id: { equals: student.id as number } } })
      ?.language_preference,
  ).toBe('ar');
  expect(await screen.findByText('Account updated.')).toBeInTheDocument();
  const row = screen
    .getByRole('button', { name: 'Manage Lina Hassan Majors', hidden: true })
    .closest('tr') as HTMLElement;
  await within(row).findByText('Lina Hassan Majors');
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: 'Edit account' }),
    ).not.toBeInTheDocument(),
  );
});

test('a server 422 on edit lands on the name field and keeps the dialog open', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const student = await createUser({
    name: 'Lina Majors',
    role: 'student',
  });

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });

  const panel = await openPanel('Lina Majors');
  await userEvent.click(
    within(panel).getByRole('button', { name: 'Edit account' }),
  );
  const dialog = await screen.findByRole('dialog', { name: 'Edit account' });
  await within(dialog).findByLabelText('Display name');

  server.use(
    http.patch(`${env.API_URL}/admin/students/:studentId`, () =>
      networkDelay().then(() =>
        HttpResponse.json(
          {
            message: 'The given data was invalid.',
            errors: { name: ['The registrar rejects this name.'] },
          },
          { status: 422 },
        ),
      ),
    ),
  );

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save changes' }),
  );

  expect(
    await within(dialog).findByText('The registrar rejects this name.'),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByRole('button', { name: 'Save changes' }),
  ).toBeInTheDocument();
  expect(
    db.user.findFirst({ where: { id: { equals: student.id as number } } })
      ?.name,
  ).toBe('Lina Majors');
});

test('a missed search renders the search empty state with a clear action', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  await createUser({ name: 'Lina Majors', role: 'student' });

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });
  await screen.findByText('Lina Majors');

  await userEvent.type(screen.getByLabelText('Search students'), 'zz');

  expect(
    await screen.findByText('No students match this search.'),
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(await screen.findByText('Lina Majors')).toBeInTheDocument();
});

test('a failed read renders the shared error state with retry', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  await createUser({ name: 'Lina Majors', role: 'student' });

  await renderApp(<AdminStudentsRoute />, {
    user: admin,
    path: '/admin/students',
    url: '/admin/students',
  });
  await screen.findByText('Lina Majors');

  server.use(
    http.get(`${env.API_URL}/admin/students`, () =>
      HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      ),
    ),
  );

  await userEvent.type(screen.getByLabelText('Search students'), 'a');
  expect(
    await screen.findByText('Could not load this content.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});
