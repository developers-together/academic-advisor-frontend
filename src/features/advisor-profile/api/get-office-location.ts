import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { OfficeLocation } from '@/types/domain';

export const getOfficeLocation = (): Promise<OfficeLocation> =>
  unwrap<OfficeLocation>(api.get('/advisor/office-location'));

export const getOfficeLocationQueryOptions = () =>
  queryOptions({
    queryKey: ['advisor', 'office-location'],
    queryFn: getOfficeLocation,
    staleTime: 5 * 60 * 1000,
  });

export const useOfficeLocation = () =>
  useQuery(getOfficeLocationQueryOptions());
