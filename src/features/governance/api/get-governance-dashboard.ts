import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { GovernanceNode } from '@/types/domain';

export const governanceDashboardQueryKey = ['governance', 'dashboard'] as const;

export const getGovernanceDashboard = (): Promise<GovernanceNode> =>
  unwrap<GovernanceNode>(api.get('/governance/dashboard'));

export const getGovernanceDashboardQueryOptions = () =>
  queryOptions({
    queryKey: governanceDashboardQueryKey,
    queryFn: getGovernanceDashboard,
    staleTime: 5 * 60 * 1000,
  });

export const useGovernanceDashboard = (enabled = true) =>
  useQuery({ ...getGovernanceDashboardQueryOptions(), enabled });
