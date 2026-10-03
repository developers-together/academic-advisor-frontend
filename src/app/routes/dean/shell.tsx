import { AppShell } from '@/components/layouts';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { ProtectedRoute } from '@/lib/auth';
import { RoleRoute } from '@/lib/authorization';

export default function DeanShellRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allow="dean">
        <AppShell forRole="dean" bell={<NotificationBell forRole="dean" />} />
      </RoleRoute>
    </ProtectedRoute>
  );
}
