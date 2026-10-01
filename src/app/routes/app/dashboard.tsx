import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { Banner, ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useCreatePlan } from '@/features/plan/api/create-plan';
import { usePlan } from '@/features/plan/api/get-plan';
import { PlanCard } from '@/features/plan/components/plan-card';
import { ApiError } from '@/lib/api-error';
import { useUser } from '@/lib/auth';

export default function DashboardRoute() {
  const { t } = useTranslation('plan');
  const user = useUser();
  const planQuery = usePlan();
  const createPlan = useCreatePlan();

  return (
    <ContentLayout
      title={t('dashboard.title')}
      context={
        planQuery.data?.term_code
          ? t('termContext', { term: planQuery.data.term_code })
          : undefined
      }
    >
      <div aria-busy={planQuery.isPending} className="space-y-4">
        {planQuery.isPending && <SkeletonCard className="max-w-xl" />}

        {planQuery.isError &&
          planQuery.error instanceof ApiError &&
          planQuery.error.status !== 404 && (
            <ErrorState
              onRetry={() => void planQuery.refetch()}
              requestId={planQuery.error.requestId}
            />
          )}

        {planQuery.data && (
          <>
            {!user.data?.advisor_id && (
              <Banner variant="warning">{t('noAdvisor.banner')}</Banner>
            )}
            <PlanCard plan={planQuery.data} />
          </>
        )}

        {planQuery.isError &&
          planQuery.error instanceof ApiError &&
          planQuery.error.status === 404 && (
            <EmptyState
              className="max-w-xl"
              title={t('dashboard.empty.title')}
              description={t('dashboard.empty.body')}
              action={{
                label: t('dashboard.empty.action'),
                loading: createPlan.isPending,
                onClick: () => {
                  createPlan.mutate();
                },
              }}
            />
          )}
      </div>
    </ContentLayout>
  );
}
