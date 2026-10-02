import { render, screen } from '@/testing/test-utils';

import { PlanStateChip } from './plan-state-chip';

test.each([
  'draft',
  'submitted',
  'under_review',
  'returned',
  'approved',
  'expired',
  'closed',
  'withdrawn',
  'discarded',
] as const)('announces the %s state to screen readers', (status) => {
  render(<PlanStateChip status={status} />);

  expect(
    screen.getByText(`Plan status: ${labelFor(status)}`),
  ).toBeInTheDocument();
  expect(screen.getByText(labelFor(status))).toBeInTheDocument();
});

test('locked states carry the lock icon', () => {
  render(<PlanStateChip status="approved" />);

  const chip = screen.getByText('Approved').parentElement;
  expect(chip).toHaveClass('bg-state-approved');
  expect(chip?.querySelector('svg')).not.toBeNull();
});

const labelFor = (status: string) =>
  ({
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under review',
    returned: 'Returned',
    approved: 'Approved',
    expired: 'Expired',
    closed: 'Closed',
    withdrawn: 'Withdrawn',
    discarded: 'Discarded',
  })[status] ?? status;
