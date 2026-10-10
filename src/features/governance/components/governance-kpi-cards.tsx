import { useTranslation } from 'react-i18next';

import { KpiCard } from '@/components/ui/kpi-card';
import type { GovernanceMetrics } from '@/types/domain';

const CompletionCard = ({
  metrics,
  t,
}: {
  metrics: GovernanceMetrics;
  t: (key: string) => string;
}) => {
  const rate = metrics.completion_rate;
  return (
    <KpiCard
      label={t('kpi.completion')}
      value={rate === null ? '—' : `${rate}%`}
      context={
        rate === null
          ? t('kpi.completionNone')
          : metrics.completion_is_final
            ? t('kpi.completionFinal')
            : t('kpi.completionLive')
      }
    />
  );
};

const MedianCard = ({
  metrics,
  t,
}: {
  metrics: GovernanceMetrics;
  t: (key: string, values?: Record<string, unknown>) => string;
}) => {
  const hours = metrics.median_decision_hours;
  return (
    <KpiCard
      label={t('kpi.median')}
      value={hours === null ? '—' : t('kpi.medianHours', { value: hours })}
      context={hours === null ? t('kpi.medianNone') : t('kpi.medianContext')}
    />
  );
};

export const GovernanceKpiCards = ({
  metrics,
}: {
  metrics: GovernanceMetrics;
}) => {
  const { t } = useTranslation('governance');

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <CompletionCard metrics={metrics} t={t} />
      <MedianCard metrics={metrics} t={t} />
      <KpiCard
        label={t('kpi.aging')}
        value={metrics.aging_count}
        context={t('kpi.agingContext')}
      />
      <KpiCard
        label={t('kpi.caseload')}
        value={metrics.caseload}
        context={t('kpi.caseloadContext')}
      />
      <KpiCard
        label={t('kpi.approved')}
        value={metrics.approved}
        context={t('kpi.approvedContext')}
      />
    </div>
  );
};
