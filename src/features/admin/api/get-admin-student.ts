import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { User } from '@/types/domain';

export const adminStudentQueryKey = (studentId: number) =>
  ['admin', 'students', 'detail', studentId] as const;

export const getAdminStudent = (studentId: number): Promise<User> =>
  unwrap<User>(api.get(`/admin/students/${studentId}`));

export const getAdminStudentQueryOptions = (studentId: number) =>
  queryOptions({
    queryKey: adminStudentQueryKey(studentId),
    queryFn: () => getAdminStudent(studentId),
    staleTime: 5 * 60 * 1000,
  });

export const useAdminStudent = (studentId: number) =>
  useQuery(getAdminStudentQueryOptions(studentId));
