import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { QueueAgingThreshold } from '@/types/domain';

export const adminSettingsQueryKey = ['admin', 'settings'] as const;

export const getQueueAgingThreshold = (): Promise<QueueAgingThreshold> =>
  unwrap<QueueAgingThreshold>(api.get('/admin/settings/queue-aging-threshold'));

export const getQueueAgingThresholdQueryOptions = () =>
  queryOptions({
    queryKey: adminSettingsQueryKey,
    queryFn: getQueueAgingThreshold,
    staleTime: 5 * 60 * 1000,
  });

export const useQueueAgingThreshold = () =>
  useQuery(getQueueAgingThresholdQueryOptions());
