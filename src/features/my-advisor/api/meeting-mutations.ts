import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingKeys } from '@/lib/api/meeting-keys';
import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { MeetingReason, MeetingRequest } from '@/types/domain';

const useMyMeetingMutation = <TInput>(
  action: (id: number, input: TInput) => Promise<MeetingRequest>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TInput }) =>
      action(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.myRequests,
      });
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.advisorRequests,
      });
    },
  });
};

export const createMyMeetingRequest = (input: {
  reason: MeetingReason;
  note: string | null;
  preferred_slots: { starts_at: string; ends_at: string }[];
}): Promise<MeetingRequest> =>
  unwrap<MeetingRequest>(api.post('/my/meeting-requests', input));

export const useCreateMyMeetingRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMyMeetingRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.myRequests,
      });
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.advisorRequests,
      });
    },
  });
};

export const acceptMeetingProposal = (
  id: number,
  slotId: number,
): Promise<MeetingRequest> =>
  unwrap<MeetingRequest>(
    api.post(`/my/meeting-requests/${id}/accept`, { slot_id: slotId }),
  );

export const useAcceptMeetingProposal = () =>
  useMyMeetingMutation(acceptMeetingProposal);

export const declineMeetingProposal = (
  id: number,
  reason: string | null,
): Promise<MeetingRequest> =>
  unwrap<MeetingRequest>(
    api.post(`/my/meeting-requests/${id}/decline`, { reason }),
  );

export const useDeclineMeetingProposal = () =>
  useMyMeetingMutation(declineMeetingProposal);

export const cancelMyMeetingRequest = (
  id: number,
  reason: string | null,
): Promise<MeetingRequest> =>
  unwrap<MeetingRequest>(
    api.post(`/my/meeting-requests/${id}/cancel`, { reason }),
  );

export const useCancelMyMeetingRequest = () =>
  useMyMeetingMutation(cancelMyMeetingRequest);
