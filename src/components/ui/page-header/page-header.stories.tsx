import type { Meta, StoryObj } from '@storybook/react-vite';
import { BrowserRouter } from 'react-router';

import { Button } from '@/components/ui/button';

import { PageHeader } from './page-header';

const meta: Meta<typeof PageHeader> = {
  title: 'ui/PageHeader',
  component: PageHeader,
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

type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  render: () => (
    <PageHeader
      title="Queue"
      description="Plans waiting for your review."
      primaryAction={<Button>Approve</Button>}
    />
  ),
};

export const WithBreadcrumbs: Story = {
  render: () => (
    <PageHeader
      title="Academic Plan"
      description="Everything about this student's plan."
      breadcrumbs={[
        { label: 'Students', to: '/advisor/students' },
        { label: 'Ahmed Hassan' },
        { label: 'Academic Plan' },
      ]}
    />
  ),
};
