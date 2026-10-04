import userEvent from '@testing-library/user-event';
import { FileText, LayoutDashboard } from 'lucide-react';

import { render, screen } from '@/testing/test-utils';

import { CommandPalette, type CommandGroup } from './command-palette';

const groups: CommandGroup[] = [
  {
    headingKey: 'commandPalette.sections.pages',
    entries: [
      {
        id: 'home',
        label: 'Home',
        icon: LayoutDashboard,
        onSelect: vi.fn(),
      },
      {
        id: 'plan',
        label: 'My Plan',
        icon: FileText,
        onSelect: vi.fn(),
      },
    ],
  },
];

const mountPalette = () => {
  const handleOpenChange = vi.fn();
  render(
    <CommandPalette open onOpenChange={handleOpenChange} groups={groups} />,
  );
  return handleOpenChange;
};

test('renders grouped entries with combobox semantics', () => {
  mountPalette();

  expect(screen.getByRole('combobox')).toBeInTheDocument();
  expect(screen.getByRole('listbox')).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /home/i })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /my plan/i })).toBeInTheDocument();
  expect(screen.getByText('Pages')).toBeInTheDocument();
});

test('filters entries by label and shows the empty state', async () => {
  mountPalette();

  await userEvent.type(screen.getByRole('combobox'), 'plan');

  expect(screen.getByRole('option', { name: /my plan/i })).toBeInTheDocument();
  expect(
    screen.queryByRole('option', { name: /^home$/i }),
  ).not.toBeInTheDocument();

  await userEvent.clear(screen.getByRole('combobox'));
  await userEvent.type(screen.getByRole('combobox'), 'zzz');

  expect(screen.getByText('No results for "zzz"')).toBeInTheDocument();
});

test('keyboard navigation moves the active option and Enter selects it', async () => {
  mountPalette();

  const input = screen.getByRole('combobox');
  await userEvent.type(input, '{ArrowDown}');

  expect(screen.getByRole('option', { name: /my plan/i })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await userEvent.type(input, '{Enter}');

  expect(groups[0].entries[1].onSelect).toHaveBeenCalledOnce();
});

test('clicking an entry closes the palette and selects it', async () => {
  const handleOpenChange = mountPalette();

  await userEvent.click(screen.getByRole('option', { name: /^home$/i }));

  expect(groups[0].entries[0].onSelect).toHaveBeenCalledOnce();
  expect(handleOpenChange).toHaveBeenCalledWith(false);
});
