import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { removePendingAssignmentFromCache } from './pending-assignments-cache';

export const cancelPendingAssignment = (assignmentId: number): Promise<void> =>
  api.delete(`/admin/assignments/pending/${assignmentId}`);

export const useCancelPendingAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelPendingAssignment,
    onSuccess: (_result, assignmentId) => {
      removePendingAssignmentFromCache(queryClient, assignmentId);
    },
  });
};
