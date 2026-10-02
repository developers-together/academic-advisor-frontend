import { render, screen, userEvent } from '@/testing/test-utils';
import type { PlanComment } from '@/types/domain';

import { CommentThread } from './comment-thread';

const comment = (overrides: Partial<PlanComment>): PlanComment => ({
  id: 1,
  body: 'Please explain the repeated course.',
  author: { id: 2, name: 'Amr Advisor' },
  created_at: '2026-10-01T10:30:00.000Z',
  ...overrides,
});

test('renders each comment with its author and time', () => {
  render(
    <CommentThread
      comments={[
        comment({}),
        comment({
          id: 2,
          body: 'The group choice is fine now.',
          author: { id: 1, name: 'Sara Student' },
          created_at: '2026-10-02T08:00:00.000Z',
        }),
      ]}
      onSubmit={() => {}}
    />,
  );

  expect(screen.getByRole('region', { name: 'Comments' })).toBeInTheDocument();
  expect(
    screen.getByText('Please explain the repeated course.'),
  ).toBeInTheDocument();
  expect(screen.getByText('Amr Advisor')).toBeInTheDocument();
  expect(screen.getByText('The group choice is fine now.')).toBeInTheDocument();
  expect(screen.getByText('Sara Student')).toBeInTheDocument();
  const times = screen.getAllByRole('time');
  expect(times).toHaveLength(2);
  expect(times[0]).toHaveAttribute('dateTime', '2026-10-01T10:30:00.000Z');
  expect(times[1]).toHaveAttribute('dateTime', '2026-10-02T08:00:00.000Z');
});

test('names the empty state', () => {
  render(<CommentThread comments={[]} onSubmit={() => {}} />);

  expect(screen.getByText('No comments on this plan yet.')).toBeInTheDocument();
});

test('blocks an empty comment with the inline message', async () => {
  const onSubmit = vi.fn();
  render(<CommentThread comments={[]} onSubmit={onSubmit} />);

  await userEvent.click(screen.getByRole('button', { name: 'Add comment' }));

  expect(
    screen.getByText('Write the comment before adding it.'),
  ).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('caps the comment length with the inline message', async () => {
  const onSubmit = vi.fn();
  render(<CommentThread comments={[]} onSubmit={onSubmit} />);

  await userEvent.type(screen.getByRole('textbox'), 'x'.repeat(2001));
  await userEvent.click(screen.getByRole('button', { name: 'Add comment' }));

  expect(
    screen.getByText('Comments are limited to 2000 characters.'),
  ).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('submits a valid comment and clears the composer', async () => {
  const onSubmit = vi.fn();
  render(<CommentThread comments={[]} onSubmit={onSubmit} />);

  await userEvent.type(screen.getByRole('textbox'), 'The plan looks balanced.');
  await userEvent.click(screen.getByRole('button', { name: 'Add comment' }));

  expect(onSubmit).toHaveBeenCalledWith('The plan looks balanced.');
  await screen.findByRole('textbox');
  expect(screen.getByRole('textbox')).toHaveValue('');
});
