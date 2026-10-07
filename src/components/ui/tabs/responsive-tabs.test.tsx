import { render, screen } from '@/testing/test-utils';

import { ResponsiveTabs } from './responsive-tabs';

const options = [
  { value: 'all', label: 'All', count: 3 },
  { value: 'open', label: 'Open', count: 2 },
  { value: 'done', label: 'Done', count: 1 },
];

const stubMatchMedia = (matchesMaxWidth: boolean) => {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: matchesMaxWidth && query.includes('max-width'),
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
};

test('wide viewports render the tab list with counts', () => {
  const restore = stubMatchMedia(false);
  render(
    <ResponsiveTabs
      value="all"
      onValueChange={() => {}}
      options={options}
      aria-label="Queue filters"
    />,
  );

  expect(
    screen.getByRole('tablist', { name: 'Queue filters' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /All/ })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Filter' }),
  ).not.toBeInTheDocument();
  restore();
});

test('narrow viewports render a filter button opening a bottom sheet', async () => {
  const { userEvent } = await import('@/testing/test-utils');
  const restore = stubMatchMedia(true);
  const onValueChange = vi.fn();
  render(
    <ResponsiveTabs
      value="all"
      onValueChange={onValueChange}
      options={options}
      aria-label="Queue filters"
    />,
  );

  expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Queue filters' }));

  const sheet = screen.getByRole('radiogroup', { name: 'Queue filters' });
  expect(sheet).toBeInTheDocument();
  expect(
    (await import('@testing-library/react')).within(sheet).getByRole('radio', {
      name: 'Open (2)',
    }),
  ).toBeInTheDocument();

  await userEvent.click(
    (await import('@testing-library/react')).within(sheet).getByRole('radio', {
      name: 'Open (2)',
    }),
  );
  restore();
});
