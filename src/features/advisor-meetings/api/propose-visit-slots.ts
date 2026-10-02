import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { VisitRequest } from '@/types/domain';

import {
  slotInputsToInstants,
  type VisitSlotInput,
} from './create-visit-request';

export type ProposeVisitSlotsInput = {
  requestId: number;
  slots: VisitSlotInput[];
};

export const proposeVisitSlots = ({
  requestId,
  slots,
}: ProposeVisitSlotsInput): Promise<VisitRequest> =>
  unwrap<VisitRequest>(
    api.post(`/advisor/visit-requests/${requestId}/slots`, {
      slots: slotInputsToInstants(slots),
    }),
  );

export const useProposeVisitSlots = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: proposeVisitSlots,
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
