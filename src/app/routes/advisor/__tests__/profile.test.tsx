import { render as rtlRender } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { AppProvider } from '@/app/provider';
import { AppRouter } from '@/app/router';
import AdvisorProfileRoute from '@/app/routes/advisor/profile';
import { env } from '@/config/env';
import { db } from '@/testing/mocks/db';
import { server } from '@/testing/mocks/server';
import {
  createUser,
  loginAsUser,
  renderApp,
  screen,
  userEvent,
  waitFor,
} from '@/testing/test-utils';

const saveOverride = () => {
  let sentBody: { office_location?: unknown } = {};
  let calls = 0;
  server.use(
    http.put(`${env.API_URL}/advisor/office-location`, async ({ request }) => {
      calls += 1;
      sentBody = (await request.json()) as { office_location?: unknown };
      return HttpResponse.json({
        data: { office_location: sentBody.office_location ?? null },
      });
    }),
  );
  return {
    body: () => sentBody,
    calls: () => calls,
  };
};

test('the form starts from the saved office location', async () => {
  const advisor = await createUser({ role: 'advisor' });
  db.advisorProfile.create({
    advisorId: advisor.id as number,
    rows: JSON.stringify([]),
    office_location: 'Building 1, Room 110',
  });

  await renderApp(<AdvisorProfileRoute />, {
    user: advisor,
    path: '/advisor/profile',
    url: '/advisor/profile',
  });

  expect(await screen.findByLabelText('Office location')).toHaveValue(
    'Building 1, Room 110',
  );
});

test('the advisor saves an office location and sees success feedback', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const recorder = saveOverride();

  await renderApp(<AdvisorProfileRoute />, {
    user: advisor,
    path: '/advisor/profile',
    url: '/advisor/profile',
  });

  const input = await screen.findByLabelText('Office location');
  await userEvent.type(input, 'Building 3, Room 2140');
  await userEvent.click(screen.getByRole('button', { name: 'Save location' }));

  await waitFor(() => expect(recorder.calls()).toBe(1));
  expect(recorder.body()).toEqual({
    office_location: 'Building 3, Room 2140',
  });
  expect(await screen.findByText('Office location saved.')).toBeInTheDocument();
});

test('an over-length location shows the inline error and sends nothing', async () => {
  const advisor = await createUser({ role: 'advisor' });
  const recorder = saveOverride();

  await renderApp(<AdvisorProfileRoute />, {
    user: advisor,
    path: '/advisor/profile',
    url: '/advisor/profile',
  });

  const input = await screen.findByLabelText('Office location');
  await userEvent.type(input, 'x'.repeat(256));
  await userEvent.click(screen.getByRole('button', { name: 'Save location' }));

  expect(
    await screen.findByText(
      'The office location is limited to 255 characters.',
    ),
  ).toBeInTheDocument();
  expect(recorder.calls()).toBe(0);
});

test('the advisor rail links to the profile page and the route renders it', async () => {
  const advisor = await createUser({ role: 'advisor' });
  await loginAsUser(advisor);
  window.history.pushState({}, '', '/advisor/profile');

  rtlRender(<AppRouter />, {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });

  expect(
    await screen.findByRole('heading', { name: 'Profile' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
    'href',
    '/advisor/profile',
  );
});
