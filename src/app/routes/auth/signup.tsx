import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { AuthLayout } from '@/components/layouts';
import { SignupForm } from '@/features/auth/components/signup-form';

export default function SignupRoute() {
  const { t } = useTranslation('auth');
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(
    null,
  );

  return (
    <AuthLayout
      title={registeredEmail ? t('registered.title') : t('signup.title')}
    >
      {registeredEmail ? (
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            {t('registered.body', { email: registeredEmail })}
          </p>
          <p className="text-muted-foreground">{t('registered.resendHint')}</p>
        </div>
      ) : (
        <SignupForm onRegistered={setRegisteredEmail} />
      )}
    </AuthLayout>
  );
}
