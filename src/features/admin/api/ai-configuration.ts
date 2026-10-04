import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { AiConfiguration } from '@/types/domain';

export const getAiConfiguration = (): Promise<AiConfiguration> =>
  unwrap<AiConfiguration>(api.get('/admin/ai-configuration'));

export const getAiConfigurationQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'ai-configuration'],
    queryFn: getAiConfiguration,
    staleTime: 60 * 1000,
  });

export const useAiConfiguration = () =>
  useQuery(getAiConfigurationQueryOptions());

export const useUpdateAiConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      quota_per_student?: number;
      assistant_enabled?: boolean;
    }): Promise<AiConfiguration> =>
      unwrap<AiConfiguration>(api.put('/admin/ai-configuration', input)),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'ai-configuration'],
      }),
  });
};
