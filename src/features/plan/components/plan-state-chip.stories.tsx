import type { Meta, StoryObj } from '@storybook/react-vite';

import { PlanStateChip } from './plan-state-chip';

const meta: Meta<typeof PlanStateChip> = {
  title: 'domain/PlanStateChip',
  component: PlanStateChip,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof PlanStateChip>;

const statuses = [
  'draft',
  'submitted',
  'under_review',
  'returned',
  'approved',
  'expired',
  'closed',
  'withdrawn',
  'discarded',
] as const;

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {statuses.map((status) => (
        <PlanStateChip key={status} status={status} />
      ))}
    </div>
  ),
};

export const DotOnly: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {statuses.map((status) => (
        <PlanStateChip key={status} status={status} variant="dot" />
      ))}
    </div>
  ),
};

export const BannerSize: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <PlanStateChip status="under_review" variant="banner" />
      <PlanStateChip status="approved" variant="banner" />
    </div>
  ),
};
