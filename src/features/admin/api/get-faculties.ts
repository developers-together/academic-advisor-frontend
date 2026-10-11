import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';

export type FacultyOption = {
  code: string | null;
  name: string;
};

export const facultiesQueryKey = ['admin', 'faculties'] as const;

export const getFaculties = (): Promise<FacultyOption[]> =>
  unwrapList<FacultyOption>(api.get('/admin/faculties'));

export const getFacultiesQueryOptions = () =>
  queryOptions({
    queryKey: facultiesQueryKey,
    queryFn: getFaculties,
    staleTime: 5 * 60 * 1000,
  });

export const useFaculties = () => useQuery(getFacultiesQueryOptions());
