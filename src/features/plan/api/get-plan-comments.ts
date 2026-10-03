import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { PlanComment } from '@/types/domain';

export const getPlanComments = (): Promise<PlanComment[]> =>
  unwrapList<PlanComment>(api.get('/plan/comments'));

export const getPlanCommentsQueryOptions = () =>
  queryOptions({
    queryKey: ['plan', 'comments'],
    queryFn: getPlanComments,
    staleTime: 0,
  });

export const usePlanComments = (planId: number | null) =>
  useQuery({
    ...getPlanCommentsQueryOptions(),
    enabled: planId !== null,
  });
