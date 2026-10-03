import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';

import { useQueueAgingThreshold } from '../api/get-queue-aging-threshold';
import { useUpdateQueueAgingThreshold } from '../api/update-queue-aging-threshold';

export const QueueAgingCard = () => {
  const { t } = useTranslation('admin');
  const thresholdQuery = useQueueAgingThreshold();
  const updateThreshold = useUpdateQueueAgingThreshold();

  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const days =
    draft ?? (thresholdQuery.data ? String(thresholdQuery.data.days) : '');

  const save = () => {
    const value = Number(days);
    if (!Number.isInteger(value) || value < 1) {
      setError(
        days.trim() === ''
          ? t('settings.thresholdErrors.required')
          : t('settings.thresholdErrors.min'),
      );
      return;
    }
    setError(null);
    updateThreshold.mutate(value, {
      onError: (mutationError) => {
        if (
          mutationError instanceof ApiError &&
          mutationError.status === 422 &&
          mutationError.fields['days']?.[0]
        ) {
          setError(mutationError.fields['days'][0]);
        }
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.threshold.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('settings.threshold.context')}
        </p>
      </CardHeader>
      <CardBody>
        {thresholdQuery.isPending ? (
          <Skeleton className="h-9 w-32" aria-busy="true" />
        ) : thresholdQuery.isError ? (
          <ErrorState
            compact
            onRetry={() => void thresholdQuery.refetch()}
            requestId={
              thresholdQuery.error instanceof ApiError
                ? thresholdQuery.error.requestId
                : null
            }
          />
        ) : (
          <div className="max-w-xs space-y-2">
            <div className="flex items-center gap-2">
              <label htmlFor="queue-aging-days" className="sr-only">
                {t('settings.threshold.days')}
              </label>
              <div className="relative w-28">
                <input
                  id="queue-aging-days"
                  type="number"
                  min={1}
                  step={1}
                  value={days}
                  onChange={(event) => setDraft(event.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 pe-12 text-sm tabular-nums focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden"
                />
                <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-sm text-muted-foreground">
                  {t('settings.threshold.days')}
                </span>
              </div>
              <Button
                onClick={save}
                isLoading={updateThreshold.isPending}
                disabled={updateThreshold.isPending}
              >
                {t('settings.threshold.save')}
              </Button>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {t('settings.threshold.effect')}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
