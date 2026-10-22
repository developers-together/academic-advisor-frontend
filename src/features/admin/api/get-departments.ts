import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';

export type DepartmentOption = {
  id: number;
  code: string | null;
  name_en: string;
  name_ar: string | null;
  faculty_name_en: string;
  faculty_name_ar: string | null;
};

export const departmentsQueryKey = ['admin', 'departments'] as const;

export const getDepartments = (): Promise<DepartmentOption[]> =>
  unwrapList<DepartmentOption>(api.get('/admin/departments'));

export const getDepartmentsQueryOptions = () =>
  queryOptions({
    queryKey: departmentsQueryKey,
    queryFn: getDepartments,
    staleTime: 5 * 60 * 1000,
  });

export const useDepartments = () => useQuery(getDepartmentsQueryOptions());
