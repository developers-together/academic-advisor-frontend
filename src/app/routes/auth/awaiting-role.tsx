import { useTranslation } from 'react-i18next';

import { AuthLayout } from '@/components/layouts';
import { AwaitingRolePanel } from '@/features/auth/components/awaiting-role-panel';

export default function AwaitingRoleRoute() {
  const { t } = useTranslation('auth');

  return (
    <AuthLayout title={t('microsoft.awaitingRole.title')}>
      <AwaitingRolePanel />
    </AuthLayout>
  );
}
