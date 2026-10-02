import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap, unwrapList } from '@/lib/api-envelope';
import type { PlanComment } from '@/types/domain';

export const getPlanComments = (planId: number): Promise<PlanComment[]> =>
  unwrapList<PlanComment>(api.get(`/advisor/plans/${planId}/comments`));

export const getPlanCommentsQueryOptions = (planId: number) =>
  queryOptions({
    queryKey: ['advisor', 'plan-comments', planId],
    queryFn: () => getPlanComments(planId),
    staleTime: 0,
  });

export const usePlanComments = (planId: number | null) =>
  useQuery({
    ...getPlanCommentsQueryOptions(planId ?? 0),
    enabled: planId !== null,
  });

export const addPlanComment = (
  planId: number,
  body: string,
): Promise<PlanComment> =>
  unwrap<PlanComment>(api.post(`/advisor/plans/${planId}/comments`, { body }));

export const useAddPlanComment = (planId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => addPlanComment(planId, body),
    onSuccess: (comment) => {
      queryClient.setQueryData<PlanComment[]>(
        ['advisor', 'plan-comments', planId],
        (existing) => [...(existing ?? []), comment],
      );
    },
  });
};
