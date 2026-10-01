import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmptyState } from './empty-state';

const meta: Meta<typeof EmptyState> = {
  title: 'ui/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  render: () => (
    <EmptyState
      title="No plan for 2026F yet."
      description="Start in the Plan Builder."
      action={{ label: 'Start your plan', onClick: () => {} }}
    />
  ),
};

export const Compact: Story = {
  render: () => <EmptyState compact title="No comments yet." />,
};
