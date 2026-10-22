import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { DepartmentOption } from '@/types/domain';

export const getDepartments = (): Promise<DepartmentOption[]> =>
  unwrapList<DepartmentOption>(api.get('/admin/departments'));

export const useDepartments = () =>
  useQuery(
    queryOptions({
      queryKey: ['admin', 'departments'],
      queryFn: getDepartments,
      staleTime: 60_000,
    }),
  );
