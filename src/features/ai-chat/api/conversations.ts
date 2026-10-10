import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap, unwrapList } from '@/lib/api-envelope';
import type { PlanConversation } from '@/types/domain';

export const planConversationsRootKey = ['plan-conversations'] as const;

export const planConversationKey = (conversationId: number) =>
  [...planConversationsRootKey, conversationId] as const;

const staleTime30s = 1000 * 30;

export const getConversations = (): Promise<PlanConversation[]> =>
  unwrapList<PlanConversation>(api.get('/plan-conversations'));

export const getConversationsQueryOptions = () =>
  queryOptions({
    queryKey: planConversationsRootKey,
    queryFn: getConversations,
    staleTime: staleTime30s,
  });

export const usePlanConversations = () =>
  useQuery(getConversationsQueryOptions());

export const getConversation = (
  conversationId: number,
): Promise<PlanConversation> =>
  unwrap<PlanConversation>(api.get(`/plan-conversations/${conversationId}`));

export const getConversationQueryOptions = (conversationId: number | null) =>
  queryOptions({
    queryKey: planConversationKey(conversationId ?? 0),
    queryFn: () => getConversation(conversationId as number),
    staleTime: 0,
    structuralSharing: (previous: unknown, incoming: unknown) => {
      const old = previous as PlanConversation | undefined;
      const next = incoming as PlanConversation;
      const serverMessages = next.messages ?? [];
      const knownIds = new Set(
        (old?.messages ?? [])
          .filter((item) => item.id > 0)
          .map((item) => item.id),
      );
      const candidates = serverMessages.filter(
        (item) => !knownIds.has(item.id),
      );
      const pending = (old?.messages ?? []).filter((item) => item.id < 0);
      const remaining = pending.filter((item) => {
        const index = candidates.findIndex(
          (candidate) =>
            candidate.role === item.role &&
            candidate.content.trim().replace(/\s+/g, ' ') ===
              item.content.trim().replace(/\s+/g, ' '),
        );
        if (index < 0) return true;
        candidates.splice(index, 1);
        return false;
      });
      return remaining.length
        ? {
            ...next,
            messages: [...serverMessages, ...remaining].sort(
              (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
            ),
          }
        : next;
    },
    enabled: conversationId !== null,
  });

export const usePlanConversation = (conversationId: number | null) =>
  useQuery(getConversationQueryOptions(conversationId));

export const createConversation = (input: {
  first_message?: string;
}): Promise<PlanConversation> =>
  unwrap<PlanConversation>(api.post('/plan-conversations', input));

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: planConversationsRootKey,
      });
    },
  });
};
