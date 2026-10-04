import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { AdminCourse } from '@/types/domain';

export const getAdminCourses = (): Promise<AdminCourse[]> =>
  unwrapList<AdminCourse>(api.get('/admin/courses'));

export const getAdminCoursesQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'courses'],
    queryFn: getAdminCourses,
    staleTime: 60 * 1000,
  });

export const useAdminCourses = () => useQuery(getAdminCoursesQueryOptions());
