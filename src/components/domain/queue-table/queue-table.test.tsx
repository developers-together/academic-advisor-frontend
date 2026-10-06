import { render, screen, within } from '@/testing/test-utils';

import { QueueTable } from './queue-table';

const item = (
  overrides: Partial<Parameters<typeof QueueTable>[0]['items'][number]>,
) => ({
  id: 201,
  student: { id: 9001, name: 'Lina Majors', student_id: '3020451' },
  status: 'submitted' as const,
  term_code: '2026F',
  submitted_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  is_aging: false,
  ...overrides,
});

describe('QueueTable (decision rails)', () => {
  it('renders one rail per plan in the given order with a single primary action', () => {
    const items = [
      item({
        id: 1,
        student: { id: 9001, name: 'Lina Majors', student_id: '3020451' },
      }),
      item({
        id: 2,
        student: { id: 9002, name: 'Omar Fathi', student_id: '3020452' },
      }),
      item({
        id: 3,
        student: { id: 9003, name: 'Nour Adel', student_id: '3020453' },
      }),
    ];
    render(<QueueTable items={items} activeId={null} onActivate={() => {}} />);

    const reviews = screen.getAllByRole('button', { name: 'Review' });
    expect(reviews).toHaveLength(3);
    expect(screen.getByText('Lina Majors')).toBeInTheDocument();
    expect(screen.getByText('Omar Fathi')).toBeInTheDocument();
    expect(screen.getByText('Nour Adel')).toBeInTheDocument();
  });

  it('renders waiting days with tabular numerals and the aging badge', () => {
    render(
      <QueueTable
        items={[item({ id: 201, is_aging: true })]}
        activeId={null}
        onActivate={() => {}}
      />,
    );
    const rail = screen.getByText('Lina Majors').closest('li') as HTMLElement;
    expect(within(rail).getByText('3 days')).toHaveClass('tabular-nums');
    expect(within(rail).getByText(/Aging/i)).toBeInTheDocument();
  });

  it('renders the singular waiting day', () => {
    render(
      <QueueTable
        items={[
          item({
            id: 202,
            submitted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          }),
        ]}
        activeId={null}
        onActivate={() => {}}
      />,
    );
    expect(screen.getByText('1 day')).toBeInTheDocument();
  });

  it('marks the active rail', () => {
    render(
      <QueueTable
        items={[item({ id: 201 })]}
        activeId={201}
        onActivate={() => {}}
      />,
    );
    const rail = screen.getByText('Lina Majors').closest('li') as HTMLElement;
    expect(rail).toHaveAttribute('aria-current', 'true');
  });
});
