import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Head } from '@/components/seo';
import { paths } from '@/config/paths';
import { roleHome, useRole } from '@/lib/authorization';

export default function NotFoundRoute() {
  const { t } = useTranslation();
  const role = useRole();
  const backHref = role ? roleHome(role) : paths.auth.login.getHref();

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
            {role
              ? t('errors.notFoundAction')
              : t('registered.backToSignIn', { ns: 'auth' })}
          </Link>
        </div>
      </ContentLayout>
    </>
  );
}
