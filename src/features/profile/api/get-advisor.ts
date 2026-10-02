import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { AdvisorProfile } from '@/types/domain';

export const getMyAdvisor = (): Promise<AdvisorProfile> =>
  unwrap<AdvisorProfile>(api.get('/my/advisor'));

export const getMyAdvisorQueryOptions = () =>
  queryOptions({
    queryKey: ['my-advisor'],
    queryFn: getMyAdvisor,
    staleTime: 5 * 60 * 1000,
  });

export const useMyAdvisor = () => useQuery(getMyAdvisorQueryOptions());
