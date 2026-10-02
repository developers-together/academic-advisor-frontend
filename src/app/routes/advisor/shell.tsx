import { AppShell } from '@/components/layouts';
import { ProtectedRoute } from '@/lib/auth';
import { RoleRoute } from '@/lib/authorization';

export default function AdvisorShellRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allow="advisor">
        <AppShell forRole="advisor" />
      </RoleRoute>
    </ProtectedRoute>
  );
}
