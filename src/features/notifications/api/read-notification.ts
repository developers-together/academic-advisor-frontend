import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { NotificationPage } from '@/lib/api-envelope';
import type { AppNotification } from '@/types/domain';

import { markPageItemsRead, notificationsQueryKey } from './get-notifications';

export const readNotification = async (id: string): Promise<void> => {
  await api.post(`/notifications/${id}/read`);
};

export const useReadNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: readNotification,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey });
      const previous = queryClient.getQueryData<
        NotificationPage<AppNotification>
      >(notificationsQueryKey);
      queryClient.setQueryData<NotificationPage<AppNotification>>(
        notificationsQueryKey,
        (page) => (page ? markPageItemsRead(page, new Set([id])) : page),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsQueryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
};
