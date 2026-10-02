import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'ui/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const FilterRow: Story = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList aria-label="Queue filters">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="submitted">Submitted</TabsTrigger>
        <TabsTrigger value="under_review">Under review</TabsTrigger>
      </TabsList>
    </Tabs>
  ),
};

export const WithCounts: Story = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList aria-label="Queue filters">
        <TabsTrigger value="all">All (3)</TabsTrigger>
        <TabsTrigger value="submitted">Submitted (2)</TabsTrigger>
        <TabsTrigger value="under_review">Under review (1)</TabsTrigger>
      </TabsList>
    </Tabs>
  ),
};

const ControlledTabs = () => {
  const [value, setValue] = useState('one');
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabsList aria-label="Panels">
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
      </TabsList>
      <TabsContent value="one">First panel</TabsContent>
      <TabsContent value="two">Second panel</TabsContent>
    </Tabs>
  );
};

export const WithPanels: Story = {
  render: () => <ControlledTabs />,
};
