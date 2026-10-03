import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import {
  unwrapNotificationPage,
  type NotificationPage,
} from '@/lib/api-envelope';
import type { AppNotification } from '@/types/domain';

export const notificationsQueryKey = ['notifications'] as const;

export const getNotifications = (): Promise<
  NotificationPage<AppNotification>
> =>
  unwrapNotificationPage<AppNotification>(
    api.get('/notifications', { params: { per_page: 'all' } }),
  );

export const useNotifications = () =>
  useQuery({
    queryKey: notificationsQueryKey,
    queryFn: getNotifications,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

export const markPageItemsRead = (
  page: NotificationPage<AppNotification>,
  ids: ReadonlySet<string>,
): NotificationPage<AppNotification> => {
  const readAt = new Date().toISOString();
  const items = page.items.map((item) =>
    ids.has(item.id) && item.read_at === null
      ? { ...item, read_at: readAt }
      : item,
  );
  return {
    ...page,
    items,
    unreadCount: items.filter((item) => item.read_at === null).length,
  };
};
