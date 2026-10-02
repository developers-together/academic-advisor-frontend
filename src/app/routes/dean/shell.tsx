import { AppShell } from '@/components/layouts';
import { ProtectedRoute } from '@/lib/auth';
import { RoleRoute } from '@/lib/authorization';

export default function DeanShellRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allow="dean">
        <AppShell forRole="dean" />
      </RoleRoute>
    </ProtectedRoute>
  );
}
