import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { useUser } from '@/lib/auth';

import { useGovernanceDashboard } from '../api/get-governance-dashboard';

import { GovernanceTableSkeleton } from './governance-children-table';
import { GovernanceQueryStates } from './governance-query-states';
import { TrendChart } from './trend-chart';

export const DeanAnalytics = () => {
  const { t } = useTranslation('governance');
  const user = useUser();
  const faculty = user.data?.faculty ?? null;
  const dashboard = useGovernanceDashboard(faculty !== null);

  if (faculty === null) {
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
    <GovernanceQueryStates
      query={dashboard}
      audience="dean"
      emptyTitle={t('trends.empty.title')}
      emptyBody={t('trends.empty.body')}
      skeleton={<GovernanceTableSkeleton />}
    >
      {(scoped) => (
        <TrendChart
          className="max-w-3xl"
          title={t('trends.dean.title')}
          question={t('trends.dean.question')}
          series={[
            {
              key: 'completion',
              label: t('trends.series.completion'),
              points: scoped.trends.map((point) => ({
                term_code: point.term_code,
                value: point.completion_rate,
              })),
            },
          ]}
        />
      )}
    </GovernanceQueryStates>
  );
};
