import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router';

import { Banner } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { KpiCard } from '@/components/ui/kpi-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/lib/auth';
import type {
  GovernanceGrouping,
  GovernanceMetrics,
  GovernanceNode,
} from '@/types/domain';

import { useGovernanceDashboard } from '../api/get-governance-dashboard';
import { governanceNodeName, scopedNodeOf } from '../utils/governance-tree';

import { FunnelChart } from './funnel-chart';
import { GovernanceChildGrid } from './governance-child-grid';
import { GovernanceQueryStates } from './governance-query-states';

const bottleneckOf = (node: GovernanceNode): GovernanceNode | null => {
  const rated = node.children.filter(
    (child) => child.metrics.completion_rate !== null,
  );
  if (rated.length === 0) {
    return null;
  }
  return rated.reduce((worst, child) =>
    (child.metrics.completion_rate ?? 100) <
    (worst.metrics.completion_rate ?? 100)
      ? child
      : worst,
  );
};

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

const kpiCardsOf = (
  metrics: GovernanceMetrics,
  t: (key: string, values?: Record<string, unknown>) => string,
) => [
  <CompletionCard key="completion" metrics={metrics} t={t} />,
  <MedianCard key="median" metrics={metrics} t={t} />,
  <KpiCard
    key="aging"
    label={t('kpi.aging')}
    value={metrics.aging_count}
    context={t('kpi.agingContext')}
  />,
  <KpiCard
    key="caseload"
    label={t('kpi.caseload')}
    value={metrics.caseload}
    context={t('kpi.caseloadContext')}
  />,
  <KpiCard
    key="approved"
    label={t('kpi.approved')}
    value={metrics.approved}
    context={t('kpi.approvedContext')}
  />,
];

export const DeanOverview = () => {
  const { t, i18n } = useTranslation('governance');
  const user = useUser();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [grouping, setGrouping] = useState<GovernanceGrouping>('units');
  const faculty = user.data?.faculty ?? null;
  const hasFaculty = faculty !== null;
  const dashboard = useGovernanceDashboard(
    hasFaculty,
    grouping === 'advisor' ? 'advisor' : undefined,
  );

  if (!hasFaculty) {
    return (
      <EmptyState
        compact
        title={t('noFaculty.title')}
        description={t('noFaculty.body')}
        className="max-w-xl"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={grouping}
        onValueChange={(value) => setGrouping(value as GovernanceGrouping)}
      >
        <TabsList aria-label={t('view.label')}>
          <TabsTrigger value="units">{t('view.units')}</TabsTrigger>
          <TabsTrigger value="advisor">{t('view.advisor')}</TabsTrigger>
        </TabsList>
      </Tabs>
      <GovernanceQueryStates
        query={dashboard}
        audience="dean"
        emptyTitle={t('dean.empty.title')}
        emptyBody={t('dean.empty.body')}
      >
        {(root) => {
          const scoped = scopedNodeOf(root, searchParams.get('node'));
          const bottleneck = bottleneckOf(scoped);
          return (
            <div className="space-y-6">
              {bottleneck && (
                <Banner variant="warning" title={t('dean.bottleneck.title')}>
                  <p>
                    {t('dean.bottleneck.line', {
                      name: governanceNodeName(
                        bottleneck,
                        i18n.language,
                        t(`levels.${bottleneck.level}`),
                      ),
                      rate: bottleneck.metrics.completion_rate,
                    })}
                  </p>
                </Banner>
              )}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {kpiCardsOf(scoped.metrics, t)}
              </div>
              <FunnelChart
                funnel={scoped.metrics.funnel}
                term={scoped.term_code}
              />
              <GovernanceChildGrid
                node={scoped}
                buildHref={(code) => `${location.pathname}?node=${code}`}
              />
            </div>
          );
        }}
      </GovernanceQueryStates>
    </div>
  );
};
