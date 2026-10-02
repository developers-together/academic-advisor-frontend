import type { Meta, StoryObj } from '@storybook/react-vite';

import { CommentThread } from './comment-thread';

const meta: Meta<typeof CommentThread> = {
  title: 'domain/CommentThread',
  component: CommentThread,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof CommentThread>;

export const WithComments: Story = {
  render: () => (
    <CommentThread
      className="max-w-md"
      comments={[
        {
          id: 1,
          body: 'Please explain the repeated course before I can approve.',
          author: { id: 2, name: 'Amr Advisor' },
          created_at: '2026-10-01T10:30:00.000Z',
        },
        {
          id: 2,
          body: 'The plan looks balanced now. Good to submit.',
          author: { id: 2, name: 'Amr Advisor' },
          created_at: '2026-10-02T08:00:00.000Z',
        },
      ]}
      onSubmit={() => {}}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <CommentThread className="max-w-md" comments={[]} onSubmit={() => {}} />
  ),
};
