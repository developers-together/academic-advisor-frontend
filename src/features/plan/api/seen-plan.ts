import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { Plan } from '@/types/domain';

export const seenPlan = (): Promise<Plan> =>
  unwrap<Plan>(api.post('/plan/seen'));

export const useSeenPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: seenPlan,
    onSuccess: (plan) => {
      queryClient.setQueryData(['plan'], plan);
    },
  });
};
