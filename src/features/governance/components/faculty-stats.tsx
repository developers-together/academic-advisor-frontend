import { useTranslation } from 'react-i18next';

import { KpiCard } from '@/components/ui/kpi-card';
import type { GovernanceNode } from '@/types/domain';

import { rateBand, rateBandClasses } from '../utils/governance-tree';

export const FacultyStats = ({ faculty }: { faculty: GovernanceNode }) => {
  const { t, i18n } = useTranslation('governance');

  const name =
    (i18n.language.startsWith('ar')
      ? (faculty.name_ar ?? faculty.name_en)
      : (faculty.name_en ?? faculty.name_ar)) ??
    faculty.code ??
    t(`levels.${faculty.level}`);

  const metrics = faculty.metrics;
  const rate = metrics.completion_rate;
  const hours = metrics.median_decision_hours;
  const deans = faculty.deans ?? [];

  return (
    <section role="group" aria-label={name} className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-base leading-tight font-semibold">{name}</h2>
        <div className="flex items-baseline gap-2 text-sm">
          <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            {t('faculty.deans')}
          </span>
          {deans.length === 0 ? (
            <span className="text-muted-foreground">{t('faculty.noDean')}</span>
          ) : (
            <ul className="flex flex-wrap items-baseline gap-2">
              {deans.map((dean) => (
                <li key={dean.id} className="bidi-code font-medium">
                  {dean.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard
          label={t('kpi.completion')}
          value={
            rate === null ? (
              '—'
            ) : (
              <span
                className={`inline-block rounded-full px-2 py-0.5 ${
                  rateBandClasses[rateBand(rate)]
                }`}
              >
                {`${rate}%`}
              </span>
            )
          }
          context={
            rate === null
              ? t('kpi.completionNone')
              : metrics.completion_is_final
                ? t('kpi.completionFinal')
                : t('kpi.completionLive')
          }
        />
        <KpiCard
          label={t('kpi.median')}
          value={hours === null ? '—' : t('kpi.medianHours', { value: hours })}
          context={
            hours === null ? t('kpi.medianNone') : t('kpi.medianContext')
          }
        />
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
    </section>
  );
};
