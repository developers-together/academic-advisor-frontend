import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  microsoftSignInStartUrl,
  rememberMicrosoftLandingPath,
} from '@/features/auth/api/microsoft-sign-in';
import { sanitizeRedirectTo } from '@/lib/auth';

export const MicrosoftSignInSection = () => {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();

  const start = () => {
    rememberMicrosoftLandingPath(
      sanitizeRedirectTo(searchParams.get('redirectTo')),
    );
    window.location.assign(microsoftSignInStartUrl);
  };

  return (
    <div className="mt-6">
      <div
        role="separator"
        aria-orientation="horizontal"
        className="flex items-center gap-3"
      >
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          {t('microsoft.divider')}
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-6 h-11 w-full"
        onClick={start}
      >
        {t('microsoft.signIn')}
      </Button>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t('microsoft.signInHint')}
      </p>
    </div>
  );
};
