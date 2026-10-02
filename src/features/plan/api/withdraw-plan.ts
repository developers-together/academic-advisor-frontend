import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { Plan } from '@/types/domain';

export const withdrawPlan = (): Promise<Plan> =>
  unwrap<Plan>(api.post('/plan/withdraw'));

export const useWithdrawPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withdrawPlan,
    onSuccess: (plan) => {
      queryClient.setQueryData(['plan'], plan);
    },
  });
};
