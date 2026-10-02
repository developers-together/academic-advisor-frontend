import { render, screen, userEvent } from '@/testing/test-utils';
import type { PrerequisiteMapEntry } from '@/types/domain';

import { PrereqMap } from './prereq-map';

const entries: PrerequisiteMapEntry[] = [
  {
    course_code: 'CS 101',
    title: 'Introduction to Programming',
    state: 'completed',
    prerequisites: [],
  },
  {
    course_code: 'EE 210',
    title: 'Circuits',
    state: 'planned',
    prerequisites: [],
  },
  {
    course_code: 'CS 201',
    title: 'Data Structures',
    state: 'eligible',
    prerequisites: ['CS 101'],
  },
  {
    course_code: 'CS 301',
    title: 'Algorithms',
    state: 'locked',
    prerequisites: ['CS 201'],
  },
];

const nodeFor = (code: string) =>
  screen.getByText(code).closest('g') as SVGGElement;

test('renders the four SIS-assigned node states', () => {
  render(<PrereqMap entries={entries} />);

  expect(nodeFor('CS 101').querySelector('rect')).toHaveClass(
    'fill-success/10',
  );
  expect(nodeFor('EE 210').querySelector('rect')).toHaveClass('fill-info/10');
  expect(nodeFor('CS 201').querySelector('rect')).toHaveClass(
    'fill-warning/10',
  );
  expect(nodeFor('CS 301').querySelector('rect')).toHaveClass('fill-muted');
});

test('places nodes in level columns derived from the prerequisite chain', () => {
  render(<PrereqMap entries={entries} />);

  const columnSvg = (label: string) =>
    screen.getByText(label).closest('svg') as SVGSVGElement;

  expect(columnSvg('Level 1')).toHaveTextContent(/CS 101/);
  expect(columnSvg('Level 1')).toHaveTextContent(/EE 210/);
  expect(columnSvg('Level 1')).not.toHaveTextContent(/CS 201/);
  expect(columnSvg('Level 2')).toHaveTextContent(/CS 201/);
  expect(columnSvg('Level 2')).not.toHaveTextContent(/CS 301/);
  expect(columnSvg('Level 3')).toHaveTextContent(/CS 301/);
});

test('carries the same data as a visually-hidden screen-reader list', () => {
  render(<PrereqMap entries={entries} />);

  const list = screen.getByRole('list', { name: /course map, list view/i });
  expect(list).toHaveClass('sr-only');
  expect(list).toHaveTextContent(
    'CS 101, Introduction to Programming, Completed',
  );
  expect(list).toHaveTextContent('EE 210, Circuits, Planned');
  expect(list).toHaveTextContent('CS 201, Data Structures, Eligible');
  expect(list).toHaveTextContent('CS 301, Algorithms, Locked');
});

test('scrolls horizontally with snap points for narrow viewports', () => {
  render(<PrereqMap entries={entries} />);

  const region = screen.getByRole('region', { name: /course map/i });
  expect(region).toHaveClass('overflow-x-auto');
  expect(region).toHaveClass('snap-x');
  expect(region).toHaveClass('snap-mandatory');
  expect(region.querySelectorAll('.snap-start')).toHaveLength(3);
});

test('renders the retry copy for an empty map', async () => {
  const onRetry = vi.fn();
  render(<PrereqMap entries={[]} onRetry={onRetry} />);

  expect(
    screen.getByText('Your course map is not available yet.'),
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /retry/i }));

  expect(onRetry).toHaveBeenCalledTimes(1);
});
