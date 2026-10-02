import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { Banner, ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useCreatePlan } from '@/features/plan/api/create-plan';
import { usePlan } from '@/features/plan/api/get-plan';
import { PlanDocument } from '@/features/plan/components/plan-document';
import { BuilderDocument } from '@/features/plan-builder/components/builder-document';
import { ApiError } from '@/lib/api-error';
import { useUser } from '@/lib/auth';

export default function BuilderRoute() {
  const { t } = useTranslation('plan');
  const user = useUser();
  const planQuery = usePlan();
  const createPlan = useCreatePlan();
  const [startConflict, setStartConflict] = useState(false);

  const plan = planQuery.data;
  const notDraft = plan && plan.status !== 'draft';

  const startPlan = () => {
    createPlan.mutate(undefined, {
      onSuccess: () => setStartConflict(false),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void planQuery.refetch();
          setStartConflict(true);
        }
      },
    });
  };

  return (
    <ContentLayout title={t('builder.title')}>
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
            <>
              {(startConflict || !user.data?.advisor_id) && (
                <Banner variant="warning" className="max-w-2xl">
                  {t('noAdvisor.banner')}
                </Banner>
              )}
              <EmptyState
                className="max-w-2xl"
                title={t('dashboard.empty.title')}
                description={
                  user.data?.advisor_id
                    ? t('dashboard.empty.body')
                    : t('noAdvisor.builderEntry')
                }
                action={
                  user.data?.advisor_id
                    ? {
                        label: t('builder.startPlan'),
                        onClick: startPlan,
                        loading: createPlan.isPending,
                      }
                    : undefined
                }
              />
            </>
          )}

        {plan && (
          <>
            {notDraft && (
              <Banner variant="warning" className="max-w-2xl">
                {t('builder.notDraft', {
                  state: t(`common:planStates.${plan.status}`),
                })}
              </Banner>
            )}
            {notDraft ? (
              <PlanDocument plan={plan} />
            ) : (
              <BuilderDocument plan={plan} />
            )}
          </>
        )}
      </div>
    </ContentLayout>
  );
}
