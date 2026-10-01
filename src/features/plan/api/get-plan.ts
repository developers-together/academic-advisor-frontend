import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { Plan } from '@/types/domain';

export const getPlan = (): Promise<Plan> => unwrap<Plan>(api.get('/plan'));

export const getPlanQueryOptions = () =>
  queryOptions({
    queryKey: ['plan'],
    queryFn: getPlan,
    staleTime: 0,
  });

export const usePlan = () => useQuery(getPlanQueryOptions());
