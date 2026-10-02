import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import { toCairoInstant } from '@/lib/i18n/cairo';
import type { VisitRequest } from '@/types/domain';

export type VisitSlotInput = { date: string; start: string; end: string };

export const slotInputsToInstants = (slots: VisitSlotInput[]) =>
  slots.map(({ date, start, end }) => ({
    starts_at: toCairoInstant(date, start),
    ends_at: toCairoInstant(date, end),
  }));

export type CreateVisitRequestInput = {
  studentId: number;
  slots: VisitSlotInput[];
};

export const createVisitRequest = ({
  studentId,
  slots,
}: CreateVisitRequestInput): Promise<VisitRequest> =>
  unwrap<VisitRequest>(
    api.post('/advisor/visit-requests', {
      student_id: studentId,
      slots: slotInputsToInstants(slots),
    }),
  );

export const useCreateVisitRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVisitRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['advisor', 'visit-requests'],
      });
    },
  });
};
