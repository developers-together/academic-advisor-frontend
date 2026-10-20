import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import {
  isMicrosoftSignInFailure,
  readMicrosoftLandingPath,
  type MicrosoftSignInFailure,
} from '@/features/auth/api/microsoft-sign-in';
import { ApiError } from '@/lib/api-error';
import {
  authenticatedUserKey,
  roleLanding,
  sanitizeRedirectTo,
  signInWithMicrosoftCode,
} from '@/lib/auth';

const failureFromError = (error: unknown): MicrosoftSignInFailure | null => {
  if (error instanceof ApiError && isMicrosoftSignInFailure(error.reason)) {
    return error.reason;
  }
  return null;
};

export const MicrosoftSignInCallback = () => {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const code = searchParams.get('code');
  const refused = searchParams.get('error');
  const landing = sanitizeRedirectTo(readMicrosoftLandingPath());

  const exchange = useQuery({
    queryKey: ['microsoft-sign-in', code],
    enabled: Boolean(code),
    retry: false,
    staleTime: Infinity,
    queryFn: () => signInWithMicrosoftCode(code as string),
  });

  useEffect(() => {
    const user = exchange.data;
    if (!user) {
      return;
    }
    queryClient.setQueryData(authenticatedUserKey, user);
    const target =
      landing ??
      (user.role ? roleLanding[user.role] : paths.auth.awaitingRole.getHref());
    navigate(target, { replace: true });
  }, [exchange.data, landing, navigate, queryClient]);

  const failure =
    failureFromError(exchange.error) ??
    (isMicrosoftSignInFailure(refused) ? refused : null);

  const withoutProfile = exchange.isSuccess && !exchange.data;

  if (failure || exchange.isError || withoutProfile || !code) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          {failure
            ? t(`microsoft.failures.${failure}`)
            : t('microsoft.genericFailure')}
        </p>
        <Button asChild variant="outline" className="h-11">
          <Link to={paths.auth.login.getHref(landing)}>
            {t('microsoft.backToSignIn')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8" aria-busy="true">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">
        {t('microsoft.processing')}
      </p>
    </div>
  );
};
