import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { usePlan } from '@/features/plan/api/get-plan';
import { PlanDocument } from '@/features/plan/components/plan-document';
import { ApiError } from '@/lib/api-error';

export default function PlanRoute() {
  const { t } = useTranslation('plan');
  const planQuery = usePlan();

  return (
    <ContentLayout title={t('myPlan.title')}>
      <div aria-busy={planQuery.isPending} className="space-y-4">
        {planQuery.isPending && <SkeletonCard className="max-w-2xl" />}

        {planQuery.isError &&
          planQuery.error instanceof ApiError &&
          planQuery.error.status !== 404 && (
            <ErrorState
              onRetry={() => void planQuery.refetch()}
              requestId={planQuery.error.requestId}
            />
          )}

        {planQuery.isError &&
          planQuery.error instanceof ApiError &&
          planQuery.error.status === 404 && (
            <EmptyState
              className="max-w-2xl"
              title={t('myPlan.empty.title')}
              description={t('myPlan.empty.body')}
            />
          )}

        {planQuery.data && <PlanDocument plan={planQuery.data} />}
      </div>
    </ContentLayout>
  );
}
