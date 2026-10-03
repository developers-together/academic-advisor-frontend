import { AppShell } from '@/components/layouts';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { ProtectedRoute } from '@/lib/auth';
import { RoleRoute } from '@/lib/authorization';

export default function AdvisorShellRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allow="advisor">
        <AppShell
          forRole="advisor"
          bell={<NotificationBell forRole="advisor" />}
        />
      </RoleRoute>
    </ProtectedRoute>
  );
}
