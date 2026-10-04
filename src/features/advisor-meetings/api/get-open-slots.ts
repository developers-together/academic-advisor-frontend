import { queryOptions, useQuery } from '@tanstack/react-query';

import { meetingKeys } from '@/lib/api/meeting-keys';
import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { MeetingOpenSlot } from '@/types/domain';

export const getOpenSlots = (): Promise<MeetingOpenSlot[]> =>
  unwrapList<MeetingOpenSlot>(api.get('/advisor/availability/open-slots'));

export const getOpenSlotsQueryOptions = (enabled: boolean) =>
  queryOptions({
    queryKey: meetingKeys.openSlots,
    queryFn: getOpenSlots,
    staleTime: 60 * 1000,
    enabled,
  });

export const useOpenSlots = (enabled = true) =>
  useQuery(getOpenSlotsQueryOptions(enabled));
