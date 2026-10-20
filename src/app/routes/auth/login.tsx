import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';

import { AuthLayout } from '@/components/layouts';
import { paths } from '@/config/paths';
import { LoginForm } from '@/features/auth/components/login-form';
import { MicrosoftSignInSection } from '@/features/auth/components/microsoft-sign-in-section';
import { roleLanding, sanitizeRedirectTo } from '@/lib/auth';

export default function LoginRoute() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return (
    <AuthLayout title={t('login.title')}>
      <LoginForm
        onSuccess={(user) => {
          const target =
            sanitizeRedirectTo(searchParams.get('redirectTo')) ??
            (user.role
              ? roleLanding[user.role]
              : paths.auth.awaitingRole.getHref());
          navigate(target, { replace: true });
        }}
      />
      <MicrosoftSignInSection />
    </AuthLayout>
  );
}
