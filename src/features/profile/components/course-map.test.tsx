import userEvent from '@testing-library/user-event';

import { render, screen, within } from '@/testing/test-utils';
import type { PrerequisiteMapEntry } from '@/types/domain';

import { CourseMap } from './course-map';

const entries: PrerequisiteMapEntry[] = Array.from(
  { length: 40 },
  (_, index) => ({
    course_code: `CS ${index + 100}`,
    title: `Course ${index + 1}`,
    state: index < 8 ? 'completed' : 'locked',
    prerequisites: index < 8 ? [] : [`CS ${index + 92}`],
  }),
);

test('a large map preserves every course and supports prerequisite exploration from the keyboard', async () => {
  const user = userEvent.setup();
  render(<CourseMap entries={entries} />);
  const canvas = screen.getByRole('group', { name: 'Course map' });
  expect(within(canvas).getAllByRole('button')).toHaveLength(40);
  const course = within(canvas).getByRole('button', {
    name: 'CS 108 Course 9, Locked',
  });
  for (let index = 0; index < 11; index += 1) await user.tab();
  expect(course).toHaveFocus();
  expect(screen.getByText('Requires')).toBeInTheDocument();
  await user.keyboard('{Enter}');
  expect(course).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Requires')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'CS 100' }));
  expect(
    within(canvas).getByRole('button', { name: 'CS 100 Course 1, Completed' }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Unlocks')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Zoom in' }));
  expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Reset zoom' }));
  expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled();
});
