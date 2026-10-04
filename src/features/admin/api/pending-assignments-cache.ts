import type { QueryClient } from '@tanstack/react-query';

import type { AssignmentRecord } from '@/types/domain';

import { adminPendingAssignmentsQueryKey } from './get-pending-assignments';

export const prependPendingAssignmentToCache = (
  queryClient: QueryClient,
  assignment: AssignmentRecord,
) => {
  queryClient.setQueriesData<AssignmentRecord[]>(
    { queryKey: adminPendingAssignmentsQueryKey },
    (rows) => (rows ? [assignment, ...rows] : rows),
  );
};

export const removePendingAssignmentFromCache = (
  queryClient: QueryClient,
  assignmentId: number,
) => {
  queryClient.setQueriesData<AssignmentRecord[]>(
    { queryKey: adminPendingAssignmentsQueryKey },
    (rows) => (rows ? rows.filter((row) => row.id !== assignmentId) : rows),
  );
};

export const invalidatePendingAssignments = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({
    queryKey: adminPendingAssignmentsQueryKey,
  });
};
