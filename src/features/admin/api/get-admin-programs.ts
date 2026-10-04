import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { AdminProgram } from '@/types/domain';

export const getAdminPrograms = (): Promise<AdminProgram[]> =>
  unwrapList<AdminProgram>(api.get('/admin/programs'));

export const getAdminProgramsQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'programs'],
    queryFn: getAdminPrograms,
    staleTime: 60 * 1000,
  });

export const useAdminPrograms = () => useQuery(getAdminProgramsQueryOptions());
