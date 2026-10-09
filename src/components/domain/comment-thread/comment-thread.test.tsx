import { render, screen, userEvent, within } from '@/testing/test-utils';
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

  const user = userEvent.setup();
  await user.click(screen.getByRole('textbox'));
  await user.paste('x'.repeat(2001));
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

test('renders no composer when the thread is read-only', () => {
  render(
    <CommentThread
      comments={[comment({})]}
      title="Advisor comments"
      emptyText="No comments yet."
    />,
  );

  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Add comment' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('region', { name: 'Advisor comments' }),
  ).toBeInTheDocument();
});

test('tints comments newer than the cutoff and pairs the tint with a New badge', () => {
  render(
    <CommentThread
      comments={[
        comment({}),
        comment({
          id: 2,
          body: 'The group choice is fine now.',
          created_at: '2026-10-02T12:00:00.000Z',
        }),
      ]}
      onSubmit={() => {}}
      unreadAfter="2026-10-02T08:00:00.000Z"
    />,
  );

  const read = screen
    .getByText('Please explain the repeated course.')
    .closest('li') as HTMLElement;
  const unread = screen
    .getByText('The group choice is fine now.')
    .closest('li') as HTMLElement;
  expect(read).not.toHaveClass('bg-crimson-100');
  expect(within(read).queryByText('New')).not.toBeInTheDocument();
  expect(unread).toHaveClass('bg-crimson-100');
  expect(within(unread).getByText('New')).toBeInTheDocument();
});
