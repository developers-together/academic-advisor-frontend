import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { AvailabilityWindow } from '@/types/domain';

export const getAvailability = (): Promise<AvailabilityWindow> =>
  unwrap<AvailabilityWindow>(api.get('/advisor/availability'));

export const getAvailabilityQueryOptions = () =>
  queryOptions({
    queryKey: ['advisor', 'availability'],
    queryFn: getAvailability,
    staleTime: 60 * 1000,
  });

export const useAvailability = () => useQuery(getAvailabilityQueryOptions());
