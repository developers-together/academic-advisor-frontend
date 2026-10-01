import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { screen } from '@/testing/test-utils';
import type { UserRole } from '@/types/domain';

import { PermissionDenied, roleHome } from '../authorization';

const roleHomeExpectations: Array<[UserRole, string]> = [
  ['student', '/app'],
  ['advisor', '/advisor'],
  ['dean', '/dean'],
  ['vp', '/vp'],
  ['admin', '/admin/students'],
];

test.each(roleHomeExpectations)('lands %s on %s', (role, href) => {
  expect(roleHome(role)).toBe(href);
});

test('the permission panel names the audience and offers a way back', () => {
  render(
    <MemoryRouter>
      <PermissionDenied
        audience="advisor"
        backTo={{ label: 'Back', href: '/app' }}
      />
    </MemoryRouter>,
  );

  expect(screen.getByText(/this area is for/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/app',
  );
});
