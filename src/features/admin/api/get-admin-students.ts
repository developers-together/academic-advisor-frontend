import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapPage, type Page } from '@/lib/api-envelope';
import type { User } from '@/types/domain';

export type AdminStudentsParams = {
  search: string;
  perPage: number;
  page: number;
};

export const adminStudentsQueryKey = ({
  search,
  perPage,
  page,
}: AdminStudentsParams) =>
  ['admin', 'students', { search, per_page: perPage, page }] as const;

export const getAdminStudents = (
  params: AdminStudentsParams,
): Promise<Page<User>> =>
  unwrapPage<User>(
    api.get('/admin/students', {
      params: {
        search: params.search,
        per_page: params.perPage,
        page: params.page,
      },
    }),
  );

export const getAdminStudentsQueryOptions = (params: AdminStudentsParams) =>
  queryOptions({
    queryKey: adminStudentsQueryKey(params),
    queryFn: () => getAdminStudents(params),
    staleTime: 5 * 60 * 1000,
  });

export const useAdminStudents = (params: AdminStudentsParams) =>
  useQuery(getAdminStudentsQueryOptions(params));
