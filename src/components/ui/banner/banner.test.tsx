import { render, screen } from '@/testing/test-utils';

import { Banner, ErrorState } from './banner';

test('renders destructive banners with alert semantics', () => {
  render(
    <Banner variant="destructive" title="Failed">
      Retry in a moment.
    </Banner>,
  );

  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByText('Failed')).toBeInTheDocument();
});

test('error state exposes retry and the request reference', () => {
  render(<ErrorState onRetry={() => {}} requestId="req-42" />);

  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  expect(screen.getByText(/req-42/)).toBeInTheDocument();
});
