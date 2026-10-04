import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { AssignmentRecord } from '@/types/domain';

export const adminPendingAssignmentsQueryKey = [
  'admin',
  'assignments',
  'pending',
] as const;

export const getPendingAssignments = (): Promise<AssignmentRecord[]> =>
  unwrapList<AssignmentRecord>(api.get('/admin/assignments/pending'));

export const getPendingAssignmentsQueryOptions = () =>
  queryOptions({
    queryKey: adminPendingAssignmentsQueryKey,
    queryFn: getPendingAssignments,
    staleTime: 5 * 60 * 1000,
  });

export const usePendingAssignments = () =>
  useQuery(getPendingAssignmentsQueryOptions());
