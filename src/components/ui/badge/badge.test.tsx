import { render, screen } from '@/testing/test-utils';

import { Badge } from './badge';

test('renders its text', () => {
  render(<Badge>Aging</Badge>);

  expect(screen.getByText('Aging')).toBeInTheDocument();
});

test.each([
  ['neutral', 'bg-muted'],
  ['success', 'bg-success/10'],
  ['warning', 'bg-warning/10'],
  ['info', 'bg-info/10'],
  ['destructive', 'bg-destructive/10'],
] as const)('renders the %s variant on its tint pair', (variant, tint) => {
  render(<Badge variant={variant}>Aging</Badge>);

  expect(screen.getByText('Aging')).toHaveClass(tint);
});

test('renders the sm size with the dense type size', () => {
  render(<Badge size="sm">Aging</Badge>);

  expect(screen.getByText('Aging')).toHaveClass('text-2xs');
});

test('renders the md size with the caption type size', () => {
  render(<Badge size="md">Aging</Badge>);

  expect(screen.getByText('Aging')).toHaveClass('text-xs');
});

test('pairs an optional decorative dot with the text', () => {
  render(
    <Badge variant="warning" dot>
      Aging
    </Badge>,
  );

  expect(screen.getByText('Aging')).toBeInTheDocument();
  const dot = screen.getByText('Aging').firstElementChild;
  expect(dot).toHaveAttribute('aria-hidden', 'true');
});

test('carries its meaning in text without the dot', () => {
  render(<Badge variant="warning">Aging</Badge>);

  expect(screen.queryByLabelText('Aging')).not.toBeInTheDocument();
  expect(screen.getByText('Aging')).not.toHaveAttribute('aria-hidden');
});
