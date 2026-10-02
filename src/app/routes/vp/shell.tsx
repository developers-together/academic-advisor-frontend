import { AppShell } from '@/components/layouts';
import { ProtectedRoute } from '@/lib/auth';
import { RoleRoute } from '@/lib/authorization';

export default function VpShellRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allow="vp">
        <AppShell forRole="vp" />
      </RoleRoute>
    </ProtectedRoute>
  );
}
