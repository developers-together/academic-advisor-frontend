import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import { AsyncSurface } from '@/components/ui/async-surface';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { db } from '@/testing/mocks/db';
import { createUser, loginAsUser } from '@/testing/test-utils';

const queryClient = new QueryClient();

const renderSurface = (ui: React.ReactElement) =>
  rtlRender(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
  });

const pendingQuery = {
  isPending: true,
  isError: false,
  error: null,
  refetch: () => {},
};

const okQuery = {
  isPending: false,
  isError: false,
  error: null,
  refetch: () => {},
};

test('pending renders the skeleton inside an aria-busy region', async () => {
  await loginAsUser(await createUser());
  renderSurface(
    <AsyncSurface
      query={pendingQuery}
      skeleton={<Skeleton className="size-8" />}
    >
      <p>Loaded content</p>
    </AsyncSurface>,
  );

  expect(await screen.findByRole('status')).toBeInTheDocument();
  expect(screen.queryByText('Loaded content')).not.toBeInTheDocument();
});

test('a 403 error renders the permission panel instead of the error banner', async () => {
  renderSurface(
    <AsyncSurface
      query={{
        ...okQuery,
        isError: true,
        error: new ApiError({ status: 403, requestId: 'r1' }),
      }}
    >
      <p>Loaded content</p>
    </AsyncSurface>,
  );

  expect(
    await screen.findByText('This area is for Students.'),
  ).toBeInTheDocument();
  expect(screen.queryByText('Loaded content')).not.toBeInTheDocument();
});

test('a server error offers retry and keeps the request id visible', async () => {
  await loginAsUser(await createUser());
  const refetch = vi.fn();
  renderSurface(
    <AsyncSurface
      query={{
        ...okQuery,
        isError: true,
        error: new ApiError({ status: 500, requestId: 'req-9' }),
        refetch,
      }}
    >
      <p>Loaded content</p>
    </AsyncSurface>,
  );

  expect(await screen.findByText(/req-9/)).toBeInTheDocument();
  await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  expect(refetch).toHaveBeenCalled();
});

test('settled queries render their children', async () => {
  await loginAsUser(await createUser());
  renderSurface(
    <AsyncSurface query={okQuery}>
      <p>Loaded content</p>
    </AsyncSurface>,
  );

  expect(await screen.findByText('Loaded content')).toBeInTheDocument();
});

beforeEach(() => {
  db.user.deleteMany({ where: {} });
});
