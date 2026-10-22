import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { i18n } from '@/lib/i18n/i18n-instance';
import { rtlRender, screen, userEvent } from '@/testing/test-utils';
import type { AdminCourse } from '@/types/domain';

import { CourseEditorDialog } from './course-editor-dialog';
import { RegistrationWindowsDocument } from './registration-windows-document';

test('the course editor shows department metadata and rejects fractional credits and a missing level', async () => {
  await i18n.changeLanguage('en');
  const client = new QueryClient();
  const course: AdminCourse = {
    id: 1,
    code: 'CSE101',
    title_en: 'Programming',
    title_ar: 'البرمجة',
    credits: 3,
    level: 1,
    description: 'Programming fundamentals',
    department_id: 7,
    offering_department: 'Computer Science',
    usable_across_departments: true,
    prerequisite_course_codes: [],
  };
  client.setQueryData(['admin', 'courses'], [course]);
  client.setQueryData(
    ['admin', 'departments'],
    [
      {
        id: 7,
        code: 'CSE',
        name_en: 'Computer Science',
        name_ar: 'علوم الحاسب',
        faculty_name_en: 'Engineering',
        faculty_name_ar: 'الهندسة',
      },
    ],
  );
  rtlRender(
    <QueryClientProvider client={client}>
      <CourseEditorDialog course={course} onClose={() => {}} />
    </QueryClientProvider>,
  );

  expect(screen.getByLabelText('Arabic title')).toHaveValue('البرمجة');
  expect(screen.getByLabelText('Description')).toHaveValue(
    'Programming fundamentals',
  );
  expect(screen.getByLabelText('Offering department')).toHaveValue('7');
  expect(screen.getByLabelText('Available across departments')).toBeChecked();
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('Credits'));
  await user.type(screen.getByLabelText('Credits'), '2.5');
  await user.clear(screen.getByLabelText('Level'));
  await user.click(screen.getByRole('button', { name: 'Save changes' }));

  expect(
    await screen.findByText(
      'Enter a whole number of credit hours, zero or more.',
    ),
  ).toBeVisible();
  expect(
    screen.getByText('Enter a whole-number level, one or more.'),
  ).toBeVisible();
  client.clear();
});

test('registration windows edit dates and reject a closing date before the opening date', async () => {
  await i18n.changeLanguage('en');
  const client = new QueryClient();
  client.setQueryData(
    ['admin', 'registration-windows'],
    [
      {
        id: 1,
        term_code: '2026-fall',
        opens_at: '2026-10-01T09:00:00Z',
        closes_at: '2026-10-10T09:00:00Z',
      },
    ],
  );
  rtlRender(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <RegistrationWindowsDocument />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  const opens = screen.getByLabelText('Opens');
  const closes = screen.getByLabelText('Closes');
  expect(opens).toHaveAttribute('type', 'datetime-local');
  expect(closes).toHaveAttribute('type', 'datetime-local');
  const user = userEvent.setup();
  await user.clear(closes);
  await user.type(closes, '2026-09-01T09:00');
  await user.click(screen.getByRole('button', { name: 'Save' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'The closing date must be after the opening date.',
  );
  expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  client.clear();
});
