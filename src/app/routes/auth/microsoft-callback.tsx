import { useTranslation } from 'react-i18next';

import { AuthLayout } from '@/components/layouts';
import { MicrosoftSignInCallback } from '@/features/auth/components/microsoft-sign-in-callback';

export default function MicrosoftCallbackRoute() {
  const { t } = useTranslation('auth');

  return (
    <AuthLayout title={t('microsoft.title')} redirectOnSignedIn={false}>
      <MicrosoftSignInCallback />
    </AuthLayout>
  );
}
