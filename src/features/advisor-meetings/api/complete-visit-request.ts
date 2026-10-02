import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { VisitRequest } from '@/types/domain';

export const completeVisitRequest = (
  requestId: number,
): Promise<VisitRequest> =>
  unwrap<VisitRequest>(api.post(`/advisor/visit-requests/${requestId}/done`));

export const useCompleteVisitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeVisitRequest,
    onSuccess: (request) => {
      queryClient.setQueryData<VisitRequest[]>(
        ['advisor', 'visit-requests'],
        (existing) =>
          (existing ?? []).map((row) =>
            row.id === request.id ? request : row,
          ),
      );
    },
  });
};
