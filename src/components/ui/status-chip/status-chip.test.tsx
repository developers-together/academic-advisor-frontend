import { render, screen } from '@/testing/test-utils';

import { StatusChip } from './status-chip';

test.each([
  ['requested', 'info', 'Requested'],
  ['awaiting_response', 'warning', 'Awaiting response'],
  ['confirmed', 'success', 'Confirmed'],
  ['declined', 'destructive', 'Declined'],
] as const)(
  'renders the %s meeting status with its tone',
  (status, tone, label) => {
    render(<StatusChip domain="meeting" status={status} />);

    const chip = screen.getByText(label);
    expect(chip).toBeInTheDocument();
    expect(chip.parentElement).toHaveClass(
      {
        info: 'bg-info/10',
        warning: 'bg-warning/10',
        success: 'bg-success/10',
        destructive: 'bg-destructive/10',
      }[tone],
    );
  },
);

test('announces the full status to screen readers', () => {
  render(<StatusChip domain="meeting" status="confirmed" />);

  expect(screen.getByText('Meeting status: Confirmed')).toBeInTheDocument();
});

test('renders account and data statuses', () => {
  render(
    <>
      <StatusChip domain="account" status="active" />
      <StatusChip domain="data" status="saving" />
    </>,
  );

  expect(screen.getByText('Active')).toBeInTheDocument();
  expect(screen.getByText('Saving')).toBeInTheDocument();
});
