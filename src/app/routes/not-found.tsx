import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { paths } from '@/config/paths';
import { roleHome, useAccountStatus } from '@/lib/authorization';

export default function NotFoundRoute() {
  const { t } = useTranslation();
  const account = useAccountStatus();
  const backHref =
    account.kind === 'signed-in'
      ? roleHome(account.role)
      : account.kind === 'awaiting-role'
        ? paths.auth.awaitingRole.getHref()
        : paths.auth.login.getHref();

  return (
    <>
      <Head title={t('errors.notFoundTitle')} />
      <ContentLayout title={t('errors.notFoundTitle')}>
        <div className="mx-auto max-w-md rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t('errors.notFoundBody')}
          </p>
          <Link
            to={backHref}
            className="mt-4 inline-flex h-11 items-center rounded-md px-4 text-sm font-medium text-primary-text underline-offset-4 hover:underline"
          >
            {account.kind === 'signed-in'
              ? t('errors.notFoundAction')
              : account.kind === 'awaiting-role'
                ? t('microsoft.awaitingRole.title', { ns: 'auth' })
                : t('registered.backToSignIn', { ns: 'auth' })}
          </Link>
        </div>
      </ContentLayout>
    </>
  );
}
