import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';

import { AuthLayout } from '@/components/layouts';
import { LoginForm } from '@/features/auth/components/login-form';
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
            roleLanding[user.role];
          navigate(target, { replace: true });
        }}
      />
    </AuthLayout>
  );
}
