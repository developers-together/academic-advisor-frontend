import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'ui/Badge',
  component: Badge,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Neutral: Story = {
  render: () => <Badge>Draft</Badge>,
};

export const WithDot: Story = {
  render: () => (
    <Badge variant="warning" dot>
      Aging
    </Badge>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge size="sm" variant="warning" dot>
        Aging
      </Badge>
      <Badge size="md" variant="warning" dot>
        Aging
      </Badge>
    </div>
  ),
};
