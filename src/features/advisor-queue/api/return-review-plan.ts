import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { Plan } from '@/types/domain';

export type ReturnReviewPlanInput = {
  planId: number;
  reason: string;
};

export const returnReviewPlan = ({
  planId,
  reason,
}: ReturnReviewPlanInput): Promise<Plan> =>
  unwrap<Plan>(
    api.post(`/advisor/plans/${planId}/return`, { reason: reason.trim() }),
  );

export const useReturnReviewPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: returnReviewPlan,
    onSuccess: (plan, { planId }) => {
      queryClient.setQueryData(['advisor', 'plan', planId], plan);
      void queryClient.invalidateQueries({ queryKey: ['advisor', 'queue'] });
      void queryClient.invalidateQueries({ queryKey: ['advisor', 'caseload'] });
    },
  });
};
