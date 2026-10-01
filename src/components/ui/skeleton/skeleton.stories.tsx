import type { Meta, StoryObj } from '@storybook/react-vite';

import { Skeleton, SkeletonCard, SkeletonText } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'ui/Skeleton',
  component: Skeleton,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Shapes: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Skeleton className="h-10 w-40" />
      <SkeletonText lines={3} />
      <SkeletonCard />
    </div>
  ),
};
