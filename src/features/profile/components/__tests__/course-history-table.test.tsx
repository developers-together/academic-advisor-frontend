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

const dataCellsOfRow = (row: HTMLElement) => within(row).getAllByRole('cell');

test('renders the term from term_code with year and semester as supplementary detail and never a lone middle dot', () => {
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

  const rows = screen.getAllByRole('row');

  const detailedTerm = dataCellsOfRow(rows[1])[2];
  expect(detailedTerm).toHaveTextContent('2024-fall');
  expect(detailedTerm).toHaveTextContent('2025');
  expect(detailedTerm).toHaveTextContent('Fall');

  const bareTerm = dataCellsOfRow(rows[2])[2];
  expect(bareTerm).toHaveTextContent('2023-spring');
  expect(bareTerm).not.toHaveTextContent('·');
});

test('keeps repeated course attempts in distinct rows without colliding keys', () => {
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

  expect(screen.getAllByText('CSE211')).toHaveLength(2);
  expect(
    errorSpy.mock.calls.some((call) => String(call[0]).includes('same key')),
  ).toBe(false);
  errorSpy.mockRestore();
});

test('shows a dash for missing credits and level', () => {
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

  const cells = dataCellsOfRow(screen.getAllByRole('row')[1]);
  expect(cells[1]).toHaveTextContent('-');
  expect(cells[3]).toHaveTextContent('-');
});
