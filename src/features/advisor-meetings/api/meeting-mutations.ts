import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingKeys } from '@/lib/api/meeting-keys';
import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { MeetingRequest } from '@/types/domain';

const useMeetingMutation = <TInput>(
  action: (id: number, input: TInput) => Promise<MeetingRequest>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TInput }) =>
      action(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.advisorRequests,
      });
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.myRequests,
      });
    },
  });
};

export type ConfirmSlot =
  { slotId: number } | { startsAt: string; endsAt: string };

export const confirmMeetingRequest = (
  id: number,
  slot: ConfirmSlot,
): Promise<MeetingRequest> =>
  unwrap<MeetingRequest>(
    api.post(`/advisor/meeting-requests/${id}/confirm`, {
      slot_id: 'slotId' in slot ? slot.slotId : undefined,
      starts_at: 'startsAt' in slot ? slot.startsAt : undefined,
      ends_at: 'startsAt' in slot ? slot.endsAt : undefined,
    }),
  );

export const useConfirmMeetingRequest = () =>
  useMeetingMutation(confirmMeetingRequest);

export const proposeMeetingTimes = (
  id: number,
  slots: { starts_at: string; ends_at: string }[],
): Promise<MeetingRequest> =>
  unwrap<MeetingRequest>(
    api.post(`/advisor/meeting-requests/${id}/propose`, { slots }),
  );

export const useProposeMeetingTimes = () =>
  useMeetingMutation(proposeMeetingTimes);

export const declineMeetingRequest = (
  id: number,
  reason: string | null,
): Promise<MeetingRequest> =>
  unwrap<MeetingRequest>(
    api.post(`/advisor/meeting-requests/${id}/decline`, { reason }),
  );

export const useDeclineMeetingRequest = () =>
  useMeetingMutation(declineMeetingRequest);

export const cancelMeetingRequest = (
  id: number,
  reason: string | null,
): Promise<MeetingRequest> =>
  unwrap<MeetingRequest>(
    api.post(`/advisor/meeting-requests/${id}/cancel`, { reason }),
  );

export const useCancelMeetingRequest = () =>
  useMeetingMutation(cancelMeetingRequest);

export const completeMeetingRequest = (id: number): Promise<MeetingRequest> =>
  unwrap<MeetingRequest>(api.post(`/advisor/meeting-requests/${id}/done`));

export const useCompleteMeetingRequest = () =>
  useMeetingMutation(completeMeetingRequest);
