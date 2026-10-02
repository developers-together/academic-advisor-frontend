import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { Plan } from '@/types/domain';

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
