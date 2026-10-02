import type { Meta, StoryObj } from '@storybook/react-vite';

import { SlotViewer } from './slot-viewer';

const meta: Meta<typeof SlotViewer> = {
  title: 'domain/SlotViewer',
  component: SlotViewer,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof SlotViewer>;

export const ProposedTimes: Story = {
  render: () => (
    <SlotViewer
      className="max-w-md"
      slots={[
        {
          id: 1,
          starts_at: '2026-11-05T12:00:00.000Z',
          ends_at: '2026-11-05T13:30:00.000Z',
        },
        {
          id: 2,
          starts_at: '2026-11-08T09:00:00.000Z',
          ends_at: '2026-11-08T10:00:00.000Z',
        },
      ]}
    />
  ),
};

export const NoTimes: Story = {
  render: () => <SlotViewer slots={[]} />,
};
