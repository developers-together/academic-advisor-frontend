import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { VisitRequest } from '@/types/domain';

export const getVisitRequests = (): Promise<VisitRequest[]> =>
  unwrapList<VisitRequest>(api.get('/advisor/visit-requests'));

export const getVisitRequestsQueryOptions = () =>
  queryOptions({
    queryKey: ['advisor', 'visit-requests'],
    queryFn: getVisitRequests,
    staleTime: 30 * 1000,
  });

export const useVisitRequests = () => useQuery(getVisitRequestsQueryOptions());
