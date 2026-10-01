import { useTranslation } from 'react-i18next';

import { AuthLayout } from '@/components/layouts';
import { VerifyEmailPanel } from '@/features/auth/components/verify-email-panel';

export default function VerifyEmailRoute() {
  const { t } = useTranslation('auth');

  return (
    <AuthLayout title={t('verify.processing')}>
      <VerifyEmailPanel />
    </AuthLayout>
  );
}
