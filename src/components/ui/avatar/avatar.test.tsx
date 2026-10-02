import { render, screen } from '@/testing/test-utils';

import { Avatar } from './avatar';

test('renders the initials of the first two name parts', () => {
  render(<Avatar name="Sara Student" />);

  expect(screen.getByText('SS')).toBeInTheDocument();
});

test('falls back to a placeholder for an empty name', () => {
  render(<Avatar name="" />);

  expect(screen.getByText('?')).toBeInTheDocument();
});

test.each([
  ['sm', 'size-6'],
  ['md', 'size-8'],
  ['lg', 'size-10'],
] as const)('renders the %s size as a %s box', (size, boxClass) => {
  render(<Avatar name="Sara Student" size={size} />);

  expect(screen.getByText('SS')).toHaveClass(boxClass);
});

test('renders students on the crimson tint', () => {
  render(<Avatar name="Sara Student" forRole="student" />);

  expect(screen.getByText('SS')).toHaveClass('bg-crimson-100');
  expect(screen.getByText('SS')).toHaveClass('text-crimson-800');
});

test('is hidden from screen readers next to the visible name', () => {
  render(<Avatar name="Sara Student" />);

  expect(screen.getByText('SS')).toHaveAttribute('aria-hidden', 'true');
});
