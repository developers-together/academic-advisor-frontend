import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { useTurnStreamStore } from '@/features/ai-chat/stores/turn-stream-store';
import { ApiError } from '@/lib/api-error';
import { i18n } from '@/lib/i18n/i18n-instance';

import { planConversationsRootKey } from './conversations';
import { streamTurn } from './turn-stream';

export const useSendTurn = (conversationId: number) => {
  const queryClient = useQueryClient();
  const controllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      const store = useTurnStreamStore.getState();
      store.beginTurn(conversationId, message);
      const controller = new AbortController();
      controllerRef.current = controller;
      let outcome: 'completed' | 'terminal' = 'completed';
      try {
        for await (const frame of streamTurn(
          conversationId,
          message,
          controller.signal,
        )) {
          if (controller.signal.aborted) {
            store.stopTurn(conversationId);
            outcome = 'terminal';
            break;
          }
          switch (frame.event) {
            case 'token':
              store.appendToken(conversationId, frame);
              break;
            case 'tool.applied':
              store.applyTool(conversationId, frame);
              void queryClient.invalidateQueries({ queryKey: ['plan'] });
              break;
            case 'submit.suggested':
              store.markSubmitSuggested(conversationId);
              break;
            case 'submit.result':
              store.recordSubmitResult(conversationId, frame);
              void queryClient.invalidateQueries({ queryKey: ['plan'] });
              void queryClient.invalidateQueries({
                queryKey: planConversationsRootKey,
              });
              break;
            case 'turn.completed':
              store.completeTurn(conversationId, frame);
              break;
            case 'error':
              store.failTurn(conversationId, {
                code: frame.code,
                retryable: frame.retryable,
                key: frame.key,
                message: frame.message,
              });
              outcome = 'terminal';
              break;
          }
        }
      } catch (error) {
        if (controller.signal.aborted) {
          store.stopTurn(conversationId);
          outcome = 'terminal';
        } else {
          store.failTurn(conversationId, {
            code: 'turn_failed',
            retryable: true,
            key: 'composer.sendFailed',
            message: i18n.t('chat:composer.sendFailed'),
          });
          throw error;
        }
      }
      if (controller.signal.aborted && outcome === 'completed') {
        store.stopTurn(conversationId);
        outcome = 'terminal';
      }
      await queryClient.invalidateQueries({
        queryKey: planConversationsRootKey,
      });
      if (outcome === 'completed') {
        store.clearTurn(conversationId);
      } else {
        store.reconcileTurn(conversationId);
      }
    },
    retry: 0,
    onError: (error) => {
      if (
        error instanceof ApiError &&
        error.status === 429 &&
        error.key === 'advisor.quota_exhausted'
      ) {
        useTurnStreamStore.getState().setQuotaExhausted();
      }
    },
  });

  return { ...mutation, stop: () => controllerRef.current?.abort() };
};
