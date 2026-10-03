import { AppShell } from '@/components/layouts';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { ProtectedRoute } from '@/lib/auth';
import { RoleRoute } from '@/lib/authorization';

export default function AdminShellRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allow="admin">
        <AppShell forRole="admin" bell={<NotificationBell forRole="admin" />} />
      </RoleRoute>
    </ProtectedRoute>
  );
}
