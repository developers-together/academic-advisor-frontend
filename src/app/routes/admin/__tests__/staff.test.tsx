import { HttpResponse, http } from 'msw';

import AdminStaffRoute from '@/app/routes/admin/staff';
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

beforeEach(() => {
  db.user.deleteMany({ where: {} });
});

const seedDirectory = async () => {
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
  });
  await createUser({
    name: 'Omar Fathi',
    role: 'student',
    advisor_id: advisor.id as number,
  });
  await createUser({
    name: 'Dina Dean',
    email: 'dina.dean@ejust.edu.eg',
    role: 'dean',
    faculty: 'Engineering',
  });
  return admin;
};

const rowOf = (name: string) =>
  screen
    .getByRole('button', { name: `Edit ${name}` })
    .closest('tr') as HTMLElement;

test('the directory renders role badges, faculty, and advisor caseload, and the role filter works', async () => {
  const admin = await seedDirectory();

  await renderApp(<AdminStaffRoute />, {
    user: admin,
    path: '/admin/staff',
    url: '/admin/staff',
  });

  const amr = await screen.findByRole('button', {
    name: 'Edit Amr Advisor',
  });
  const advisorRow = amr.closest('tr') as HTMLElement;
  expect(within(advisorRow).getByText('Advisor')).toBeInTheDocument();
  expect(within(advisorRow).getByText('Engineering')).toBeInTheDocument();
  expect(within(advisorRow).getByText('2 students')).toBeInTheDocument();

  const deanRow = rowOf('Dina Dean');
  expect(within(deanRow).getByText('Dean')).toBeInTheDocument();
  expect(within(deanRow).queryByText(/student/)).not.toBeInTheDocument();

  const adminRow = rowOf('Mona Admin');
  expect(within(adminRow).getByText('Administrator')).toBeInTheDocument();
  expect(within(adminRow).getAllByText('-').length).toBeGreaterThan(0);

  await userEvent.click(screen.getByRole('tab', { name: 'Advisors' }));

  expect(await screen.findByText('Amr Advisor')).toBeInTheDocument();
  expect(screen.queryByText('Dina Dean')).not.toBeInTheDocument();
  expect(screen.queryByText('Mona Admin')).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('tab', { name: 'All' }));
  expect(await screen.findByText('Dina Dean')).toBeInTheDocument();
});

test('an empty role filter names the missing role and the directory lists the signed-in admin', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminStaffRoute />, {
    user: admin,
    path: '/admin/staff',
    url: '/admin/staff',
  });

  await userEvent.click(await screen.findByRole('tab', { name: 'Deans' }));
  expect(
    await screen.findByText('No staff carry this role yet.'),
  ).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Add staff' })).toHaveLength(1);

  await userEvent.click(screen.getByRole('tab', { name: 'All' }));
  expect(
    await screen.findByRole('button', { name: 'Edit Mona Admin' }),
  ).toBeInTheDocument();
  expect(
    within(rowOf('Mona Admin')).getByText('Administrator'),
  ).toBeInTheDocument();
});

test('creating a staff account on the page prepends the row and offers the reset link', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminStaffRoute />, {
    user: admin,
    path: '/admin/staff',
    url: '/admin/staff',
  });
  await screen.findByText('Mona Admin');

  await userEvent.click(screen.getByRole('button', { name: 'Add staff' }));
  const dialog = await screen.findByRole('dialog', { name: 'Add staff' });

  await userEvent.type(within(dialog).getByLabelText('Name'), 'Nadia Sherif');
  await userEvent.type(
    within(dialog).getByLabelText('Email'),
    'nadia.sherif@ejust.edu.eg',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Initial password'),
    'initial-secret-9',
  );
  await userEvent.selectOptions(within(dialog).getByLabelText('Role'), 'dean');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Create staff account' }),
  );

  expect(
    await within(dialog).findByText('Deans need a faculty.'),
  ).toBeInTheDocument();
  expect(
    db.user.findFirst({
      where: { email: { equals: 'nadia.sherif@ejust.edu.eg' } },
    }),
  ).toBeNull();

  await userEvent.type(within(dialog).getByLabelText('Faculty'), 'Science');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Create staff account' }),
  );

  expect(
    await within(dialog).findByText(
      'Staff account created. Share the initial password with Nadia Sherif through a safe channel.',
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText('initial-secret-9')).not.toBeInTheDocument();

  const created = db.user.findFirst({
    where: { email: { equals: 'nadia.sherif@ejust.edu.eg' } },
  });
  expect(created?.role).toBe('dean');
  expect(created?.faculty).toBe('Science');

  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Send reset link' }),
  );
  const confirm = await screen.findByRole('dialog', {
    name: 'Send a password reset?',
  });
  expect(confirm).toHaveTextContent(
    'This emails a password reset link to nadia.sherif@ejust.edu.eg.',
  );
  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Send reset link' }),
  );
  expect(
    await screen.findByText('Password reset link sent.'),
  ).toBeInTheDocument();

  await userEvent.click(
    within(dialog).getAllByRole('button', { name: 'Close' })[0],
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: 'Add staff' }),
    ).not.toBeInTheDocument(),
  );

  const nadiaRow = rowOf('Nadia Sherif');
  expect(nadiaRow).toBeInTheDocument();
  expect(rowOf('Mona Admin')).toBeInTheDocument();
  expect(within(nadiaRow).getByText('Dean')).toBeInTheDocument();
  expect(within(nadiaRow).getByText('Science')).toBeInTheDocument();
});

test('the edit dialog applies the dean-faculty rule and saves name, faculty, and role', async () => {
  const admin = await seedDirectory();

  await renderApp(<AdminStaffRoute />, {
    user: admin,
    path: '/admin/staff',
    url: '/admin/staff',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'Edit Amr Advisor' }),
  );
  const dialog = await screen.findByRole('dialog', {
    name: 'Edit staff account',
  });

  const nameInput = await within(dialog).findByLabelText('Name');
  expect(nameInput).toHaveValue('Amr Advisor');
  expect(within(dialog).queryByLabelText('Faculty')).not.toBeInTheDocument();

  await userEvent.selectOptions(within(dialog).getByLabelText('Role'), 'dean');
  await userEvent.clear(within(dialog).getByLabelText('Faculty'));
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save changes' }),
  );
  expect(
    await within(dialog).findByText('Deans need a faculty.'),
  ).toBeInTheDocument();
  expect(
    db.user.findFirst({ where: { name: { equals: 'Amr Advisor' } } })?.role,
  ).toBe('advisor');

  await userEvent.type(within(dialog).getByLabelText('Faculty'), 'Science');
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, 'Amr El-Sayed');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save changes' }),
  );

  await waitFor(() =>
    expect(
      db.user.findFirst({ where: { name: { equals: 'Amr El-Sayed' } } }),
    ).toMatchObject({ role: 'dean', faculty: 'Science' }),
  );
  expect(await screen.findByText('Staff account updated.')).toBeInTheDocument();
  const row = rowOf('Amr El-Sayed');
  expect(within(row).getByText('Dean')).toBeInTheDocument();
  expect(within(row).getByText('Science')).toBeInTheDocument();
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: 'Edit staff account' }),
    ).not.toBeInTheDocument(),
  );
});

test('a server 422 on edit lands on the field and keeps the dialog open', async () => {
  const admin = await seedDirectory();

  await renderApp(<AdminStaffRoute />, {
    user: admin,
    path: '/admin/staff',
    url: '/admin/staff',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'Edit Amr Advisor' }),
  );
  const dialog = await screen.findByRole('dialog', {
    name: 'Edit staff account',
  });
  await within(dialog).findByLabelText('Name');

  server.use(
    http.patch(`${env.API_URL}/admin/staff/:staffId`, () =>
      HttpResponse.json(
        {
          message: 'The given data was invalid.',
          errors: { name: ['The registrar rejects this name.'] },
        },
        { status: 422 },
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
});

test('deleting a staff account confirms the consequence and removes the row', async () => {
  const admin = await seedDirectory();
  const nadia = await createUser({
    name: 'Nadia Sherif',
    email: 'nadia.sherif@ejust.edu.eg',
    role: 'advisor',
  });

  await renderApp(<AdminStaffRoute />, {
    user: admin,
    path: '/admin/staff',
    url: '/admin/staff',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'Delete Nadia Sherif' }),
  );
  const confirm = await screen.findByRole('dialog', {
    name: 'Delete Nadia Sherif?',
  });
  expect(confirm).toHaveTextContent(
    'This deletes the staff account and unassigns their students.',
  );
  expect(within(confirm).getByRole('button', { name: 'Cancel' })).toHaveFocus();

  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Delete account' }),
  );

  await waitFor(() =>
    expect(
      db.user.findFirst({ where: { id: { equals: nadia.id as number } } }),
    ).toBeNull(),
  );
  expect(await screen.findByText('Staff account deleted.')).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.queryByText('Nadia Sherif')).not.toBeInTheDocument(),
  );
});

test('deleting yourself surfaces the 403 readably and keeps the account', async () => {
  const admin = await seedDirectory();

  await renderApp(<AdminStaffRoute />, {
    user: admin,
    path: '/admin/staff',
    url: '/admin/staff',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'Delete Mona Admin' }),
  );
  const confirm = await screen.findByRole('dialog', {
    name: 'Delete Mona Admin?',
  });

  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Delete account' }),
  );

  const alert = await within(confirm).findByRole('alert');
  expect(alert).toHaveTextContent('You cannot delete your own account.');
  expect(
    db.user.findFirst({ where: { name: { equals: 'Mona Admin' } } }),
  ).not.toBeNull();
});

test('deleting the last administrator surfaces the 422 readably', async () => {
  const admin = await seedDirectory();
  await createUser({
    name: 'Hana Admin',
    email: 'hana.admin@ejust.edu.eg',
    role: 'admin',
  });

  server.use(
    http.delete(`${env.API_URL}/admin/staff/:staffId`, () =>
      HttpResponse.json(
        { message: 'The last administrator cannot be deleted.' },
        { status: 422 },
      ),
    ),
  );

  await renderApp(<AdminStaffRoute />, {
    user: admin,
    path: '/admin/staff',
    url: '/admin/staff',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'Delete Hana Admin' }),
  );
  const confirm = await screen.findByRole('dialog', {
    name: 'Delete Hana Admin?',
  });

  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Delete account' }),
  );

  const alert = await within(confirm).findByRole('alert');
  expect(alert).toHaveTextContent('The last administrator cannot be deleted.');
  expect(
    db.user.findFirst({ where: { name: { equals: 'Hana Admin' } } }),
  ).not.toBeNull();
});

test('the password reset confirm sends the reset link', async () => {
  const admin = await seedDirectory();

  await renderApp(<AdminStaffRoute />, {
    user: admin,
    path: '/admin/staff',
    url: '/admin/staff',
  });

  await userEvent.click(
    await screen.findByRole('button', {
      name: 'Reset password for Amr Advisor',
    }),
  );
  const confirm = await screen.findByRole('dialog', {
    name: 'Send a password reset?',
  });
  expect(confirm).toHaveTextContent(
    'This emails a password reset link to amr.advisor@ejust.edu.eg.',
  );

  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Send reset link' }),
  );

  expect(
    await screen.findByText('Password reset link sent.'),
  ).toBeInTheDocument();
  expect(
    db.user.findFirst({ where: { name: { equals: 'Amr Advisor' } } }),
  ).not.toBeNull();
});

test('a failed read renders the shared error state with retry', async () => {
  const admin = await seedDirectory();

  await renderApp(<AdminStaffRoute />, {
    user: admin,
    path: '/admin/staff',
    url: '/admin/staff',
  });
  await screen.findByText('Amr Advisor');

  server.use(
    http.get(`${env.API_URL}/admin/staff`, () =>
      HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      ),
    ),
  );

  await userEvent.click(screen.getByRole('tab', { name: 'Advisors' }));
  expect(
    await screen.findByText('Could not load this content.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});
