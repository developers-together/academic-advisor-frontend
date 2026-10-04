import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrowserRouter } from 'react-router';

import { Breadcrumb } from './breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
  title: 'ui/Breadcrumb',
  component: Breadcrumb,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

export const TwoLevels: Story = {
  render: () => (
    <Breadcrumb
      items={[
        { label: 'Students', to: '/advisor/students' },
        { label: 'Ahmed Hassan' },
      ]}
    />
  ),
};

export const LongTrail: Story = {
  render: () => (
    <Breadcrumb
      items={[
        { label: 'Home', to: '/app' },
        { label: 'My Plan', to: '/app/plan' },
        { label: 'First Semester', to: '/app/plan' },
        { label: 'Course', to: '/app/plan' },
        { label: 'CS 402' },
      ]}
    />
  ),
};
