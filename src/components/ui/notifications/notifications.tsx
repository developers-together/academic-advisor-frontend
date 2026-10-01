import { Notification } from './notification';
import { useNotifications } from './notifications-store';

export const Notifications = () => {
  const { notifications, dismissNotification } = useNotifications();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-0 z-60 flex flex-col items-center gap-3 pb-6 sm:inset-x-6 sm:items-end sm:pb-6"
    >
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onDismiss={dismissNotification}
        />
      ))}
    </div>
  );
};
