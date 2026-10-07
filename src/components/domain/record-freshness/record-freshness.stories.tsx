import type { Meta, StoryObj } from '@storybook/react-vite';

import { RecordFreshness } from './record-freshness';

const meta: Meta<typeof RecordFreshness> = {
  title: 'domain/RecordFreshness',
  component: RecordFreshness,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof RecordFreshness>;

export const Synced: Story = {
  render: () => (
    <RecordFreshness
      lastSyncedAt="2026-10-01T12:00:00.000Z"
      onRetry={() => {}}
    />
  ),
};

export const NeverSynced: Story = {
  render: () => <RecordFreshness lastSyncedAt={null} onRetry={() => {}} />,
};
