import { useTranslation } from 'react-i18next';

import { RetryButton } from '@/components/ui/button';

export const MainErrorFallback = () => {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background p-6"
    >
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-lg font-semibold">{t('errors.loadFailed')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('errors.loadFailedBody')}
        </p>
      </div>
      <RetryButton
        onClick={() => window.location.assign(window.location.origin)}
      >
        {t('actions.retry')}
      </RetryButton>
    </div>
  );
};
