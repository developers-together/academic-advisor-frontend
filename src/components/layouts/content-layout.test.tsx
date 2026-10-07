import { MemoryRouter } from 'react-router';

import { render, screen } from '@/testing/test-utils';

import { ContentLayout } from './content-layout';

test('defaults to the data width', () => {
  render(
    <MemoryRouter>
      <ContentLayout title="Overview">
        <p>Body</p>
      </ContentLayout>
    </MemoryRouter>,
  );

  expect(screen.getByText('Body').parentElement).toHaveClass('max-w-data');
});

test.each([
  ['reading', 'max-w-reading'],
  ['workflow', 'max-w-workflow'],
  ['data', 'max-w-data'],
] as const)('%s width renders its container class', (width, className) => {
  render(
    <MemoryRouter>
      <ContentLayout title="Overview" width={width}>
        <p>Body</p>
      </ContentLayout>
    </MemoryRouter>,
  );

  expect(screen.getByText('Body').parentElement).toHaveClass(className);
});
