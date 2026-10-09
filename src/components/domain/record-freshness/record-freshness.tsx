import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/i18n/format';
import { cn } from '@/utils/cn';

export type RecordFreshnessProps = {
  lastSyncedAt: string | null;
  onRetry: () => void;
  isRetrying?: boolean;
  className?: string;
};

export const RecordFreshness = ({
  lastSyncedAt,
  onRetry,
  isRetrying = false,
  className,
}: RecordFreshnessProps) => {
  const { t } = useTranslation('common');

  if (!lastSyncedAt) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-3 gap-y-1',
        className,
      )}
    >
      <p className="text-xs text-muted-foreground">
        {t('staleSis.dataAsOf', { datetime: formatDateTime(lastSyncedAt) })}
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="h-11 text-xs text-muted-foreground"
        onClick={onRetry}
        isLoading={isRetrying}
        disabled={isRetrying}
      >
        {t('actions.retry')}
      </Button>
    </div>
  );
};
