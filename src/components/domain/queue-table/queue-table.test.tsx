import dayjs from 'dayjs';

import { render, screen, within, userEvent } from '@/testing/test-utils';
import type { AdvisorQueueItem } from '@/types/domain';

import { QueueTable } from './queue-table';

const item = (
  overrides: Partial<AdvisorQueueItem> & { id: number; name: string },
): AdvisorQueueItem => ({
  student: { id: overrides.id + 50, name: overrides.name, student_id: null },
  status: 'submitted',
  term_code: '2026F',
  submitted_at: dayjs().subtract(3, 'day').toISOString(),
  is_aging: false,
  ...overrides,
});

const items: AdvisorQueueItem[] = [
  item({ id: 201, name: 'Lina Majors', is_aging: true }),
  item({ id: 202, name: 'Omar Fathi' }),
  item({ id: 203, name: 'Nour Adel', status: 'under_review' }),
];

test('renders the rows in the given order and builds no sort control', () => {
  render(<QueueTable items={items} activeId={null} onActivate={() => {}} />);

  const names = screen
    .getAllByRole('button')
    .map((button) => button.textContent);
  expect(names.some((text) => text?.includes('Lina Majors'))).toBe(true);
  expect(names.some((text) => text?.includes('Omar Fathi'))).toBe(true);
  expect(names.some((text) => text?.includes('Nour Adel'))).toBe(true);
  expect(names[0]).toContain('Lina Majors');
  expect(names[2]).toContain('Nour Adel');

  for (const head of screen.getAllByRole('columnheader')) {
    expect(head).not.toHaveAttribute('aria-sort');
  }
});

test('renders waiting days from the submission date with tabular numerals', () => {
  render(
    <QueueTable
      items={[item({ id: 201, name: 'Lina Majors' })]}
      activeId={null}
      onActivate={() => {}}
    />,
  );

  const row = screen.getByText('Lina Majors').closest('tr') as HTMLElement;
  expect(within(row).getByText('3 days')).toHaveClass('tabular-nums');
});

test('renders the singular waiting day', () => {
  render(
    <QueueTable
      items={[
        item({
          id: 201,
          name: 'Omar Fathi',
          submitted_at: dayjs().subtract(1, 'day').toISOString(),
        }),
      ]}
      activeId={null}
      onActivate={() => {}}
    />,
  );

  expect(screen.getByText('1 day')).toBeInTheDocument();
  expect(screen.queryByText('Aging')).not.toBeInTheDocument();
});

test('shows the Aging badge only for items the server flags as aging', () => {
  render(<QueueTable items={items} activeId={null} onActivate={() => {}} />);

  const lina = screen.getByText('Lina Majors').closest('tr') as HTMLElement;
  const omar = screen.getByText('Omar Fathi').closest('tr') as HTMLElement;
  expect(within(lina).getByText('Aging')).toBeInTheDocument();
  expect(within(omar).queryByText('Aging')).not.toBeInTheDocument();
});

test('renders the plan state as a dot-only chip with its label', () => {
  render(
    <QueueTable
      items={[item({ id: 203, name: 'Nour Adel', status: 'under_review' })]}
      activeId={null}
      onActivate={() => {}}
    />,
  );

  const row = screen.getByText('Nour Adel').closest('tr') as HTMLElement;
  expect(within(row).getByText('Under review')).toBeInTheDocument();
});

test('marks the active row with aria-current', () => {
  render(<QueueTable items={items} activeId={202} onActivate={() => {}} />);

  const omar = screen.getByText('Omar Fathi').closest('tr') as HTMLElement;
  const lina = screen.getByText('Lina Majors').closest('tr') as HTMLElement;
  expect(omar).toHaveAttribute('aria-current', 'true');
  expect(lina).not.toHaveAttribute('aria-current');
});

test('activates a row through its review button', async () => {
  const onActivate = vi.fn();
  render(<QueueTable items={items} activeId={null} onActivate={onActivate} />);

  await userEvent.click(
    screen.getByRole('button', { name: "Review Nour Adel's plan" }),
  );

  expect(onActivate).toHaveBeenCalledWith(items[2]);
});

test('filters rows client-side with counts on the tabs', async () => {
  render(<QueueTable items={items} activeId={null} onActivate={() => {}} />);

  expect(screen.getByRole('tab', { name: 'All (3)' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(
    screen.getByRole('tab', { name: 'Submitted (2)' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('tab', { name: 'Under review (1)' }),
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole('tab', { name: 'Under review (1)' }));

  expect(screen.getByText('Nour Adel')).toBeInTheDocument();
  expect(screen.queryByText('Lina Majors')).not.toBeInTheDocument();
  expect(screen.queryByText('Omar Fathi')).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('tab', { name: 'Submitted (2)' }));
  expect(screen.getByText('Lina Majors')).toBeInTheDocument();
  expect(screen.queryByText('Nour Adel')).not.toBeInTheDocument();
});
