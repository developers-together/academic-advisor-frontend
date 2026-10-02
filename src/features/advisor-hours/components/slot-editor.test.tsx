import { render, screen, userEvent, waitFor } from '@/testing/test-utils';
import type { AvailabilityWindowRow } from '@/types/domain';

import { SlotEditor } from './slot-editor';

const baseRows: AvailabilityWindowRow[] = [
  { day: 'Sunday', from: '10:00', to: '12:00' },
];

type Setup = {
  rows?: AvailabilityWindowRow[];
  onSubmit?: (rows: AvailabilityWindowRow[]) => void;
  submitPending?: boolean;
};

const renderEditor = ({
  rows = baseRows,
  onSubmit = () => {},
  submitPending = false,
}: Setup = {}) =>
  render(
    <SlotEditor
      initialRows={rows}
      onSubmit={onSubmit}
      submitPending={submitPending}
    />,
  );

const daySelects = () => screen.getAllByLabelText('Day');
const fromFields = () => screen.getAllByLabelText('From');
const toFields = () => screen.getAllByLabelText('To');

const changeDay = async (index: number, value: string) => {
  await userEvent.selectOptions(daySelects()[index], value);
};

const changeTime = async (
  fields: typeof fromFields,
  index: number,
  value: string,
) => {
  const field = fields()[index];
  field.focus();
  await userEvent.clear(field);
  await userEvent.type(field, value);
};

test('renders the day token select and the times as written without converting', async () => {
  renderEditor();

  expect(daySelects()[0]).toHaveValue('Sunday');
  expect(fromFields()[0]).toHaveValue('10:00');
  expect(toFields()[0]).toHaveValue('12:00');

  await changeDay(0, 'Wednesday');
  expect(daySelects()[0]).toHaveValue('Wednesday');
});

test('an end-before-start row renders the hard inline error and blocks publish', async () => {
  const onSubmit = vi.fn();
  renderEditor({ onSubmit });

  await changeTime(toFields, 0, '09:00');

  expect(
    screen.getByText('End time must be after the start time.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Publish hours' })).toBeDisabled();
  expect(onSubmit).not.toHaveBeenCalled();

  await changeTime(toFields, 0, '12:00');
  expect(
    screen.queryByText('End time must be after the start time.'),
  ).not.toBeInTheDocument();
});

test('two overlapping rows on one day render the overlap error naming the day and block publish', async () => {
  const onSubmit = vi.fn();
  renderEditor({
    rows: [
      { day: 'Sunday', from: '10:00', to: '12:00' },
      { day: 'Sunday', from: '11:00', to: '13:00' },
    ],
    onSubmit,
  });

  expect(
    screen.getByText(
      'Two rows overlap on Sunday. Adjust the times so each row stands alone.',
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Publish hours' })).toBeDisabled();

  await changeTime(fromFields, 1, '12:00');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Publish hours' })).toBeEnabled(),
  );
});

test('an incomplete row renders the inline error and blocks publish', async () => {
  const onSubmit = vi.fn();
  renderEditor({ rows: [], onSubmit });

  await userEvent.click(screen.getByRole('button', { name: 'Add a row' }));

  expect(screen.getByText('Fill the day and both times.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Publish hours' })).toBeDisabled();
});

test('rows cap at five and the cap helper renders', async () => {
  renderEditor({
    rows: [
      { day: 'Sunday', from: '10:00', to: '11:00' },
      { day: 'Monday', from: '10:00', to: '11:00' },
      { day: 'Tuesday', from: '10:00', to: '11:00' },
      { day: 'Wednesday', from: '10:00', to: '11:00' },
      { day: 'Thursday', from: '10:00', to: '11:00' },
    ],
  });

  expect(screen.getByText('Up to 5 rows.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add a row' })).toBeDisabled();
});

test('remove row drops the row and publish submits the edited rows', async () => {
  const onSubmit = vi.fn();
  renderEditor({
    rows: [
      { day: 'Sunday', from: '10:00', to: '12:00' },
      { day: 'Tuesday', from: '13:00', to: '15:00' },
    ],
    onSubmit,
  });

  await userEvent.click(
    screen.getAllByRole('button', { name: 'Remove row' })[1],
  );
  await waitFor(() => expect(screen.getAllByLabelText('Day')).toHaveLength(1));

  await changeDay(0, 'Monday');
  await userEvent.click(screen.getByRole('button', { name: 'Publish hours' }));

  expect(onSubmit).toHaveBeenCalledWith([
    { day: 'Monday', from: '10:00', to: '12:00' },
  ]);
});
