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
        <div
          aria-hidden="true"
          className="flex h-2.5 overflow-hidden rounded-full border border-border"
        >
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
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <dt className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('pulse.label.plan')}
            </dt>
            <dd className="mt-0.5 text-sm font-medium">{planStatusLabel}</dd>
          </div>
          <div>
            <dt className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('pulse.label.load')}
            </dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums">
              {t('pulse.loadLine', {
                credits,
                min: creditsMin,
                max: creditsMax,
              })}
            </dd>
          </div>
          <div>
            <dt className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('pulse.label.degree')}
            </dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums">
              {t('pulse.degree', { share: earnedShare })}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {t(`pulse.planLine.${planStatus}`, {
              defaultValue: planStatusLabel,
            })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              to={planHref}
            >
              {t('pulse.openPlan')}
            </Link>
            <Link
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              to={recordHref}
            >
              {t('pulse.openRecord')}
            </Link>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

PulseStrip.displayName = 'PulseStrip';
