import type { Meta, StoryObj } from '@storybook/react-vite';

import { KpiCard } from './kpi-card';

const meta: Meta<typeof KpiCard> = {
  title: 'ui/KpiCard',
  component: KpiCard,
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj<typeof KpiCard>;

export const Default: Story = {
  render: () => (
    <KpiCard label="CGPA" value="3.2" context="On a 4.0 scale, from the SIS" />
  ),
};

export const VerbatimValue: Story = {
  render: () => (
    <KpiCard
      label="Remaining requirements"
      value="60 credit hours"
      context="As reported by the SIS"
    />
  ),
};
