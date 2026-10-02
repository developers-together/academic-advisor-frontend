import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { AdvisorCaseloadStudent } from '@/types/domain';

export const getCaseload = (): Promise<AdvisorCaseloadStudent[]> =>
  unwrapList<AdvisorCaseloadStudent>(api.get('/advisor/students'));

export const getCaseloadQueryOptions = () =>
  queryOptions({
    queryKey: ['advisor', 'caseload'],
    queryFn: getCaseload,
    staleTime: 60 * 1000,
  });

export const useCaseload = () => useQuery(getCaseloadQueryOptions());
