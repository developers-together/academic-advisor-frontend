import { queryOptions, useQuery } from '@tanstack/react-query';

import { meetingKeys } from '@/lib/api/meeting-keys';
import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { MeetingRequest } from '@/types/domain';

export const getMeetingRequests = (): Promise<MeetingRequest[]> =>
  unwrapList<MeetingRequest>(api.get('/advisor/meeting-requests'));

export const getMeetingRequestsQueryOptions = () =>
  queryOptions({
    queryKey: meetingKeys.advisorRequests,
    queryFn: getMeetingRequests,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

export const useMeetingRequests = () =>
  useQuery(getMeetingRequestsQueryOptions());
