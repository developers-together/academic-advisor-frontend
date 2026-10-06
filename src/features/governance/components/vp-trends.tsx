import { useTranslation } from 'react-i18next';

import { useGovernanceDashboard } from '../api/get-governance-dashboard';
import { governanceNodeName } from '../utils/governance-tree';

import { GovernanceTableSkeleton } from './governance-children-table';
import { GovernanceQueryStates } from './governance-query-states';
import { TrendChart } from './trend-chart';

export const VpTrends = () => {
  const { t, i18n } = useTranslation('governance');
  const dashboard = useGovernanceDashboard();

  return (
    <GovernanceQueryStates
      query={dashboard}
      audience="vp"
      emptyTitle={t('trends.empty.title')}
      emptyBody={t('trends.empty.body')}
      skeleton={<GovernanceTableSkeleton />}
    >
      {(root) => (
        <TrendChart
          className="max-w-4xl"
          title={t('trends.vp.title')}
          question={t('trends.vp.question')}
          series={root.children.map((faculty) => ({
            key: faculty.code ?? governanceNodeName(faculty, i18n.language, ''),
            label: governanceNodeName(
              faculty,
              i18n.language,
              t(`levels.${faculty.level}`),
            ),
            points: faculty.trends.map((point) => ({
              term_code: point.term_code,
              value: point.completion_rate,
            })),
          }))}
        />
      )}
    </GovernanceQueryStates>
  );
};
