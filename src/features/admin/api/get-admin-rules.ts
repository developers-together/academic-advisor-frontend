import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { UniversityRule } from '@/types/domain';

export const adminRulesQueryKey = ['admin', 'rules'] as const;

export const getAdminRules = (): Promise<UniversityRule[]> =>
  unwrapList<UniversityRule>(api.get('/admin/rules'));

export const getAdminRulesQueryOptions = () =>
  queryOptions({
    queryKey: adminRulesQueryKey,
    queryFn: getAdminRules,
    staleTime: 5 * 60 * 1000,
  });

export const useAdminRules = () => useQuery(getAdminRulesQueryOptions());
