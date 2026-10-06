import { MemoryRouter } from 'react-router';

import { render, screen } from '@/testing/test-utils';

import { PulseStrip } from './pulse-strip';

describe('PulseStrip', () => {
  it('renders the three segments with persistent labels and exact values', () => {
    render(
      <MemoryRouter>
        <PulseStrip
          planStatus="returned"
          planStatusLabel="Returned"
          credits={6}
          creditsMin={12}
          creditsMax={18}
          earnedShare={40}
          planHref="#/app/plan"
          recordHref="#/app/record"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Plan state')).toBeInTheDocument();
    expect(screen.getByText('Credit load')).toBeInTheDocument();
    expect(screen.getByText('Degree progress')).toBeInTheDocument();
    expect(screen.getAllByText('6 of 12–18 credits')).toHaveLength(1);
    expect(screen.getByText('40% of the curriculum')).toBeInTheDocument();
    expect(
      screen.getByText('Plan returned — read the feedback'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open my plan' })).toHaveAttribute(
      'href',
      '/#/app/plan',
    );
  });

  it('flags a below-minimum load in the load line', () => {
    render(
      <MemoryRouter>
        <PulseStrip
          planStatus="draft"
          planStatusLabel="Draft"
          credits={6}
          creditsMin={12}
          creditsMax={18}
          earnedShare={40}
          planHref="#/app/plan"
          recordHref="#/app/record"
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('pulse-load')).toHaveAttribute(
      'data-under-min',
      'true',
    );
  });
});
