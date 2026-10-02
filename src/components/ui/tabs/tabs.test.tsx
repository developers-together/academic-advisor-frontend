import { useState } from 'react';

import { render, screen, userEvent } from '@/testing/test-utils';

import { Tabs, TabsList, TabsTrigger } from './tabs';

const FilterTabs = () => {
  const [value, setValue] = useState('all');
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabsList aria-label="Queue filters">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="submitted">Submitted</TabsTrigger>
        <TabsTrigger value="under_review">Under review</TabsTrigger>
      </TabsList>
      <p>{value === 'all' ? 'Showing all' : 'Showing one'}</p>
    </Tabs>
  );
};

test('marks the active tab and exposes the tablist roles', () => {
  render(<FilterTabs />);

  const list = screen.getByRole('tablist', { name: 'Queue filters' });
  expect(list).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByRole('tab', { name: 'Submitted' })).toHaveAttribute(
    'aria-selected',
    'false',
  );
});

test('selecting a tab fires the change and styles it active', async () => {
  render(<FilterTabs />);

  await userEvent.click(screen.getByRole('tab', { name: 'Submitted' }));

  expect(screen.getByText('Showing one')).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Submitted' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByRole('tab', { name: 'Submitted' })).toHaveClass(
    'data-[state=active]:text-foreground',
  );
});

test('moves the selection with the arrow keys', async () => {
  render(<FilterTabs />);

  await userEvent.click(screen.getByRole('tab', { name: 'All' }));
  await userEvent.keyboard('{ArrowRight}');

  expect(screen.getByText('Showing one')).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Submitted' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});
