import { AppShell } from '@/components/layouts';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { ProtectedRoute } from '@/lib/auth';
import { RoleRoute } from '@/lib/authorization';

export default function VpShellRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allow="vp">
        <AppShell forRole="vp" bell={<NotificationBell forRole="vp" />} />
      </RoleRoute>
    </ProtectedRoute>
  );
}
