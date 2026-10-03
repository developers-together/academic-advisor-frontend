import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import {
  planConversationsRootKey,
  planConversationKey,
} from '@/features/ai-chat/api/conversations';
import { ApiError } from '@/lib/api-error';
import type { PlanConversation } from '@/types/domain';

import { streamSubmitArm } from './turn-stream';

export const useArmSubmission = (conversationId: number) => {
  const queryClient = useQueryClient();
  const controllerRef = useRef<AbortController | null>(null);

  const applyArmed = (confirmedAt: string | null) => {
    queryClient.setQueryData<PlanConversation>(
      planConversationKey(conversationId),
      (conversation) =>
        conversation
          ? { ...conversation, submission_confirmed_at: confirmedAt }
          : conversation,
    );
    void queryClient.invalidateQueries({
      queryKey: planConversationsRootKey,
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const controller = new AbortController();
      controllerRef.current = controller;
      let armed: string | null = null;
      for await (const frame of streamSubmitArm(
        conversationId,
        controller.signal,
      )) {
        armed = frame.submission_confirmed_at;
      }
      if (armed === null) {
        throw new ApiError({ status: 0 });
      }
      return armed;
    },
    retry: 0,
    onSuccess: (confirmedAt) => applyArmed(confirmedAt),
  });

  return { ...mutation, cancel: () => controllerRef.current?.abort() };
};
