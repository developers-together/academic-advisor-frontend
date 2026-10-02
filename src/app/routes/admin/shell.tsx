import { AppShell } from '@/components/layouts';
import { ProtectedRoute } from '@/lib/auth';
import { RoleRoute } from '@/lib/authorization';

export default function AdminShellRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allow="admin">
        <AppShell forRole="admin" />
      </RoleRoute>
    </ProtectedRoute>
  );
}
