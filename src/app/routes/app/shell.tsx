import { AppShell } from '@/components/layouts';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { ProtectedRoute } from '@/lib/auth';
import { RoleRoute } from '@/lib/authorization';

export default function StudentShellRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allow="student">
        <AppShell
          forRole="student"
          bell={<NotificationBell forRole="student" />}
        />
      </RoleRoute>
    </ProtectedRoute>
  );
}
