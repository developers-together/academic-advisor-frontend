import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { Banner, ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { usePlan } from '@/features/plan/api/get-plan';
import { PlanDocument } from '@/features/plan/components/plan-document';
import { ApiError } from '@/lib/api-error';
import { useUser } from '@/lib/auth';

export default function BuilderRoute() {
  const { t } = useTranslation('plan');
  const user = useUser();
  const planQuery = usePlan();

  const notDraft = planQuery.data && planQuery.data.status !== 'draft';

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
              {!user.data?.advisor_id && (
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
              />
            </>
          )}

        {planQuery.data && (
          <>
            <Banner variant="info">{t('builder.validation.helper')}</Banner>
            {notDraft && (
              <Banner variant="warning">
                {t('builder.notDraft', {
                  state: t(`common:planStates.${planQuery.data.status}`),
                })}
              </Banner>
            )}
            <PlanDocument plan={planQuery.data} />
          </>
        )}
      </div>
    </ContentLayout>
  );
}
