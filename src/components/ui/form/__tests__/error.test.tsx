import { rtlRender, screen } from '@/testing/test-utils';

import { Error } from '../error';

test('a namespaced dictionary message renders as translated copy', () => {
  rtlRender(<Error errorMessage="auth:errors.nationalIdInvalid" />);

  expect(
    screen.getByRole('alert', { name: 'The National ID is 14 digits.' }),
  ).toBeInTheDocument();
});

test('a plain message renders verbatim', () => {
  rtlRender(
    <Error errorMessage="The password must be at least 8 characters." />,
  );

  expect(
    screen.getByRole('alert', {
      name: 'The password must be at least 8 characters.',
    }),
  ).toBeInTheDocument();
});
