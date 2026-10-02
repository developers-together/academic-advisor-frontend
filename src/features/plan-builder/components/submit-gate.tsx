import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Banner, ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';

import type { SubmitFailure } from '../api/submit-failure';

export type SubmitGateProps = {
  canSubmit: boolean;
  pending: boolean;
  submitting: boolean;
  failure: SubmitFailure | null;
  windowClosed: boolean;
  serviceUnavailable: { requestId: string | null } | null;
  onSubmit: () => void;
  discard?: React.ReactNode;
  className?: string;
};

export const SubmitGate = ({
  canSubmit,
  pending,
  submitting,
  failure,
  windowClosed,
  serviceUnavailable,
  onSubmit,
  discard,
  className,
}: SubmitGateProps) => {
  const { t } = useTranslation('plan');

  const helper =
    failure && failure.total > 0
      ? t('builder.validation.submitBlocked', { count: failure.total })
      : canSubmit
        ? null
        : t('builder.emptyPlan.body');

  if (windowClosed) {
    return (
      <div className={className}>
        <Banner variant="window-closed" title={t('builder.windowClosedTitle')}>
          {t('builder.windowClosed')}
        </Banner>
        {discard && <div className="mt-3">{discard}</div>}
      </div>
    );
  }

  if (serviceUnavailable) {
    return (
      <div className={className}>
        <ErrorState
          title={t('builder.submitUnavailableTitle')}
          message={t('builder.submitUnavailableBody')}
          onRetry={onSubmit}
          requestId={serviceUnavailable.requestId}
        />
        {discard && <div className="mt-3">{discard}</div>}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          className="h-11"
          onClick={onSubmit}
          disabled={
            pending || !canSubmit || (failure !== null && failure.total > 0)
          }
          isLoading={submitting}
          aria-describedby={helper ? 'submit-gate-helper' : undefined}
        >
          {t('builder.submit')}
        </Button>
        {helper && (
          <p id="submit-gate-helper" className="text-sm text-muted-foreground">
            {helper}
          </p>
        )}
        {discard}
      </div>
    </div>
  );
};
