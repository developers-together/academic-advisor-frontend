import { HttpResponse, http } from 'msw';

import AdvisorHoursRoute from '@/app/routes/advisor/hours';
import { env } from '@/config/env';
import { DEFAULT_OFFICE_HOURS } from '@/testing/mocks/scenarios';
import { server } from '@/testing/mocks/server';
import {
  createUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';

const publishOverride = () => {
  let sentRows: Array<{ day: string; from: string; to: string }> = [];
  server.use(
    http.put(`${env.API_URL}/advisor/availability`, async ({ request }) => {
      sentRows = ((await request.json()) as { rows: typeof sentRows }).rows;
      const rows =
        sentRows.length > 0
          ? sentRows
          : (DEFAULT_OFFICE_HOURS as typeof sentRows);
      return HttpResponse.json({
        data: { rows, is_default: sentRows.length === 0 },
      });
    }),
  );
  return { sentRows: () => sentRows };
};

const toastContainer = () =>
  document.querySelector('[aria-live="polite"]') as HTMLElement;

const changeRowDay = async (index: number, value: string) => {
  await userEvent.selectOptions(screen.getAllByLabelText('Day')[index], value);
};

test('the editor renders the default hours as written and publishes a full replace in place with no toast', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const recorder = publishOverride();

  await renderApp(<AdvisorHoursRoute />, {
    user: advisor,
    path: '/advisor/hours',
    url: '/advisor/hours',
  });

  expect(
    await screen.findByText(
      'These are the default hours. Publish to make them yours.',
    ),
  ).toBeInTheDocument();
  expect(screen.getAllByLabelText('Day')[0]).toHaveValue('Sunday');
  expect(screen.getAllByLabelText('From')[0]).toHaveValue('10:00');
  expect(screen.getAllByLabelText('To')[0]).toHaveValue('12:00');
  expect(screen.getByText('Times are Africa/Cairo time.')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Clear hours' }),
  ).not.toBeInTheDocument();

  await changeRowDay(0, 'Monday');
  await userEvent.click(screen.getByRole('button', { name: 'Publish hours' }));

  await waitFor(() => expect(recorder.sentRows()).toHaveLength(2));
  expect(recorder.sentRows()[0]).toEqual({
    day: 'Monday',
    from: '10:00',
    to: '12:00',
  });
  expect(recorder.sentRows()[1]).toEqual({
    day: 'Tuesday',
    from: '13:00',
    to: '15:00',
  });

  expect(screen.getAllByLabelText('Day')[0]).toHaveValue('Monday');
  expect(screen.getAllByLabelText('From')[0]).toHaveValue('10:00');
  expect(
    screen.queryByText(
      'These are the default hours. Publish to make them yours.',
    ),
  ).not.toBeInTheDocument();
  expect(toastContainer().children).toHaveLength(0);
});

test('clear-all confirms the consequence and returns the is_default notice', async () => {
  const advisor = await createUser({ role: 'advisor' });
  publishOverride();

  await renderApp(<AdvisorHoursRoute />, {
    user: advisor,
    path: '/advisor/hours',
    url: '/advisor/hours',
  });

  await screen.findByText(
    'These are the default hours. Publish to make them yours.',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Publish hours' }));
  expect(
    await screen.findByRole('button', { name: 'Clear hours' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(
      'These are the default hours. Publish to make them yours.',
    ),
  ).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Clear hours' }));

  const confirm = await screen.findByRole('dialog', {
    name: 'Clear your published hours?',
  });
  expect(confirm).toHaveTextContent(
    'This removes your published hours. Students will no longer see your office hours.',
  );
  expect(
    within(confirm).getByRole('button', { name: 'Cancel' }),
  ).toBeInTheDocument();

  await userEvent.click(
    within(confirm).getByRole('button', { name: 'Clear hours' }),
  );

  expect(
    await screen.findByText(
      'These are the default hours. Publish to make them yours.',
    ),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getAllByLabelText('Day')[0]).toHaveValue('Sunday'),
  );
  expect(
    screen.queryByRole('dialog', { name: 'Clear your published hours?' }),
  ).not.toBeInTheDocument();
});

test('an availability error renders the shared error state with retry', async () => {
  const advisor = await createUser({ role: 'advisor' });

  server.use(
    http.get(`${env.API_URL}/advisor/availability`, () =>
      HttpResponse.json(
        { message: 'The server encountered an error.' },
        { status: 500 },
      ),
    ),
  );

  await renderApp(<AdvisorHoursRoute />, {
    user: advisor,
    path: '/advisor/hours',
    url: '/advisor/hours',
  });

  expect(
    await screen.findByText('Could not load this content.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
});
