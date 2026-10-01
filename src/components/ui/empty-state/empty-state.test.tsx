import { render, screen } from '@/testing/test-utils';

import { EmptyState } from './empty-state';

test('renders title, description, and one action', () => {
  render(
    <EmptyState
      title="No plan for 2026F yet."
      description="Start in the Plan Builder."
      action={{ label: 'Start your plan', onClick: () => {} }}
    />,
  );

  expect(screen.getByText('No plan for 2026F yet.')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Start your plan' }),
  ).toBeInTheDocument();
});
