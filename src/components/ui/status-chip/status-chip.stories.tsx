import type { Meta, StoryObj } from '@storybook/react-vite';

import { StatusChip } from './status-chip';

const meta: Meta<typeof StatusChip> = {
  title: 'ui/StatusChip',
  component: StatusChip,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof StatusChip>;

export const MeetingRequested: Story = {
  render: () => <StatusChip domain="meeting" status="requested" />,
};

export const MeetingAwaitingResponse: Story = {
  render: () => <StatusChip domain="meeting" status="awaiting_response" />,
};

export const MeetingConfirmed: Story = {
  render: () => <StatusChip domain="meeting" status="confirmed" />,
};

export const MeetingCancelled: Story = {
  render: () => <StatusChip domain="meeting" status="cancelled" />,
};

export const AccountSuspended: Story = {
  render: () => <StatusChip domain="account" status="suspended" />,
};

export const DataSaved: Story = {
  render: () => <StatusChip domain="data" status="saved" />,
};
