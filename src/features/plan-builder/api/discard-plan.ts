import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { Plan } from '@/types/domain';

export const discardPlan = (): Promise<Plan> =>
  unwrap<Plan>(api.post('/plan/discard'));

export const useDiscardPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: discardPlan,
    onSuccess: (plan) => {
      queryClient.setQueryData(['plan'], plan);
    },
  });
};
