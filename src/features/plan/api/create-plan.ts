import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { Plan } from '@/types/domain';

export const createPlan = (): Promise<Plan> => unwrap<Plan>(api.post('/plan'));

export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlan,
    onSuccess: (plan) => {
      queryClient.setQueryData(['plan'], plan);
    },
  });
};
