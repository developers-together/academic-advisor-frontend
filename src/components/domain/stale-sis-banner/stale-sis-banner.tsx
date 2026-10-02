import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/i18n/format';
import type { Staleness } from '@/types/domain';

const DATASETS = ['identity', 'academic_record', 'course_catalog'] as const;

export type StaleSisBannerProps = {
  staleness: Staleness;
  lastSyncedAt: string | null;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
};

export const StaleSisBanner = ({
  staleness,
  lastSyncedAt,
  onRetry,
  isRetrying = false,
  className,
}: StaleSisBannerProps) => {
  const { t } = useTranslation();
  const staleDatasets = DATASETS.filter((dataset) => staleness[dataset]);

  if (staleDatasets.length === 0) {
    return null;
  }

  return (
    <Banner
      variant="stale"
      title={
        lastSyncedAt
          ? t('staleSis.dataAsOf', {
              datetime: formatDateTime(lastSyncedAt),
            })
          : undefined
      }
      action={
        <Button
          variant="outline"
          size="sm"
          className="h-11"
          onClick={onRetry}
          isLoading={isRetrying}
          disabled={isRetrying}
        >
          {t('actions.retry')}
        </Button>
      }
      className={className}
    >
      <p>
        {t('staleSis.body', {
          datasets: staleDatasets
            .map((dataset) => t(`staleSis.datasets.${dataset}`))
            .join(', '),
        })}
      </p>
    </Banner>
  );
};
