import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import type { UserRole } from '@/types/domain';

import { sectionNotificationsPath } from '../api/deep-link';
import { useNotifications } from '../api/get-notifications';

export type NotificationBellProps = {
  forRole: UserRole;
};

export const NotificationBell = ({ forRole }: NotificationBellProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notificationsQuery = useNotifications();
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const label = t('topbar.unreadCount', { count: unreadCount });

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={() => navigate(sectionNotificationsPath[forRole])}
        className="relative flex size-11 items-center justify-center rounded-md hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
      >
        <Bell className="size-5" aria-hidden />
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute inset-e-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-crimson-500 px-1 text-2xs leading-4 font-semibold text-white"
          >
            {unreadCount}
          </span>
        )}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {label}
      </span>
    </>
  );
};
