import { formatDateTime } from '@/lib/i18n/format';
import { render, screen, userEvent } from '@/testing/test-utils';

import { StaleSisBanner } from './stale-sis-banner';

const LAST_SYNCED_AT = '2026-10-01T12:00:00.000Z';

test('lists the stale datasets with the data-as-of title', () => {
  render(
    <StaleSisBanner
      staleness={{
        identity: false,
        academic_record: true,
        course_catalog: true,
      }}
      lastSyncedAt={LAST_SYNCED_AT}
      onRetry={() => {}}
    />,
  );

  const banner = screen.getByRole('status');
  expect(banner).toHaveTextContent(
    `Data as of ${formatDateTime(LAST_SYNCED_AT)}`,
  );
  expect(banner).toHaveTextContent('academic record');
  expect(banner).toHaveTextContent('course catalog');
});

test('lists the identity dataset when only it is stale', () => {
  render(
    <StaleSisBanner
      staleness={{
        identity: true,
        academic_record: false,
        course_catalog: false,
      }}
      lastSyncedAt={LAST_SYNCED_AT}
      onRetry={() => {}}
    />,
  );

  const banner = screen.getByRole('status');
  expect(banner).toHaveTextContent('identity');
  expect(banner).not.toHaveTextContent('academic record');
});

test('renders nothing when every dataset is current', () => {
  const { container } = render(
    <StaleSisBanner
      staleness={{
        identity: false,
        academic_record: false,
        course_catalog: false,
      }}
      lastSyncedAt={LAST_SYNCED_AT}
      onRetry={() => {}}
    />,
  );

  expect(container).toBeEmptyDOMElement();
});

test('the retry action calls back', async () => {
  const onRetry = vi.fn();
  render(
    <StaleSisBanner
      staleness={{
        identity: false,
        academic_record: true,
        course_catalog: false,
      }}
      lastSyncedAt={LAST_SYNCED_AT}
      onRetry={onRetry}
    />,
  );

  await userEvent.click(screen.getByRole('button', { name: /retry/i }));

  expect(onRetry).toHaveBeenCalledTimes(1);
});
