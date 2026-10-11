import { useTranslation } from 'react-i18next';

import { AuthLayout } from '@/components/layouts';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export default function ResetPasswordRoute() {
  const { t } = useTranslation('auth');

  return (
    <AuthLayout title={t('reset.title')}>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
