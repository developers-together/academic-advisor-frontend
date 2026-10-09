import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { User } from '@/types/domain';

export const VerifyEmailPanel = () => {
  const { t } = useTranslation('auth');
  const { id, hash } = useParams();
  const [searchParams] = useSearchParams();

  const query = useQuery({
    queryKey: ['verify-email', id, hash, searchParams.toString()],
    enabled: Boolean(id && hash),
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const search = searchParams.toString();
      const suffix = search ? `?${search}` : '';
      return unwrap<User>(api.get(`/verify-email/${id}/${hash}${suffix}`));
    },
  });

  if (!id || !hash) {
    return <InvalidState />;
  }

  if (query.isPending) {
    return (
      <div className="flex flex-col items-center gap-3 py-8" aria-busy="true">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">
          {t('verify.processing')}
        </p>
      </div>
    );
  }

  if (query.isError) {
    const error = query.error as { status?: number; key?: string };
    if (error.status === 503) {
      return (
        <div className="space-y-4 text-sm">
          <p className="font-medium">{t('verify.unavailableTitle')}</p>
          <p className="text-muted-foreground">{t('verify.unavailableBody')}</p>
          <Button className="h-11" onClick={() => void query.refetch()}>
            {t('common:actions.retry')}
          </Button>
        </div>
      );
    }
    if (
      error.status === 422 &&
      error.key === 'verification.national_id_mismatch'
    ) {
      return <MismatchState />;
    }
    return <InvalidState />;
  }

  const user = query.data;
  if (user?.pending_admin_at) {
    return (
      <div className="space-y-4 text-sm">
        <p className="font-medium">{t('verify.heldTitle')}</p>
        <p className="text-muted-foreground">{t('verify.heldBody')}</p>
        <Link
          to={paths.auth.login.getHref()}
          className="inline-flex h-11 items-center text-primary-text underline underline-offset-4 hover:decoration-2"
        >
          {t('verify.readyAction')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <p className="font-medium">{t('verify.readyTitle')}</p>
      <p className="text-muted-foreground">{t('verify.readyBody')}</p>
      <Button asChild className="h-11">
        <Link to={paths.auth.login.getHref()}>{t('verify.readyAction')}</Link>
      </Button>
    </div>
  );
};

const MismatchState = () => {
  const { t } = useTranslation('auth');

  return (
    <div className="space-y-4 text-sm">
      <p className="font-medium">{t('verify.mismatchTitle')}</p>
      <p className="text-muted-foreground">{t('verify.mismatchBody')}</p>
      <Button asChild variant="outline" className="h-11">
        <Link to={paths.auth.signup.getHref()}>
          {t('verify.invalidAction')}
        </Link>
      </Button>
    </div>
  );
};

const InvalidState = () => {
  const { t } = useTranslation('auth');

  return (
    <div className="space-y-4 text-sm">
      <p className="font-medium">{t('verify.invalidTitle')}</p>
      <p className="text-muted-foreground">{t('verify.invalidBody')}</p>
      <Button asChild variant="outline" className="h-11">
        <Link to={paths.auth.signup.getHref()}>
          {t('verify.invalidAction')}
        </Link>
      </Button>
    </div>
  );
};
