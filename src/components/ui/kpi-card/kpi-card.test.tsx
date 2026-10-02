import { render, screen } from '@/testing/test-utils';

import { KpiCard } from './kpi-card';

test('renders the label, the tabular value, and the context line', () => {
  render(
    <KpiCard label="CGPA" value="3.2" context="On a 4.0 scale, from the SIS" />,
  );

  expect(screen.getByText('CGPA')).toBeInTheDocument();
  expect(screen.getByText('3.2')).toHaveClass('tabular-nums');
  expect(screen.getByText('On a 4.0 scale, from the SIS')).toBeInTheDocument();
});

test('renders a verbatim string value without numeric formatting', () => {
  render(<KpiCard label="Remaining requirements" value="60 credit hours" />);

  expect(screen.getByText('60 credit hours')).toBeInTheDocument();
});
