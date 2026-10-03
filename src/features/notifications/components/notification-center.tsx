import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Banner, ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { useUser } from '@/lib/auth';
import { PermissionDenied } from '@/lib/authorization';
import type { AppNotification } from '@/types/domain';

import { deepLinkHref } from '../api/deep-link';
import { useNotifications } from '../api/get-notifications';
import { useReadAllNotifications } from '../api/read-all-notifications';
import { useReadNotification } from '../api/read-notification';

import { NotificationItem } from './notification-item';

const itemSkeleton = (
  <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
    <Skeleton className="size-5 shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-40" />
    </div>
  </div>
);

export const NotificationCenter = () => {
  const { t } = useTranslation('notifications');
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const user = useUser();
  const role = user.data?.role;
  const notificationsQuery = useNotifications();
  const readNotification = useReadNotification();
  const readAllNotifications = useReadAllNotifications();

  const open = (notification: AppNotification) => {
    if (!notification.read_at && role) {
      readNotification.mutate(notification.id);
    }
    if (role) {
      navigate(deepLinkHref(notification.deep_link, role));
    }
  };

  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  return (
    <ContentLayout
      title={t('title')}
      context={
        unreadCount > 0 ? t('unreadContext', { count: unreadCount }) : undefined
      }
      actions={
        <Button
          variant="outline"
          onClick={() => readAllNotifications.mutate(undefined)}
          disabled={unreadCount === 0 || readAllNotifications.isPending}
          isLoading={readAllNotifications.isPending}
        >
          {readAllNotifications.isPending
            ? t('markAllReadPending')
            : t('markAllRead')}
        </Button>
      }
    >
      {notificationsQuery.isPending ? (
        <div
          aria-busy="true"
          className="max-w-xl space-y-3"
          data-testid="notifications-loading"
        >
          {itemSkeleton}
          {itemSkeleton}
          {itemSkeleton}
        </div>
      ) : notificationsQuery.isError ? (
        notificationsQuery.error instanceof ApiError &&
        notificationsQuery.error.status === 403 &&
        role ? (
          <PermissionDenied audience={role} className="max-w-xl" />
        ) : (
          <ErrorState
            compact
            onRetry={() => void notificationsQuery.refetch()}
            requestId={
              notificationsQuery.error instanceof ApiError
                ? notificationsQuery.error.requestId
                : null
            }
          />
        )
      ) : (notificationsQuery.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          compact
          className="max-w-xl"
          title={t('empty.title')}
          description={t('empty.body')}
        />
      ) : (
        <ul className="max-w-xl space-y-3">
          {notificationsQuery.data?.items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onOpen={open}
            />
          ))}
        </ul>
      )}
      {readAllNotifications.isError && (
        <Banner variant="destructive" className="mt-3 max-w-xl">
          {tCommon('errors.loadFailed')}
        </Banner>
      )}
    </ContentLayout>
  );
};
