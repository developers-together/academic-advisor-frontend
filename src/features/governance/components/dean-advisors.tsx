import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import { useUser } from '@/lib/auth';

import { useGovernanceDashboard } from '../api/get-governance-dashboard';
import { collectAdvisors } from '../utils/governance-tree';

import { AdvisorWorkloadTable } from './advisor-workload-table';
import { GovernanceTableSkeleton } from './governance-children-table';
import { GovernanceQueryStates } from './governance-query-states';

export const DeanAdvisors = () => {
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
      emptyTitle={t('advisors.empty.title')}
      emptyBody={t('advisors.empty.body')}
      skeleton={<GovernanceTableSkeleton />}
    >
      {(scoped) => {
        const advisors = collectAdvisors(scoped);
        if (advisors.length === 0) {
          return (
            <EmptyState
              compact
              className="max-w-xl"
              title={t('advisors.empty.title')}
              description={t('advisors.empty.body')}
            />
          );
        }
        return (
          <AdvisorWorkloadTable advisors={advisors} className="max-w-5xl" />
        );
      }}
    </GovernanceQueryStates>
  );
};
