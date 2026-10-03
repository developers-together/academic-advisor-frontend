import { HttpResponse, http } from 'msw';

import AdminRulesRoute from '@/app/routes/admin/rules';
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

const seedRule = (title_en: string, title_ar: string) =>
  db.rule.create({
    title_en,
    title_ar,
    body_en: 'Body in English.',
    body_ar: 'نص بالعربية.',
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
