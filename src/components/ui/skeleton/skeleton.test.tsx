import { render } from '@/testing/test-utils';

import { Skeleton, SkeletonCard, SkeletonText } from './skeleton';

test('renders skeleton shapes', () => {
  render(
    <div>
      <Skeleton className="h-4 w-10" />
      <SkeletonText lines={2} />
      <SkeletonCard />
    </div>,
  );

  expect(
    document.querySelectorAll('[aria-hidden="true"]').length,
  ).toBeGreaterThan(0);
});
