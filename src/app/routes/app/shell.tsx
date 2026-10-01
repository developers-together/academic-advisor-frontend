import { AppShell } from '@/components/layouts';
import { ProtectedRoute } from '@/lib/auth';
import { RoleRoute } from '@/lib/authorization';

export default function StudentShellRoute() {
  return (
    <ProtectedRoute>
      <RoleRoute allow="student">
        <AppShell forRole="student" />
      </RoleRoute>
    </ProtectedRoute>
  );
}
