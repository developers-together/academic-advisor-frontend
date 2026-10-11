import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { AdvisorCaseloadStudent } from '@/types/domain';

export const getCaseload = (
  search?: string,
): Promise<AdvisorCaseloadStudent[]> =>
  unwrapList<AdvisorCaseloadStudent>(
    api.get('/advisor/caseload', {
      params: { per_page: 'all', ...(search ? { search } : {}) },
    }),
  );

export const getCaseloadQueryOptions = (search = '') =>
  queryOptions({
    queryKey: search
      ? ['advisor', 'caseload', search]
      : ['advisor', 'caseload'],
    queryFn: () => getCaseload(search || undefined),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

export const useCaseload = (search = '') =>
  useQuery(getCaseloadQueryOptions(search));
