import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { GovernanceGroupBy, GovernanceNode } from '@/types/domain';

export const governanceDashboardQueryKey = ['governance', 'dashboard'] as const;

export const getGovernanceDashboard = (
  groupBy?: GovernanceGroupBy,
): Promise<GovernanceNode> =>
  unwrap<GovernanceNode>(
    api.get('/governance/dashboard', {
      params: groupBy ? { group_by: groupBy } : undefined,
    }),
  );

export const getGovernanceDashboardQueryOptions = (
  groupBy?: GovernanceGroupBy,
) =>
  queryOptions({
    queryKey: groupBy
      ? [...governanceDashboardQueryKey, groupBy]
      : governanceDashboardQueryKey,
    queryFn: () => getGovernanceDashboard(groupBy),
    staleTime: 5 * 60 * 1000,
  });

export const useGovernanceDashboard = (
  enabled = true,
  groupBy?: GovernanceGroupBy,
) => useQuery({ ...getGovernanceDashboardQueryOptions(groupBy), enabled });
