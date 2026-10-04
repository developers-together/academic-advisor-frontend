import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { UniversityRuleSummary } from '@/types/domain';

export const rulesQueryKey = ['rules'] as const;

export const getRules = (): Promise<UniversityRuleSummary[]> =>
  unwrapList<UniversityRuleSummary>(api.get('/rules'));

export const getRulesQueryOptions = () =>
  queryOptions({
    queryKey: rulesQueryKey,
    queryFn: getRules,
    staleTime: 5 * 60 * 1000,
  });

export const useRules = () => useQuery(getRulesQueryOptions());
