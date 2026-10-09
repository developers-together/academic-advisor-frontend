import { CheckCheck } from 'lucide-react';
import { useState } from 'react';
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
import { formatDate } from '@/lib/i18n/format';
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

export const NotificationCenter = ({
  compact = false,
}: {
  compact?: boolean;
}) => {
  const [unreadOnly, setUnreadOnly] = useState(false);
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

  const items =
    notificationsQuery.data?.items.filter(
      (item) => !unreadOnly || item.read_at === null,
    ) ?? [];
  const groups = new Map<string, AppNotification[]>();
  for (const item of items) {
    const date = formatDate(item.created_at);
    groups.set(date, [...(groups.get(date) ?? []), item]);
  }
  const actions = (
    <Button
      variant="ghost"
      onClick={() => readAllNotifications.mutate(undefined)}
      disabled={unreadCount === 0 || readAllNotifications.isPending}
      isLoading={readAllNotifications.isPending}
      icon={<CheckCheck className="size-4" aria-hidden />}
    >
      {t('markAllRead')}
    </Button>
  );
  const content = (
    <>
      <div
        className="mb-4 flex gap-1 border-b pb-3"
        role="group"
        aria-label={t('title')}
      >
        {[false, true].map((value) => (
          <button
            key={String(value)}
            type="button"
            aria-pressed={unreadOnly === value}
            onClick={() => setUnreadOnly(value)}
            className={
              unreadOnly === value
                ? 'min-h-11 rounded-xl bg-primary/10 px-4 text-sm font-semibold text-primary-text'
                : 'min-h-11 rounded-xl px-4 text-sm text-muted-foreground hover:bg-muted'
            }
          >
            {t(value ? 'unread' : 'all')}
            {value && unreadCount > 0 && (
              <span className="ms-2 rounded-md bg-card px-1.5 py-0.5 text-xs">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

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
      ) : items.length === 0 ? (
        <EmptyState
          compact
          className="max-w-xl"
          title={t(unreadOnly ? 'caughtUp' : 'empty.title')}
          description={t('empty.body')}
        />
      ) : (
        <ul className="max-w-xl divide-y rounded-2xl border bg-card p-2">
          {Array.from(groups, ([date, notifications]) => (
            <li key={date} className="py-2">
              <h3 className="px-4 py-2 text-xs font-medium text-muted-foreground">
                {date}
              </h3>
              <ul className="space-y-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onOpen={open}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {readAllNotifications.isError && (
        <Banner variant="destructive" className="mt-3 max-w-xl">
          {tCommon('errors.loadFailed')}
        </Banner>
      )}
    </>
  );
  if (compact)
    return (
      <section aria-label={t('title')}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          {actions}
        </div>
        {content}
      </section>
    );
  return (
    <ContentLayout
      title={t('title')}
      context={
        unreadCount > 0 ? t('unreadContext', { count: unreadCount }) : undefined
      }
      actions={actions}
    >
      {content}
    </ContentLayout>
  );
};
