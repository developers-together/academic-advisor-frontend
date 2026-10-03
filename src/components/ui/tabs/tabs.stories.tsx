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

const statuses = [
  { value: 'all', label: 'All', rows: ['Queue item one', 'Queue item two'] },
  { value: 'submitted', label: 'Submitted', rows: ['Queue item two'] },
  { value: 'under_review', label: 'Under review', rows: ['Queue item one'] },
] as const;

const FilterTabs = () => {
  const [value, setValue] = useState<string>('all');

  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabsList aria-label="Queue filters">
        {statuses.map((status) => (
          <TabsTrigger key={status.value} value={status.value}>
            {status.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {statuses.map((status) => (
        <TabsContent key={status.value} value={status.value}>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {status.rows.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export const FilterRow: Story = {
  render: () => <FilterTabs />,
};

export const WithCounts: Story = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList aria-label="Queue filters">
        <TabsTrigger value="all">All (3)</TabsTrigger>
        <TabsTrigger value="submitted">Submitted (2)</TabsTrigger>
        <TabsTrigger value="under_review">Under review (1)</TabsTrigger>
      </TabsList>
      <TabsContent value="all">3 plans match the queue filters.</TabsContent>
      <TabsContent value="submitted">
        2 plans match the queue filters.
      </TabsContent>
      <TabsContent value="under_review">
        1 plan matches the queue filters.
      </TabsContent>
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
