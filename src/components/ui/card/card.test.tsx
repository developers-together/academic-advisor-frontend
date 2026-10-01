import { render, screen } from '@/testing/test-utils';

import { Card, CardBody, CardTitle } from './card';

test('renders card content', () => {
  render(
    <Card>
      <CardBody>
        <CardTitle>Term 2026F</CardTitle>
        <p>4 courses planned</p>
      </CardBody>
    </Card>,
  );

  expect(screen.getByText('Term 2026F')).toBeInTheDocument();
  expect(screen.getByText('4 courses planned')).toBeInTheDocument();
});
