import {
  useMutation,
  useQuery,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap, unwrapList } from '@/lib/api-envelope';
import type { Plan, PlanComment } from '@/types/domain';

export const getReviewPlan = (planId: number): Promise<Plan> =>
  unwrap<Plan>(api.get(`/advisor/plans/${planId}`));

export const getReviewPlanQueryOptions = (planId: number) =>
  queryOptions({
    queryKey: ['advisor', 'plan', planId],
    queryFn: () => getReviewPlan(planId),
    staleTime: 0,
  });

export const useReviewPlan = (planId: number | null) =>
  useQuery({
    ...getReviewPlanQueryOptions(planId ?? 0),
    enabled: planId !== null,
  });

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
