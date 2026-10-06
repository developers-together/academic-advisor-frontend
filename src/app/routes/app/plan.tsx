import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { CommentThread } from '@/components/domain/comment-thread';
import { StaleSisBanner } from '@/components/domain/stale-sis-banner';
import { ContentLayout } from '@/components/layouts';
import { ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from '@/components/ui/link';
import { SkeletonCard } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { usePlan } from '@/features/plan/api/get-plan';
import { usePlanComments } from '@/features/plan/api/get-plan-comments';
import { useSeenPlan } from '@/features/plan/api/seen-plan';
import { useWithdrawPlan } from '@/features/plan/api/withdraw-plan';
import { PlanDocument } from '@/features/plan/components/plan-document';
import { PlanStateActions } from '@/features/plan/components/plan-state-actions';
import { useDiscardPlan } from '@/features/plan-builder/api/discard-plan';
import {
  parseSubmitFailure,
  type SubmitFailure,
} from '@/features/plan-builder/api/submit-failure';
import { useSubmitPlan } from '@/features/plan-builder/api/submit-plan';
import { ValidationPanel } from '@/features/plan-builder/components/validation-panel';
import { useAcademicRecord } from '@/lib/api/academic-record';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';

const lineId = (courseCode: string) =>
  `plan-line-${encodeURIComponent(courseCode)}`;

export default function PlanRoute() {
  const { t } = useTranslation('plan');
  const navigate = useNavigate();
  const planQuery = usePlan();
  const academicRecord = useAcademicRecord();
  const commentsQuery = usePlanComments(planQuery.data?.id ?? null);
  const submitPlanMutation = useSubmitPlan();
  const withdrawPlanMutation = useWithdrawPlan();
  const discardPlanMutation = useDiscardPlan();
  const seenPlanMutation = useSeenPlan();

  const [failure, setFailure] = useState<SubmitFailure | null>(null);
  const [windowClosed, setWindowClosed] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState<{
    requestId: string | null;
  } | null>(null);

  const plan = planQuery.data;

  const clearResults = () => {
    setFailure(null);
    setWindowClosed(false);
    setServiceUnavailable(null);
  };

  const handleSubmit = () => {
    submitPlanMutation.mutate(undefined, {
      onSuccess: () => clearResults(),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 422) {
          const parsed = parseSubmitFailure(error);
          setWindowClosed(parsed.windowClosed);
          setFailure(parsed.total > 0 ? parsed : null);
          setServiceUnavailable(null);
          return;
        }
        setFailure(null);
        setWindowClosed(false);
        setServiceUnavailable({
          requestId: error instanceof ApiError ? error.requestId : null,
        });
      },
    });
  };

  const jumpToLine = (courseCode: string) => {
    const line = document.getElementById(lineId(courseCode));
    line?.scrollIntoView({ block: 'center' });
    line?.focus();
  };

  return (
    <ContentLayout
      title={t('myPlan.title')}
      context={plan ? t('termContext', { term: plan.term_code }) : undefined}
      actions={
        plan && (
          <PlanStateActions
            plan={plan}
            canSubmit={plan.courses.length > 0}
            submitBlockedCount={failure?.total ?? 0}
            submitting={submitPlanMutation.isPending}
            withdrawPending={withdrawPlanMutation.isPending}
            discardPending={discardPlanMutation.isPending}
            seenPending={seenPlanMutation.isPending}
            windowClosed={windowClosed}
            serviceUnavailable={serviceUnavailable}
            onSubmit={handleSubmit}
            onWithdraw={() =>
              withdrawPlanMutation.mutate(undefined, {
                onSuccess: () => clearResults(),
              })
            }
            onDiscard={() =>
              discardPlanMutation.mutate(undefined, {
                onSuccess: () => clearResults(),
              })
            }
            onSeen={() => seenPlanMutation.mutate()}
          />
        )
      }
    >
      <div aria-busy={planQuery.isPending} className="space-y-4">
        {planQuery.isPending && <SkeletonCard className="max-w-2xl" />}

        {planQuery.isError &&
          planQuery.error instanceof ApiError &&
          planQuery.error.status !== 404 &&
          planQuery.error.status !== 403 && (
            <ErrorState
              onRetry={() => void planQuery.refetch()}
              requestId={planQuery.error.requestId}
            />
          )}

        {planQuery.isError &&
          planQuery.error instanceof ApiError &&
          planQuery.error.status === 403 && (
            <PermissionDenied audience="student" />
          )}

        {planQuery.isError &&
          planQuery.error instanceof ApiError &&
          planQuery.error.status === 404 && (
            <EmptyState
              className="max-w-2xl"
              title={t('myPlan.empty.title')}
              description={t('myPlan.empty.body')}
              action={{
                label: t('myPlan.empty.action'),
                onClick: () => navigate(paths.app.builder.getHref()),
              }}
            />
          )}

        {plan && (
          <>
            {academicRecord.data && (
              <StaleSisBanner
                className="max-w-2xl"
                staleness={academicRecord.data.staleness}
                lastSyncedAt={academicRecord.data.last_synced_at}
                onRetry={() => void academicRecord.refetch()}
                isRetrying={academicRecord.isRefetching}
              />
            )}

            {failure && failure.total > 0 && (
              <div className="max-w-2xl space-y-2">
                <ValidationPanel
                  warnings={plan.warnings}
                  failure={failure}
                  onJumpToLine={jumpToLine}
                />
                <p className="text-sm text-muted-foreground">
                  {t('myPlan.submitFailed.body')}
                </p>
                <Link to="/app/builder">
                  {t('myPlan.submitFailed.editAction')}
                </Link>
              </div>
            )}

            <PlanDocument plan={plan} lineErrors={failure?.lineErrors} />

            {commentsQuery.isError ? (
              <ErrorState
                compact
                onRetry={() => void commentsQuery.refetch()}
                requestId={
                  commentsQuery.error instanceof ApiError
                    ? commentsQuery.error.requestId
                    : null
                }
              />
            ) : (
              !commentsQuery.isPending && (
                <CommentThread
                  className="max-w-2xl"
                  comments={commentsQuery.data ?? []}
                  unreadAfter={
                    plan.status === 'returned' ? plan.decided_at : null
                  }
                  title={t('myPlan.comments.title')}
                  emptyText={t('myPlan.comments.empty')}
                />
              )
            )}
          </>
        )}
      </div>
    </ContentLayout>
  );
}
