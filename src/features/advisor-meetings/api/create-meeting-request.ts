import { useMutation, useQueryClient } from '@tanstack/react-query';

import { meetingKeys } from '@/lib/api/meeting-keys';
import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { MeetingReason, MeetingRequest } from '@/types/domain';

import { slotInputsToInstants, type SlotInput } from './slot-inputs';

export type CreateMeetingRequestInput = {
  studentId: number;
  reason: MeetingReason;
  note?: string;
  slotRows?: SlotInput[];
  slotInstants?: { starts_at: string; ends_at: string }[];
};

export const createMeetingRequest = ({
  studentId,
  reason,
  note,
  slotRows = [],
  slotInstants = [],
}: CreateMeetingRequestInput): Promise<MeetingRequest> =>
  unwrap<MeetingRequest>(
    api.post('/advisor/meeting-requests', {
      student_id: studentId,
      reason,
      note: note ?? null,
      slots: [...slotInputsToInstants(slotRows), ...slotInstants],
    }),
  );

export const useCreateMeetingRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMeetingRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.advisorRequests,
      });
    },
  });
};
