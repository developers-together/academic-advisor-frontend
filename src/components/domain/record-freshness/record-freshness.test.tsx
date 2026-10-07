import { formatDateTime } from '@/lib/i18n/format';
import { render, screen, userEvent } from '@/testing/test-utils';

import { RecordFreshness } from './record-freshness';

const LAST_SYNCED_AT = '2026-10-01T12:00:00.000Z';

test('labels the data with its as-of time', () => {
  render(<RecordFreshness lastSyncedAt={LAST_SYNCED_AT} onRetry={() => {}} />);

  expect(
    screen.getByText(`Data as of ${formatDateTime(LAST_SYNCED_AT)}`),
  ).toBeInTheDocument();
});

test('renders nothing when the record never synced', () => {
  const { container } = render(
    <RecordFreshness lastSyncedAt={null} onRetry={() => {}} />,
  );

  expect(container).toBeEmptyDOMElement();
});

test('the retry action calls back', async () => {
  const onRetry = vi.fn();
  render(<RecordFreshness lastSyncedAt={LAST_SYNCED_AT} onRetry={onRetry} />);

  await userEvent.click(screen.getByRole('button', { name: /retry/i }));

  expect(onRetry).toHaveBeenCalledTimes(1);
});
