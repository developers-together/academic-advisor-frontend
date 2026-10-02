import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from './avatar';

const meta: Meta<typeof Avatar> = {
  title: 'ui/Avatar',
  component: Avatar,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="Sara Student" size="sm" />
      <Avatar name="Sara Student" size="md" />
      <Avatar name="Sara Student" size="lg" />
    </div>
  ),
};

export const RoleTints: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="Sara Student" forRole="student" />
      <Avatar name="Amr Advisor" forRole="advisor" />
      <Avatar name="Dina Dean" forRole="dean" />
      <Avatar name="Vera VP" forRole="vp" />
      <Avatar name="Mona Admin" forRole="admin" />
    </div>
  ),
};
