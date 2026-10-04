import { MemoryRouter } from 'react-router';

import { Button } from '@/components/ui/button';
import { render, screen } from '@/testing/test-utils';

import { PageHeader } from './page-header';

test('renders the title, description, and actions row', () => {
  render(
    <PageHeader
      title="Queue"
      description="Plans waiting for your review."
      primaryAction={<Button>Approve</Button>}
      actions={<Button variant="outline">Export</Button>}
    />,
  );

  expect(
    screen.getByRole('heading', { name: 'Queue', level: 1 }),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Plans waiting for your review.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
});

test('renders breadcrumbs above the title', () => {
  render(
    <MemoryRouter>
      <PageHeader
        title="Academic Plan"
        breadcrumbs={[
          { label: 'Students', to: '/advisor/students' },
          { label: 'Ahmed Hassan' },
        ]}
      />
    </MemoryRouter>,
  );

  expect(
    screen.getByRole('navigation', { name: 'Breadcrumb' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Students' })).toBeInTheDocument();
});

test('omits the header row when no actions are given', () => {
  render(<PageHeader title="Overview" />);

  expect(
    screen.getByRole('heading', { name: 'Overview', level: 1 }),
  ).toBeInTheDocument();
});
