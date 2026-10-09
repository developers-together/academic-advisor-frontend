import type { LucideIcon } from 'lucide-react';
import {
  AlarmClock,
  Bell,
  CalendarCheck,
  CalendarPlus,
  CalendarX2,
  CircleCheck,
  DoorOpen,
  FileX2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/lib/i18n/format';
import type { AppNotification, NotificationSlug } from '@/types/domain';
import { cn } from '@/utils/cn';

const slugIcons: Record<NotificationSlug, LucideIcon> = {
  plan_returned: FileX2,
  plan_approved: CircleCheck,
  advisor_changed: Users,
  caseload_student_added: UserPlus,
  caseload_student_removed: UserMinus,
  window_opened: DoorOpen,
  window_deadline_nearing: AlarmClock,
  meeting_requested: CalendarPlus,
  meeting_proposed: CalendarCheck,
  meeting_confirmed: CalendarCheck,
  meeting_declined: CalendarX2,
  meeting_cancelled: CalendarX2,
  meeting_completed: CircleCheck,
};

export type NotificationItemProps = {
  notification: AppNotification;
  onOpen: (notification: AppNotification) => void;
};

export const NotificationItem = ({
  notification,
  onOpen,
}: NotificationItemProps) => {
  const { t } = useTranslation('notifications');
  const Icon = notification.slug ? slugIcons[notification.slug] : Bell;
  const isUnread = notification.read_at === null;
  const title =
    notification.title ??
    (notification.slug ? t(`slugs.${notification.slug}`) : null);

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className={cn(
          'flex w-full items-start gap-4 rounded-xl border border-transparent bg-card p-4 text-start transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
          isUnread && 'border-s border-s-primary bg-primary/5',
        )}
      >
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground',
            isUnread && 'bg-primary/10 text-primary-text',
          )}
        >
          <Icon
            className={cn('size-5', isUnread && 'stroke-2.5 fill-current/15')}
            aria-hidden
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium">{title}</span>
            {isUnread && (
              <>
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full bg-primary"
                />
                <span className="sr-only">{t('unread')}</span>
              </>
            )}
          </span>
          {notification.body && (
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {notification.body}
            </span>
          )}
          <span className="mt-1 block text-xs text-muted-foreground tabular-nums">
            {formatDateTime(notification.created_at)}
          </span>
        </span>
      </button>
    </li>
  );
};
