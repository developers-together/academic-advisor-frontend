import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Banner, ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { useCreatePlan } from '@/features/plan/api/create-plan';
import { usePlan } from '@/features/plan/api/get-plan';
import { PlanDocument } from '@/features/plan/components/plan-document';
import { readBuilderFailure } from '@/features/plan-builder/api/submit-failure';
import { BuilderDocument } from '@/features/plan-builder/components/builder-document';
import { ApiError } from '@/lib/api-error';
import { useUser } from '@/lib/auth';
import { PermissionDenied } from '@/lib/authorization';

export default function BuilderRoute() {
  const { t } = useTranslation('plan');
  const user = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const planQuery = usePlan();
  const createPlan = useCreatePlan();

  const plan = planQuery.isError ? undefined : planQuery.data;
  const discarded = plan?.status === 'discarded';
  const notDraft = plan && plan.status !== 'draft' && !discarded;
  const entryFailure = readBuilderFailure(location.state, plan?.id);
  useEffect(() => {
    if (entryFailure)
      navigate(location.pathname + location.search + location.hash, {
        replace: true,
        state: null,
      });
  }, [
    entryFailure,
    navigate,
    location.pathname,
    location.search,
    location.hash,
  ]);

  const startPlan = () => {
    createPlan.mutate(undefined, {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void planQuery.refetch();
        }
      },
    });
  };

  return (
    <ContentLayout title={t('builder.title')}>
      <div aria-busy={planQuery.isPending} className="space-y-4">
        {planQuery.isPending && <SkeletonCard className="max-w-2xl" />}

        {planQuery.isError &&
          !(
            planQuery.error instanceof ApiError &&
            [404, 403].includes(planQuery.error.status)
          ) && (
            <ErrorState
              pending={planQuery.isFetching}
              onRetry={() => void planQuery.refetch()}
              requestId={
                planQuery.error instanceof ApiError
                  ? planQuery.error.requestId
                  : null
              }
            />
          )}

        {planQuery.error instanceof ApiError &&
          planQuery.error.status === 403 && (
            <PermissionDenied
              audience="student"
              message={t('registration.accessDenied')}
              backTo={{
                label: 'permissionDenied.back',
                href: paths.app.root.getHref(),
              }}
            />
          )}
        {(discarded ||
          (planQuery.error instanceof ApiError &&
            planQuery.error.status === 404)) && (
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

        {createPlan.isError && (!plan || discarded) && (
          <Banner variant="destructive" className="max-w-2xl">
            {createPlan.error instanceof ApiError
              ? createPlan.error.message
              : t('common:errors.saveFailed')}
          </Banner>
        )}

        {plan && !discarded && (
          <>
            {notDraft && (
              <Banner variant="warning" className="max-w-2xl">
                {t('builder.notDraft', {
                  state: t(`common:planStates.${plan.status}`),
                })}
              </Banner>
            )}
            {notDraft ? (
              <div className="space-y-4">
                <Button asChild variant="outline">
                  <Link to={paths.app.plan.getHref()}>
                    {t('builder.viewPlan')}
                  </Link>
                </Button>
                <PlanDocument plan={plan} />
              </div>
            ) : (
              <BuilderDocument
                key={plan.id}
                plan={plan}
                initialFailure={entryFailure}
              />
            )}
          </>
        )}
      </div>
    </ContentLayout>
  );
}
