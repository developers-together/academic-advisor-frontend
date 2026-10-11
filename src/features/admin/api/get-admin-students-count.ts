import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';

export const getAdminStudentsCount = (): Promise<number> =>
  unwrap<{ total: number }>(api.get('/admin/students/count')).then(
    (body) => body.total,
  );

export const getAdminStudentsCountQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'students', 'count'] as const,
    queryFn: () => getAdminStudentsCount(),
    staleTime: 5 * 60 * 1000,
  });

export const useAdminStudentsCount = () =>
  useQuery(getAdminStudentsCountQueryOptions());
