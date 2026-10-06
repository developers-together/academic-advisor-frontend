import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/utils/cn';

export type PulseStripProps = {
  planStatus: string;
  planStatusLabel: string;
  credits: number;
  creditsMin: number;
  creditsMax: number;
  earnedShare: number;
  planHref: string;
  recordHref: string;
  className?: string;
};

const statusTone: Record<string, string> = {
  draft: 'bg-muted-foreground/40',
  returned: 'bg-warning',
  submitted: 'bg-info',
  under_review: 'bg-warning',
  approved: 'bg-success',
};

export const PulseStrip = ({
  planStatus,
  planStatusLabel,
  credits,
  creditsMin,
  creditsMax,
  earnedShare,
  planHref,
  recordHref,
  className,
}: PulseStripProps) => {
  const { t } = useTranslation('plan');
  const underMin = credits < creditsMin;

  return (
    <Card className={cn(className)} aria-busy="false">
      <CardBody className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{planStatusLabel}</span>
          </div>
          <div className="flex gap-2">
            <Link className="text-sm font-medium text-primary" to={planHref}>
              {t('pulse.openPlan')}
            </Link>
            <Link className="text-sm font-medium text-primary" to={recordHref}>
              {t('pulse.openRecord')}
            </Link>
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('pulse.heading')}</span>
            <span className="tabular-nums">
              {t('pulse.degree', { share: earnedShare })}
            </span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full border border-border">
            <span
              className={cn(
                'h-full',
                statusTone[planStatus] || 'bg-muted-foreground/40',
              )}
              style={{ width: '33%' }}
            />
            <span
              data-testid="pulse-load"
              data-under-min={underMin ? 'true' : 'false'}
              className={cn('h-full', underMin ? 'bg-warning' : 'bg-success')}
              style={{
                width: `${Math.max(8, Math.round((credits / creditsMax) * 100) - 8)}%`,
              }}
            />
            <span className="h-full flex-1 bg-success/85" />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
          <span>
            {t(`pulse.planLine.${planStatus}`, {
              defaultValue: planStatusLabel,
            })}
          </span>
          <span>
            {t('pulse.loadLine', { credits, min: creditsMin, max: creditsMax })}
          </span>
          <span>{t('pulse.earnedLine')}</span>
        </div>
      </CardBody>
    </Card>
  );
};

PulseStrip.displayName = 'PulseStrip';
