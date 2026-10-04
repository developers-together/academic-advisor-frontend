import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';

import { useGovernanceDashboard } from '../api/get-governance-dashboard';

import {
  GovernanceChildrenTable,
  GovernanceTableSkeleton,
} from './governance-children-table';
import { GovernanceQueryStates } from './governance-query-states';

const VpScorecardSkeleton = () => (
  <div aria-busy="true" className="space-y-6">
    <GovernanceTableSkeleton />
    <div className="space-y-3">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
    </div>
  </div>
);

export const VpScorecard = () => {
  const { t } = useTranslation('governance');
  const navigate = useNavigate();
  const dashboard = useGovernanceDashboard();

  return (
    <GovernanceQueryStates
      query={dashboard}
      audience="vp"
      emptyTitle={t('vp.empty.title')}
      emptyBody={t('vp.empty.body')}
      skeleton={<VpScorecardSkeleton />}
    >
      {(root) => (
        <div className="space-y-6">
          <GovernanceChildrenTable
            parent={root}
            onOpen={(code) => navigate(paths.vp.drilldown.getHref(code))}
          />
        </div>
      )}
    </GovernanceQueryStates>
  );
};
