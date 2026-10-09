import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/ui/kpi-card';
import { paths } from '@/config/paths';
import { useGovernanceDashboard } from '@/features/governance/api/get-governance-dashboard';
import { GovernanceChildGrid } from '@/features/governance/components/governance-child-grid';
import { GovernanceTableSkeleton } from '@/features/governance/components/governance-children-table';
import { GovernancePage } from '@/features/governance/components/governance-page';
import { GovernanceQueryStates } from '@/features/governance/components/governance-query-states';
import type { GovernanceMetrics } from '@/types/domain';

const VpOverviewCards = ({ metrics }: { metrics: GovernanceMetrics }) => {
  const { t } = useTranslation('governance');
  const rate = metrics.completion_rate;
  const hours = metrics.median_decision_hours;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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
      <KpiCard
        label={t('kpi.median')}
        value={hours === null ? '—' : t('kpi.medianHours', { value: hours })}
        context={hours === null ? t('kpi.medianNone') : t('kpi.medianContext')}
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
  );
};

export default function VpOverviewRoute() {
  const { t } = useTranslation('governance');
  const navigate = useNavigate();
  const dashboard = useGovernanceDashboard();

  return (
    <GovernancePage
      audience="vp"
      title={t('vpOverview.title')}
      context={t('vpOverview.context')}
    >
      <GovernanceQueryStates
        query={dashboard}
        audience="vp"
        emptyTitle={t('vpOverview.emptyTitle')}
        emptyBody={t('vpOverview.emptyBody')}
        skeleton={<GovernanceTableSkeleton />}
      >
        {(root) => (
          <div className="space-y-6">
            <VpOverviewCards metrics={root.metrics} />
            {root.children.length > 0 && (
              <GovernanceChildGrid
                node={root}
                buildHref={(code) => paths.vp.drilldown.getHref(code)}
              />
            )}
            <div>
              <Button onClick={() => navigate(paths.vp.faculties.getHref())}>
                {t('vpOverview.compareCta')}
              </Button>
            </div>
          </div>
        )}
      </GovernanceQueryStates>
    </GovernancePage>
  );
}
