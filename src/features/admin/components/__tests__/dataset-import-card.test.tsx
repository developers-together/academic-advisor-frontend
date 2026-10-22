import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { DatasetImportCard } from '@/features/admin/components/dataset-import-card';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent, within } from '@/testing/test-utils';

test('the curriculum import template includes course requirements and elective counts', async () => {
  await renderApp(<DatasetImportCard dataset="curricula" />, { user: null });

  const template = screen.getByRole('link', {
    name: 'Download curriculum CSV template',
  });
  expect(template).toHaveAttribute('download', 'curricula-template.csv');
  expect(decodeURIComponent(template.getAttribute('href') ?? '')).toBe(
    'data:text/csv;charset=utf-8,Faculty,School,Department,Course Code,Level,Prerequisite Course Code,Type,Category,Elective Group,Elective Slots\r\n',
  );
  expect(screen.getByText('Type')).toBeInTheDocument();
  expect(screen.getByText('Category')).toBeInTheDocument();
  expect(screen.getByText('Elective Group')).toBeInTheDocument();
  expect(screen.getByText('Elective Slots')).toBeInTheDocument();
});

test('staff can see why blank elective counts leave a group unresolved', async () => {
  await renderApp(<DatasetImportCard dataset="curricula" />, { user: null });

  expect(
    screen.getByText(
      'Blank Elective Slots leave the group unresolved and block its courses from planning until staff imports a count. The server validates rows and group counts.',
    ),
  ).toBeInTheDocument();
});

test.each([
  [
    'sheets.Curricula.rows.2',
    'Sheet Curricula row 2 must name a group for an elective and no group for a compulsory course.',
  ],
  [
    'file',
    'Elective group Humanities must use one consistent slot count that does not exceed its distinct course count.',
  ],
])(
  'the curriculum import displays backend errors from %s',
  async (field, message) => {
    server.use(
      http.post(`${env.API_URL}/admin/imports/curricula`, () =>
        HttpResponse.json(
          {
            message: 'The given data was invalid.',
            errors: { [field]: [message] },
          },
          { status: 422 },
        ),
      ),
    );
    await renderApp(<DatasetImportCard dataset="curricula" />, { user: null });

    await userEvent.upload(
      screen.getByLabelText('CSV, TXT, or XLSX up to 4 MB.'),
      new File(
        ['Faculty,Course Code,Type\nEngineering,CSE101,elective'],
        'curricula.csv',
        {
          type: 'text/csv',
        },
      ),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Import file' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Import file',
      }),
    );

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText(message)).toBeInTheDocument();
    expect(within(alert).getByText('Import not applied')).toBeInTheDocument();
    expect(
      within(alert).getByText(
        'Nothing changed. Fix every listed error and try again.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('CSV, TXT, or XLSX up to 4 MB.'),
    ).toHaveAttribute('aria-invalid', 'true');
  },
);

test('a curriculum file with blank elective counts reaches the backend unchanged', async () => {
  const contents =
    'Faculty,School,Department,Course Code,Type,Category,Elective Group,Elective Slots\r\nEngineering,,Computing,CSE331,elective,Elective,Computing,\r\n';
  let uploadedContents: string | undefined;
  server.use(
    http.post(`${env.API_URL}/admin/imports/curricula`, async ({ request }) => {
      const form = await request.formData();
      const file = form.get('file');
      if (file !== null) {
        uploadedContents = typeof file === 'string' ? file : await file.text();
      }
      return HttpResponse.json({ imported: 1, skipped: 0, errors: [] });
    }),
  );
  await renderApp(<DatasetImportCard dataset="curricula" />, { user: null });

  await userEvent.upload(
    screen.getByLabelText('CSV, TXT, or XLSX up to 4 MB.'),
    new File([contents], 'curricula.csv', { type: 'text/csv' }),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Import file' }));
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Import file',
    }),
  );

  expect(
    await screen.findByText('Imported 1. Skipped 0. Rejected 0.'),
  ).toBeInTheDocument();
  expect(uploadedContents).toBe(contents);
});
