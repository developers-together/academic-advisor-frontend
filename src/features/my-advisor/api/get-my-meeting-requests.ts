import { queryOptions, useQuery } from '@tanstack/react-query';

import { meetingKeys } from '@/lib/api/meeting-keys';
import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { MeetingRequest } from '@/types/domain';

export const getMyMeetingRequests = (): Promise<MeetingRequest[]> =>
  unwrapList<MeetingRequest>(api.get('/my/meeting-requests'));

export const getMyMeetingRequestsQueryOptions = (enabled: boolean) =>
  queryOptions({
    queryKey: meetingKeys.myRequests,
    queryFn: getMyMeetingRequests,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    enabled,
  });

export const useMyMeetingRequests = (enabled = true) =>
  useQuery(getMyMeetingRequestsQueryOptions(enabled));
