import { fireEvent } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import AdminAssignmentsRoute from '@/app/routes/admin/assignments';
import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';

const csvFile = (contents: string) =>
  new File([contents], 'caseloads.csv', { type: 'text/csv' });

const openDialog = async () => {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Import CSV' }),
  );
  return screen.findByRole('dialog', {
    name: 'Import assignments',
  });
};

const pickFile = async (file: File) => {
  const dialog = await openDialog();
  const input = within(dialog).getByLabelText('CSV or TXT file');
  await userEvent.upload(input, file);
  return dialog;
};

test('the caseloads table reads the students root with assignment badges and faculty', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const advisor = await createUser({
    name: 'Amr Advisor',
    email: 'amr.advisor@ejust.edu.eg',
    role: 'advisor',
    faculty: 'Engineering',
  });
  await createUser({
    name: 'Lina Majors',
    role: 'student',
    advisor_id: advisor.id as number,
    faculty: 'Engineering',
  });
  const unassigned = await createUser({
    name: 'Omar Fathi',
    role: 'student',
    faculty: 'Science',
  });
  db.user.update({
    where: { id: { equals: unassigned.id as number } },
    data: { student_id: null as unknown as string },
  });

  await renderApp(<AdminAssignmentsRoute />, {
    user: admin,
    path: '/admin/assignments',
    url: '/admin/assignments',
  });

  const lina = await screen.findByRole('row', { name: /Lina Majors/ });
  expect(within(lina).getByText('Assigned')).toBeInTheDocument();
  expect(within(lina).getByText('Engineering')).toBeInTheDocument();

  const omar = screen.getByRole('row', { name: /Omar Fathi/ });
  expect(within(omar).getByText('Unassigned')).toBeInTheDocument();
});

test('the import dialog rejects a wrong type or an oversized file inline', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminAssignmentsRoute />, {
    user: admin,
    path: '/admin/assignments',
    url: '/admin/assignments',
  });

  const wrongType = new File(['id'], 'caseloads.pdf', {
    type: 'application/pdf',
  });
  const dialog = await openDialog();
  fireEvent.change(within(dialog).getByLabelText('CSV or TXT file'), {
    target: { files: [wrongType] },
  });
  expect(
    await within(dialog).findByText('Use a .csv or .txt file.'),
  ).toBeInTheDocument();
  const oversized = new File(['x'], 'caseloads.csv', { type: 'text/csv' });
  Object.defineProperty(oversized, 'size', { value: 2049 * 1024 });
  fireEvent.change(within(dialog).getByLabelText('CSV or TXT file'), {
    target: { files: [oversized] },
  });
  expect(
    await within(dialog).findByText('Files are limited to 2048 KB.'),
  ).toBeInTheDocument();
  expect(
    within(dialog).queryByRole('dialog', { name: 'Import assignments?' }),
  ).not.toBeInTheDocument();
});

test('a confirmed import applies rows and renders the settled summary and toast', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const advisor = await createUser({
    name: 'Amr Advisor',
    email: 'amr.advisor@ejust.edu.eg',
    role: 'advisor',
  });
  const nextAdvisor = await createUser({
    name: 'Nadia Sherif',
    email: 'nadia.sherif@ejust.edu.eg',
    role: 'advisor',
  });
  const moved = await createUser({
    name: 'Lina Majors',
    role: 'student',
    student_id: '3020771',
    advisor_id: advisor.id as number,
  });
  const unchanged = await createUser({
    name: 'Omar Fathi',
    role: 'student',
    student_id: '3020772',
    advisor_id: nextAdvisor.id as number,
  });

  await renderApp(<AdminAssignmentsRoute />, {
    user: admin,
    path: '/admin/assignments',
    url: '/admin/assignments',
  });

  const dialog = await pickFile(
    csvFile(
      [
        'student_id,advisor_email',
        '3020771,nadia.sherif@ejust.edu.eg',
        '3020772,nadia.sherif@ejust.edu.eg',
      ].join('\n'),
    ),
  );

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Import assignments' }),
  );

  const confirm = await screen.findByRole('dialog', {
    name: 'Import assignments?',
  });
  expect(confirm).toHaveTextContent(
    'Applied rows move students to the named advisors immediately. Rows that already carry the advisor stay unchanged.',
  );
  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Import assignments' }),
  );

  expect(
    await within(dialog).findByText(
      'Import applied. 1 student moved. 1 already carried their advisor. 0 scheduled for registration.',
    ),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(
      useNotifications
        .getState()
        .notifications.some(
          (toast) =>
            toast.type === 'success' && toast.title === 'Import applied.',
        ),
    ).toBe(true),
  );

  await waitFor(() =>
    expect(
      db.user.findFirst({ where: { id: { equals: moved.id as number } } })
        ?.advisor_id,
    ).toBe(nextAdvisor.id),
  );
  expect(
    db.user.findFirst({ where: { id: { equals: unchanged.id as number } } })
      ?.advisor_id,
  ).toBe(nextAdvisor.id);
});

test('a failed import applies nothing and reports file and row errors capped at 20 rows', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const advisor = await createUser({
    name: 'Amr Advisor',
    email: 'amr.advisor@ejust.edu.eg',
    role: 'advisor',
  });
  const student = await createUser({
    name: 'Lina Majors',
    role: 'student',
    advisor_id: advisor.id as number,
  });

  const errors: Record<string, string[]> = {
    file: ['The header row needs student_id and advisor_email columns.'],
  };
  for (let row = 1; row <= 23; row += 1) {
    errors[`rows.${row}`] = ['No student carries this ID.'];
  }
  server.use(
    http.post(`${env.API_URL}/admin/assignments/import`, () =>
      HttpResponse.json(
        { message: 'The given data was invalid.', errors },
        { status: 422 },
      ),
    ),
  );

  await renderApp(<AdminAssignmentsRoute />, {
    user: admin,
    path: '/admin/assignments',
    url: '/admin/assignments',
  });

  const dialog = await pickFile(
    csvFile(
      ['student_id,advisor_email', '999999,amr.advisor@ejust.edu.eg'].join(
        '\n',
      ),
    ),
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Import assignments' }),
  );
  const confirm = await screen.findByRole('dialog', {
    name: 'Import assignments?',
  });
  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Import assignments' }),
  );

  const report = await within(dialog).findByText(
    'Nothing was applied. Fix the rows and import again.',
  );
  expect(report).toBeInTheDocument();
  expect(
    within(dialog).getByText(
      'The header row needs student_id and advisor_email columns.',
    ),
  ).toBeInTheDocument();
  expect(within(dialog).getByText('Row 1')).toBeInTheDocument();
  expect(within(dialog).getByText('Row 20')).toBeInTheDocument();
  expect(within(dialog).queryByText('Row 21')).not.toBeInTheDocument();
  expect(within(dialog).getByText('and 3 more rows')).toBeInTheDocument();

  expect(
    db.user.findFirst({ where: { id: { equals: student.id as number } } })
      ?.advisor_id,
  ).toBe(advisor.id);
});

const openAssignDialog = async () => {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Assign advisor' }),
  );
  return screen.findByRole('dialog', { name: 'Assign advisor' });
};

const fillAssignForm = async (
  dialog: HTMLElement,
  studentId: string,
  advisorEmail: string,
) => {
  await userEvent.type(
    within(dialog).getByLabelText('SIS student ID'),
    studentId,
  );
  await userEvent.selectOptions(
    await within(dialog).findByLabelText('Advisor'),
    advisorEmail,
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Assign advisor' }),
  );
};

test('assigning a registered student moves the student to the picked advisor', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const advisor = await createUser({
    name: 'Amr One',
    email: 'amr.one@ejust.edu.eg',
    role: 'advisor',
  });
  const student = await createUser({
    name: 'Lina Majors',
    role: 'student',
    student_id: '3021231',
  });

  await renderApp(<AdminAssignmentsRoute />, {
    user: admin,
    path: '/admin/assignments',
    url: '/admin/assignments',
  });

  const dialog = await openAssignDialog();
  await fillAssignForm(dialog, '3021231', 'amr.one@ejust.edu.eg');

  await waitFor(() =>
    expect(
      useNotifications
        .getState()
        .notifications.some(
          (toast) =>
            toast.type === 'success' && toast.title === 'Advisor assigned.',
        ),
    ).toBe(true),
  );
  await waitFor(() =>
    expect(
      db.user.findFirst({ where: { id: { equals: student.id as number } } })
        ?.advisor_id,
    ).toBe(advisor.id),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: 'Assign advisor' }),
    ).not.toBeInTheDocument(),
  );
  expect(
    db.pendingAssignment.findFirst({
      where: { student_id: { equals: '3021231' } },
    }),
  ).toBeNull();
});

test('assigning a never-registered student schedules the assignment and lists it as pending', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  await createUser({
    name: 'Amr Two',
    email: 'amr.two@ejust.edu.eg',
    role: 'advisor',
  });

  await renderApp(<AdminAssignmentsRoute />, {
    user: admin,
    path: '/admin/assignments',
    url: '/admin/assignments',
  });

  expect(
    await screen.findByText('No scheduled assignments.'),
  ).toBeInTheDocument();

  const dialog = await openAssignDialog();
  await fillAssignForm(dialog, '3029999', 'amr.two@ejust.edu.eg');

  await waitFor(() =>
    expect(
      useNotifications
        .getState()
        .notifications.some(
          (toast) =>
            toast.type === 'success' &&
            toast.title ===
              'Assignment scheduled. It applies when the student registers.',
        ),
    ).toBe(true),
  );
  const row = await screen.findByRole('row', { name: /3029999/ });
  expect(within(row).getByText('Amr Two')).toBeInTheDocument();
  expect(
    db.pendingAssignment.findFirst({
      where: { student_id: { equals: '3029999' } },
    }),
  ).not.toBeNull();
});

test('re-assigning the advisor a student already carries explains in a toast', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const advisor = await createUser({
    name: 'Amr Three',
    email: 'amr.three@ejust.edu.eg',
    role: 'advisor',
  });
  await createUser({
    name: 'Lina Majors',
    role: 'student',
    student_id: '3021232',
    advisor_id: advisor.id as number,
  });

  await renderApp(<AdminAssignmentsRoute />, {
    user: admin,
    path: '/admin/assignments',
    url: '/admin/assignments',
  });

  const dialog = await openAssignDialog();
  await fillAssignForm(dialog, '3021232', 'amr.three@ejust.edu.eg');

  await waitFor(() =>
    expect(
      useNotifications
        .getState()
        .notifications.some(
          (toast) =>
            toast.type === 'info' &&
            toast.title ===
              'This student already carries the selected advisor.',
        ),
    ).toBe(true),
  );
  expect(
    db.pendingAssignment.findFirst({
      where: { student_id: { equals: '3021232' } },
    }),
  ).toBeNull();
});

test('a 422 from the assign endpoint surfaces the field error and keeps the dialog open', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  await createUser({
    name: 'Amr Four',
    email: 'amr.four@ejust.edu.eg',
    role: 'advisor',
  });
  server.use(
    http.post(`${env.API_URL}/admin/assignments`, () =>
      HttpResponse.json(
        {
          message: 'The given data was invalid.',
          errors: { advisor_email: ['No advisor carries the email.'] },
        },
        { status: 422 },
      ),
    ),
  );

  await renderApp(<AdminAssignmentsRoute />, {
    user: admin,
    path: '/admin/assignments',
    url: '/admin/assignments',
  });

  const dialog = await openAssignDialog();
  await fillAssignForm(dialog, '3021234', 'amr.four@ejust.edu.eg');

  expect(
    await within(dialog).findByText('No advisor carries the email.'),
  ).toBeInTheDocument();
  expect(dialog).toBeInTheDocument();
});

test('cancelling a scheduled assignment goes through the confirm dialog and removes the entry', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  const advisor = await createUser({
    name: 'Amr Five',
    email: 'amr.five@ejust.edu.eg',
    role: 'advisor',
  });
  const scheduled = db.pendingAssignment.create({
    student_id: '3025555',
    advisor_id: advisor.id as number,
  });

  await renderApp(<AdminAssignmentsRoute />, {
    user: admin,
    path: '/admin/assignments',
    url: '/admin/assignments',
  });

  const row = await screen.findByRole('row', { name: /3025555/ });
  expect(within(row).getByText('Amr Five')).toBeInTheDocument();
  await userEvent.click(within(row).getByRole('button', { name: 'Cancel' }));

  const confirm = await screen.findByRole('dialog', {
    name: 'Cancel this scheduled assignment?',
  });
  expect(confirm).toHaveTextContent('3025555');
  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Cancel assignment' }),
  );

  await waitFor(() =>
    expect(
      db.pendingAssignment.findFirst({
        where: { id: { equals: scheduled.id as number } },
      }),
    ).toBeNull(),
  );
  await waitFor(() =>
    expect(
      useNotifications
        .getState()
        .notifications.some(
          (toast) =>
            toast.type === 'success' &&
            toast.title === 'Scheduled assignment cancelled.',
        ),
    ).toBe(true),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', {
        name: 'Cancel this scheduled assignment?',
      }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.queryByRole('row', { name: /3025555/ }),
  ).not.toBeInTheDocument();
});

test('an import row for a never-registered student is counted as scheduled', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  await createUser({
    name: 'Amr Six',
    email: 'amr.six@ejust.edu.eg',
    role: 'advisor',
  });

  await renderApp(<AdminAssignmentsRoute />, {
    user: admin,
    path: '/admin/assignments',
    url: '/admin/assignments',
  });

  const dialog = await pickFile(
    csvFile(
      ['student_id,advisor_email', '3028888,amr.six@ejust.edu.eg'].join('\n'),
    ),
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Import assignments' }),
  );
  const confirm = await screen.findByRole('dialog', {
    name: 'Import assignments?',
  });
  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Import assignments' }),
  );

  expect(
    await within(dialog).findByText(
      'Import applied. 0 students moved. 0 already carried their advisor. 1 scheduled for registration.',
    ),
  ).toBeInTheDocument();
  const scheduled = db.pendingAssignment.findFirst({
    where: { student_id: { equals: '3028888' } },
  });
  expect(scheduled).not.toBeNull();
});
