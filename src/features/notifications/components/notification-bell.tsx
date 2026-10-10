import * as Popover from '@radix-ui/react-popover';
import { Bell, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import type { UserRole } from '@/types/domain';

import { sectionNotificationsPath } from '../api/deep-link';
import { useNotifications } from '../api/get-notifications';

import { NotificationCenter } from './notification-center';

export type NotificationBellProps = {
  forRole: UserRole;
};

export const NotificationBell = ({ forRole }: NotificationBellProps) => {
  const { t, i18n } = useTranslation();
  const { t: tNotifications } = useTranslation('notifications');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const notificationsQuery = useNotifications();
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const label = t('topbar.unreadCount', { count: unreadCount });

  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={label}
            className="relative flex size-11 items-center justify-center rounded-md hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
          >
            <Bell
              className={
                unreadCount > 0 ? 'stroke-2.5 size-5 fill-current/15' : 'size-5'
              }
              aria-hidden
            />
            {unreadCount > 0 && (
              <span
                aria-hidden
                className="absolute inset-e-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-2xs leading-4 font-semibold text-primary-foreground"
              >
                {unreadCount}
              </span>
            )}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side={i18n.dir() === 'rtl' ? 'left' : 'right'}
            align="end"
            sideOffset={12}
            collisionPadding={12}
            className="z-50 max-h-[80dvh] w-[min(440px,calc(100vw-24px))] overflow-auto rounded-2xl border bg-card p-5 text-foreground shadow-2xl"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('li button'))
                setOpen(false);
            }}
          >
            <Popover.Close
              aria-label={t('actions.close')}
              className="ms-auto mb-2 grid size-11 place-items-center rounded-xl hover:bg-muted"
            >
              <X className="size-4" aria-hidden />
            </Popover.Close>
            <NotificationCenter compact />
            <button
              type="button"
              className="mt-4 min-h-11 w-full rounded-xl border text-sm font-medium hover:bg-muted"
              onClick={() => {
                setOpen(false);
                navigate(sectionNotificationsPath[forRole]);
              }}
            >
              {tNotifications('viewAll')}
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <span role="status" aria-live="polite" className="sr-only">
        {label}
      </span>
    </>
  );
};
