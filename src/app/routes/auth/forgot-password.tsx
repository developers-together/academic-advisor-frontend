import { useTranslation } from 'react-i18next';

import { AuthLayout } from '@/components/layouts';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export default function ForgotPasswordRoute() {
  const { t } = useTranslation('auth');

  return (
    <AuthLayout title={t('forgot.title')}>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
