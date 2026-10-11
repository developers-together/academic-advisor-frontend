import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';

import { createUser, loginAsUser } from '@/testing/test-utils';

import { useImportAcademicsDataset } from '../academics';

const adminCoursesKey = ['admin', 'courses'] as const;

const renderImportMutation = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(adminCoursesKey, [
    {
      id: 1,
      code: 'CS 201',
      title_en: 'Programming',
      title_ar: null,
      credits: 3,
      level: 2,
    },
  ]);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    client,
    ...renderHook(() => useImportAcademicsDataset(), { wrapper }),
  };
};

const importFile = new File(['course_code,mean_grade'], 'ok.csv', {
  type: 'text/csv',
});

test('importing a dataset marks the admin queries that dataset feeds stale', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  await loginAsUser(admin);

  const { result, client } = renderImportMutation();
  result.current.mutate({
    dataset: 'active-courses',
    file: importFile,
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  await waitFor(() =>
    expect(client.getQueryState(adminCoursesKey)?.isInvalidated).toBe(true),
  );
});

test('importing a dataset with no admin consumer leaves the cache alone', async () => {
  const admin = await createUser({ role: 'admin', name: 'Mona Admin' });
  await loginAsUser(admin);

  const { result, client } = renderImportMutation();
  result.current.mutate({
    dataset: 'statistics',
    file: importFile,
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(client.getQueryState(adminCoursesKey)?.isInvalidated).toBe(false);
});
