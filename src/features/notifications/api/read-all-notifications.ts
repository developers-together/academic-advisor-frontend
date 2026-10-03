import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { NotificationPage } from '@/lib/api-envelope';
import type { AppNotification } from '@/types/domain';

import { markPageItemsRead, notificationsQueryKey } from './get-notifications';

export const readAllNotifications = async (): Promise<void> => {
  await api.post('/notifications/read-all');
};

export const useReadAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: readAllNotifications,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey });
      const previous = queryClient.getQueryData<
        NotificationPage<AppNotification>
      >(notificationsQueryKey);
      queryClient.setQueryData<NotificationPage<AppNotification>>(
        notificationsQueryKey,
        (page) =>
          page
            ? markPageItemsRead(page, new Set(page.items.map((i) => i.id)))
            : page,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsQueryKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    },
  });
};
