import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { useTurnStreamStore } from '@/features/ai-chat/stores/turn-stream-store';
import { ApiError } from '@/lib/api-error';
import { i18n } from '@/lib/i18n/i18n-instance';
import type { PlanConversation, PlanConversationMessage } from '@/types/domain';

import { planConversationKey, planConversationsRootKey } from './conversations';
import { streamTurn } from './turn-stream';

let clientMessageId = -Date.now();

export const useSendTurn = (conversationId: number) => {
  const queryClient = useQueryClient();
  const controllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      const store = useTurnStreamStore.getState();
      const key = planConversationKey(conversationId);
      await queryClient.cancelQueries({ queryKey: key });
      const previousTurn = store.turns[String(conversationId)];
      const baselineIds = new Set(
        queryClient
          .getQueryData<PlanConversation>(key)
          ?.messages?.map((item) => item.id) ?? [],
      );
      store.beginTurn(conversationId, message, [...baselineIds]);
      const startedAt =
        useTurnStreamStore.getState().turns[String(conversationId)].startedAt;
      const appendMessage = (
        role: PlanConversationMessage['role'],
        content: string,
      ) => {
        queryClient.setQueryData<PlanConversation>(key, (conversation) => {
          if (!conversation) return conversation;
          const messages = conversation.messages ?? [];
          if (
            messages.some(
              (item) =>
                item.id > 0 &&
                !baselineIds.has(item.id) &&
                item.role === role &&
                item.content === content,
            )
          )
            return conversation;
          if (
            role === 'user' &&
            previousTurn?.status === 'failed' &&
            previousTurn.userMessage === content &&
            messages.findLast((item) => item.role === 'user')?.content ===
              content
          )
            return conversation;
          return {
            ...conversation,
            messages: [
              ...messages,
              {
                id: --clientMessageId,
                role,
                content,
                created_at: startedAt,
              },
            ],
          };
        });
      };
      appendMessage('user', message);
      store.reconcileTurn(conversationId);
      const controller = new AbortController();
      controllerRef.current = controller;
      let outcome: 'completed' | 'terminal' = 'terminal';
      let response: string | null = null;
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
              outcome = 'completed';
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
          const partial = useTurnStreamStore
            .getState()
            .turns[String(conversationId)]?.blocks.filter(
              (block) => block.kind === 'text',
            )
            .map((block) => block.text)
            .join('\n\n');
          if (partial) appendMessage('assistant', partial);
          throw error;
        }
      }
      if (controller.signal.aborted && outcome === 'completed') {
        store.stopTurn(conversationId);
        outcome = 'terminal';
      }
      const current =
        useTurnStreamStore.getState().turns[String(conversationId)];
      if (
        outcome === 'terminal' &&
        (current?.status === 'typing' || current?.status === 'streaming')
      ) {
        store.failTurn(conversationId, {
          code: 'turn_failed',
          retryable: true,
          key: 'composer.sendFailed',
          message: i18n.t('chat:composer.sendFailed'),
        });
      }
      if (outcome === 'completed') {
        const completed =
          useTurnStreamStore.getState().turns[String(conversationId)];
        response =
          completed?.blocks
            .filter((block) => block.kind === 'text')
            .map((block) => block.text)
            .join('\n\n') ?? null;
        if (response) appendMessage('assistant', response);
        store.clearTurn(conversationId);
      } else {
        const partial = useTurnStreamStore
          .getState()
          .turns[String(conversationId)]?.blocks.filter(
            (block) => block.kind === 'text',
          )
          .map((block) => block.text)
          .join('\n\n');
        if (partial) appendMessage('assistant', partial);
      }
      await queryClient.invalidateQueries({
        queryKey: planConversationsRootKey,
      });
      return response;
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
