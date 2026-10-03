import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { paths } from '@/config/paths';

import { useGovernanceDashboard } from '../api/get-governance-dashboard';

import {
  GovernanceChildrenTable,
  GovernanceTableSkeleton,
} from './governance-children-table';
import { GovernanceQueryStates } from './governance-query-states';

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
      skeleton={<GovernanceTableSkeleton />}
    >
      {(root) => (
        <GovernanceChildrenTable
          parent={root}
          onOpen={(code) => navigate(paths.vp.drilldown.getHref(code))}
        />
      )}
    </GovernanceQueryStates>
  );
};
