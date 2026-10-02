import { render, screen, userEvent } from '@/testing/test-utils';

import { Combobox } from '../combobox';

const options = [
  {
    value: 'CS 101',
    label: 'CS 101 Introduction to Programming',
    hint: 'Completed',
  },
  { value: 'CS 201', label: 'CS 201 Data Structures', hint: 'Eligible' },
  { value: 'CS 301', label: 'CS 301 Algorithms', hint: 'Locked' },
];

const renderCombobox = () => {
  const onSelect = vi.fn();
  render(
    <Combobox
      options={options}
      placeholder="Add a course"
      ariaLabel="Add a course"
      emptyMessage={(query) => `No courses match "${query}".`}
      onSelect={onSelect}
    />,
  );
  return { onSelect };
};

test('renders a labelled combobox input', () => {
  renderCombobox();

  const input = screen.getByRole('combobox', { name: 'Add a course' });
  expect(input).toHaveAttribute('aria-expanded', 'false');
});

test('opens on focus, lists options with their hints, and selects with the keyboard', async () => {
  const { onSelect } = renderCombobox();

  const input = screen.getByRole('combobox', { name: 'Add a course' });
  input.focus();

  const first = await screen.findByRole('option', { name: /CS 101/ });
  expect(first).toHaveTextContent('Completed');
  expect(screen.getByRole('option', { name: /CS 301/ })).toHaveTextContent(
    'Locked',
  );
  expect(input).toHaveAttribute('aria-expanded', 'true');

  await userEvent.keyboard('algorithms');
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{Enter}');

  expect(onSelect).toHaveBeenCalledWith('CS 301');
});

test('an empty search names the query', async () => {
  renderCombobox();

  const input = screen.getByRole('combobox', { name: 'Add a course' });
  input.focus();
  await userEvent.type(input, 'zzz');

  expect(
    await screen.findByText('No courses match "zzz".'),
  ).toBeInTheDocument();
  expect(screen.queryByRole('option')).not.toBeInTheDocument();
});

test('escape closes the list without selecting', async () => {
  const { onSelect } = renderCombobox();

  const input = screen.getByRole('combobox', { name: 'Add a course' });
  input.focus();
  await screen.findByRole('option', { name: /CS 101/ });
  await userEvent.keyboard('{Escape}');

  expect(input).toHaveAttribute('aria-expanded', 'false');
  expect(onSelect).not.toHaveBeenCalled();
});
