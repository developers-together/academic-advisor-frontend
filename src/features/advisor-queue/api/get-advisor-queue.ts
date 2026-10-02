import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { AdvisorQueueItem } from '@/types/domain';

export const getAdvisorQueue = (): Promise<AdvisorQueueItem[]> =>
  unwrapList<AdvisorQueueItem>(api.get('/advisor/queue'));

export const getAdvisorQueueQueryOptions = () =>
  queryOptions({
    queryKey: ['advisor', 'queue'],
    queryFn: getAdvisorQueue,
    staleTime: 0,
  });

export const useAdvisorQueue = () => useQuery(getAdvisorQueueQueryOptions());
