import { CourseHistoryTable } from '@/features/profile/components/course-history-table';
import { render, screen, within } from '@/testing/test-utils';
import type { CourseAttempt } from '@/types/domain';

const attempt = (overrides: Partial<CourseAttempt>): CourseAttempt => ({
  course_code: 'CS 101',
  name: 'Introduction to Programming',
  term_code: '2024-fall',
  credits: 3,
  year: 2025,
  semester: 'Fall',
  level: 1,
  grade: 'A',
  ...overrides,
});

test('renders the term from term_code and never a lone middle dot', () => {
  const history = [
    attempt({
      course_code: 'CS 101',
      term_code: '2024-fall',
      year: 2025,
      semester: 'Fall',
    }),
    attempt({
      course_code: 'MATH 101',
      name: 'Calculus I',
      term_code: '2023-spring',
      year: null,
      semester: null,
      grade: 'B+',
    }),
  ];
  render(<CourseHistoryTable history={history} />);

  const detailedTerm = screen.getByRole('region', { name: '2024-fall' });
  expect(detailedTerm).toHaveTextContent('CS 101');
  expect(detailedTerm).toHaveTextContent('A');

  const bareTerm = screen.getByRole('region', { name: '2023-spring' });
  expect(bareTerm).toHaveTextContent('MATH 101');
  expect(bareTerm).not.toHaveTextContent('·');
  expect(bareTerm).toHaveTextContent('B+');
});

test('keeps repeated course attempts in distinct term sections without colliding keys', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const history = [
    attempt({
      course_code: 'CSE211',
      name: null,
      term_code: '2023-fall',
      year: null,
      semester: null,
      credits: null,
      level: null,
      grade: 'D',
    }),
    attempt({
      course_code: 'CSE211',
      name: null,
      term_code: '2024-fall',
      year: null,
      semester: null,
      credits: null,
      level: null,
      grade: 'B',
    }),
  ];

  render(<CourseHistoryTable history={history} />);

  const firstAttempt = screen.getByRole('region', { name: '2023-fall' });
  expect(firstAttempt).toHaveTextContent('CSE211');
  expect(firstAttempt).toHaveTextContent('D');

  const secondAttempt = screen.getByRole('region', { name: '2024-fall' });
  expect(secondAttempt).toHaveTextContent('CSE211');
  expect(secondAttempt).toHaveTextContent('B');
  expect(
    errorSpy.mock.calls.some((call) => String(call[0]).includes('same key')),
  ).toBe(false);
  errorSpy.mockRestore();
});

test('shows the unreported copy for missing credits and level', () => {
  const history = [
    attempt({
      course_code: 'CSE211',
      name: null,
      term_code: '2024-fall',
      credits: null,
      year: null,
      semester: null,
      level: null,
      grade: 'B',
    }),
  ];
  render(<CourseHistoryTable history={history} />);

  const row = screen.getByRole('region', { name: '2024-fall' });
  expect(within(row).getAllByText('Not reported')).toHaveLength(2);
});
