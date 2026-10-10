import { useTranslation } from 'react-i18next';

import { Head } from '@/components/seo';
import { RetryButton } from '@/components/ui/button';

export const RouteErrorBoundary = () => {
  const { t } = useTranslation();
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-lg flex-col items-center justify-center gap-5 p-6 text-center">
      <Head title={t('errors.pageUnavailable')} />
      <img
        src="/ejust-logo.png"
        alt="E-JUST"
        className="size-12 object-contain"
      />
      <h1 className="text-2xl font-semibold">{t('errors.pageUnavailable')}</h1>
      <p className="text-muted-foreground">{t('errors.pageUnavailableBody')}</p>
      <RetryButton onClick={() => window.location.reload()}>
        {t('actions.retry')}
      </RetryButton>
    </main>
  );
};
