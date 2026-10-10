import { HttpResponse, http } from 'msw';

import AdminRulesRoute from '@/app/routes/admin/rules';
import { env } from '@/config/env';
import { i18n } from '@/lib/i18n/i18n-instance';
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

const seedRule = (title_en: string, title_ar: string, faculty?: string) =>
  db.rule.create({
    title_en,
    title_ar,
    body_en: 'Body in English.',
    body_ar: 'نص بالعربية.',
    ...(faculty ? { faculty } : {}),
    created_at: '2026-09-01T09:00:00.000Z',
    updated_at: '2026-09-01T09:00:00.000Z',
  });

beforeEach(() => {
  db.rule.deleteMany({ where: {} });
});

test('the rules editor maps all four server 422 keys inline under the EN and AR fields', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  seedRule('Course load rule', 'قاعدة الحمل الدراسي');

  server.use(
    http.post(`${env.API_URL}/admin/rules`, () =>
      HttpResponse.json(
        {
          message: 'The given data was invalid.',
          errors: {
            title_en: ['The English title is taken.'],
            title_ar: ['The Arabic title is taken.'],
            body_en: ['The English body is required.'],
            body_ar: ['The Arabic body is required.'],
          },
        },
        { status: 422 },
      ),
    ),
  );

  await renderApp(<AdminRulesRoute />, {
    user: admin,
    path: '/admin/rules',
    url: '/admin/rules',
  });

  expect(await screen.findByText('Course load rule')).toBeInTheDocument();
  expect(screen.getByText('قاعدة الحمل الدراسي')).toBeInTheDocument();

  await userEvent.click(
    await screen.findByRole('button', { name: 'New rule' }),
  );
  const dialog = await screen.findByRole('dialog', { name: 'New rule' });

  await userEvent.type(
    within(dialog).getByLabelText('Title (English)'),
    'Prerequisite rule',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Title (Arabic)'),
    'قاعدة المتطلبات',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Body (English)'),
    'A course needs its prerequisites.',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Body (Arabic)'),
    'تحتاج المادة إلى متطلباتها.',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save rule' }),
  );

  expect(
    await within(dialog).findByText('The English title is taken.'),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByText('The Arabic title is taken.'),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByText('The English body is required.'),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByText('The Arabic body is required.'),
  ).toBeInTheDocument();
  expect(
    db.rule.findFirst({ where: { title_en: { equals: 'Prerequisite rule' } } }),
  ).toBeNull();
});

test('creating a rule with a faculty scopes it and the list shows the faculty', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminRulesRoute />, {
    user: admin,
    path: '/admin/rules',
    url: '/admin/rules',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'New rule' }),
  );
  const dialog = await screen.findByRole('dialog', { name: 'New rule' });
  await userEvent.type(
    within(dialog).getByLabelText('Title (English)'),
    'Prerequisite rule',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Title (Arabic)'),
    'قاعدة المتطلبات',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Body (English)'),
    'A course needs its prerequisites.',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Body (Arabic)'),
    'تحتاج المادة إلى متطلباتها.',
  );
  await userEvent.type(within(dialog).getByLabelText('Faculty'), 'Engineering');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save rule' }),
  );

  expect(await screen.findByText('Prerequisite rule')).toBeInTheDocument();
  expect(await screen.findByText('Engineering')).toBeInTheDocument();
  expect(
    db.rule.findFirst({ where: { title_en: { equals: 'Prerequisite rule' } } })
      ?.faculty,
  ).toBe('Engineering');
});

test('creating a rule applies the returned rule to the list', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminRulesRoute />, {
    user: admin,
    path: '/admin/rules',
    url: '/admin/rules',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'New rule' }),
  );
  const dialog = await screen.findByRole('dialog', { name: 'New rule' });
  await userEvent.type(
    within(dialog).getByLabelText('Title (English)'),
    'Prerequisite rule',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Title (Arabic)'),
    'قاعدة المتطلبات',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Body (English)'),
    'A course needs its prerequisites.',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Body (Arabic)'),
    'تحتاج المادة إلى متطلباتها.',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save rule' }),
  );

  expect(await screen.findByText('Prerequisite rule')).toBeInTheDocument();
  expect(
    db.rule.findFirst({ where: { title_en: { equals: 'Prerequisite rule' } } }),
  ).not.toBeNull();
});

test('creating a rule without a faculty keeps it global', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });

  await renderApp(<AdminRulesRoute />, {
    user: admin,
    path: '/admin/rules',
    url: '/admin/rules',
  });

  await userEvent.click(
    await screen.findByRole('button', { name: 'New rule' }),
  );
  const dialog = await screen.findByRole('dialog', { name: 'New rule' });
  await userEvent.type(
    within(dialog).getByLabelText('Title (English)'),
    'Prerequisite rule',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Title (Arabic)'),
    'قاعدة المتطلبات',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Body (English)'),
    'A course needs its prerequisites.',
  );
  await userEvent.type(
    within(dialog).getByLabelText('Body (Arabic)'),
    'تحتاج المادة إلى متطلباتها.',
  );
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save rule' }),
  );

  expect(await screen.findByText('Prerequisite rule')).toBeInTheDocument();
  const row = screen.getByText('Prerequisite rule').closest('tr');
  expect(row).not.toBeNull();
  expect(within(row as HTMLElement).getByText('Global')).toBeInTheDocument();
  const stored = db.rule.findFirst({
    where: { title_en: { equals: 'Prerequisite rule' } },
  });
  expect(stored?.faculty ?? null).toBeNull();
});

test('editing a rule moves it to another faculty', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  seedRule('Course load rule', 'قاعدة الحمل الدراسي', 'Engineering');

  await renderApp(<AdminRulesRoute />, {
    user: admin,
    path: '/admin/rules',
    url: '/admin/rules',
  });

  await userEvent.click(
    await screen.findByRole('button', {
      name: 'Edit Course load rule',
    }),
  );
  const dialog = await screen.findByRole('dialog', { name: 'Edit rule' });
  const facultyInput = within(dialog).getByLabelText(
    'Faculty',
  ) as HTMLInputElement;
  expect(facultyInput).toHaveValue('Engineering');
  await userEvent.clear(facultyInput);
  await userEvent.type(facultyInput, 'Science');
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save rule' }),
  );

  await waitFor(() =>
    expect(
      db.rule.findFirst({
        where: { title_en: { equals: 'Course load rule' } },
      })?.faculty,
    ).toBe('Science'),
  );
  const row = screen.getByText('Course load rule').closest('tr');
  expect(within(row as HTMLElement).getByText('Science')).toBeInTheDocument();
});

test('editing a rule without a faculty keeps it global', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  seedRule('Course load rule', 'قاعدة الحمل الدراسي', 'Engineering');

  await renderApp(<AdminRulesRoute />, {
    user: admin,
    path: '/admin/rules',
    url: '/admin/rules',
  });

  await userEvent.click(
    await screen.findByRole('button', {
      name: 'Edit Course load rule',
    }),
  );
  const dialog = await screen.findByRole('dialog', { name: 'Edit rule' });
  const facultyInput = within(dialog).getByLabelText(
    'Faculty',
  ) as HTMLInputElement;
  await userEvent.clear(facultyInput);
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Save rule' }),
  );

  await waitFor(() =>
    expect(
      db.rule.findFirst({
        where: { title_en: { equals: 'Course load rule' } },
      })?.faculty ?? null,
    ).toBeNull(),
  );
  const row = screen.getByText('Course load rule').closest('tr');
  expect(within(row as HTMLElement).getByText('Global')).toBeInTheDocument();
});

test('the scope column renders faculty names and the global badge in Arabic', async () => {
  await i18n.changeLanguage('ar');
  try {
    const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
    seedRule('Course load rule', 'قاعدة الحمل الدراسي', 'Engineering');
    seedRule('Prerequisite rule', 'قاعدة المتطلبات');

    await renderApp(<AdminRulesRoute />, {
      user: admin,
      path: '/admin/rules',
      url: '/admin/rules',
    });

    expect(
      await screen.findByRole('columnheader', { name: 'النطاق' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('عامة')).toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'تعديل Course load rule',
      }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'تعديل القاعدة',
    });
    expect(within(dialog).getByLabelText('الكلية')).toHaveValue('Engineering');
  } finally {
    await i18n.changeLanguage('en');
  }
});

test('deleting a rule confirms the AI quoting consequence and removes it', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  seedRule('Course load rule', 'قاعدة الحمل الدراسي');

  await renderApp(<AdminRulesRoute />, {
    user: admin,
    path: '/admin/rules',
    url: '/admin/rules',
  });

  await userEvent.click(
    await screen.findByRole('button', {
      name: 'Edit Course load rule',
    }),
  );
  const dialog = await screen.findByRole('dialog', {
    name: 'Edit rule',
  });
  await userEvent.click(
    within(dialog).getByRole('button', { name: 'Delete rule' }),
  );

  const confirm = await screen.findByRole('dialog', {
    name: 'Delete this rule?',
  });
  expect(confirm).toHaveTextContent(
    'This deletes the rule. The AI advisor stops quoting it immediately. This cannot be undone.',
  );

  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Delete rule' }),
  );

  await waitFor(() =>
    expect(screen.queryByText('Course load rule')).not.toBeInTheDocument(),
  );
  expect(
    db.rule.findFirst({
      where: { title_en: { equals: 'Course load rule' } },
    }),
  ).toBeNull();
});
