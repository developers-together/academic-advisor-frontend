import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { Plan } from '@/types/domain';

export const approveReviewPlan = (planId: number): Promise<Plan> =>
  unwrap<Plan>(api.post(`/advisor/plans/${planId}/approve`));

export const useApproveReviewPlan = (planId: number | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => approveReviewPlan(planId as number),
    onSuccess: (plan) => {
      queryClient.setQueryData(['advisor', 'plan', planId], plan);
      void queryClient.invalidateQueries({ queryKey: ['advisor', 'queue'] });
      void queryClient.invalidateQueries({ queryKey: ['advisor', 'caseload'] });
    },
  });
};
