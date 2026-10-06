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
    expect(screen.getByText(/Academic pulse/i)).toBeInTheDocument();
    expect(screen.getAllByText('6 of 12–18 credits').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Plan returned — read the feedback'),
    ).toBeInTheDocument();
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
