import { render, screen } from '@/testing/test-utils';

import { SlotViewer } from './slot-viewer';

test('visit slot ranges convert to Africa/Cairo 24h times', () => {
  render(
    <SlotViewer
      slots={[
        {
          id: 1,
          starts_at: '2026-11-05T12:00:00.000Z',
          ends_at: '2026-11-05T13:30:00.000Z',
        },
        {
          id: 2,
          starts_at: '2026-07-05T08:00:00.000Z',
          ends_at: '2026-07-05T09:00:00.000Z',
        },
      ]}
    />,
  );

  expect(screen.getByText('05 Nov 2026, 14:00-15:30')).toBeInTheDocument();
  expect(screen.getByText('05 Jul 2026, 11:00-12:00')).toBeInTheDocument();
});

test('renders nothing to convert when no slots are proposed', () => {
  const { container } = render(<SlotViewer slots={[]} />);

  expect(container).toBeEmptyDOMElement();
});
