import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { QueueTable } from '@/components/domain/queue-table';
import { ReviewDrawer } from '@/components/domain/review-drawer';
import { ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useMeetingRequests } from '@/features/advisor-meetings/api/get-meeting-requests';
import { InviteStudentDialog } from '@/features/advisor-meetings/components/invite-student-dialog';
import {
  useAddPlanComment,
  useApproveReviewPlan,
  usePlanComments,
  useReviewPlan,
  useReturnReviewPlan,
} from '@/lib/api/advisor-plan-review';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';
import type { AdvisorCaseloadStudent } from '@/types/domain';

import { useAdvisorQueue } from '../api/get-advisor-queue';

export type QueueDocumentProps = {
  caseload: AdvisorCaseloadStudent[];
};

export const QueueDocument = ({ caseload }: QueueDocumentProps) => {
  const { t } = useTranslation('advisor');
  const queryClient = useQueryClient();

  const queueQuery = useAdvisorQueue();
  const meetingsQuery = useMeetingRequests();

  const [activeId, setActiveId] = useState<number | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [approveGate, setApproveGate] = useState<string[] | null>(null);
  const [approveUnavailable, setApproveUnavailable] = useState<{
    requestId: string | null;
  } | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);

  const planQuery = useReviewPlan(activeId);
  const commentsQuery = usePlanComments(activeId);
  const addComment = useAddPlanComment(activeId ?? 0);
  const approveMutation = useApproveReviewPlan(activeId);
  const returnMutation = useReturnReviewPlan();

  useEffect(() => {
    if (planQuery.data) {
      void queryClient.invalidateQueries({ queryKey: ['advisor', 'queue'] });
    }
  }, [planQuery.data, queryClient]);

  const closeDrawer = () => {
    const rowId = activeId !== null ? `queue-row-${activeId}` : null;
    setActiveId(null);
    if (rowId) {
      window.setTimeout(() => {
        document.getElementById(rowId)?.focus();
      }, 0);
    }
  };

  const handleApprove = () => {
    setApproveGate(null);
    setApproveUnavailable(null);
    approveMutation.mutate(undefined, {
      onSuccess: () => closeDrawer(),
      onError: (error) => {
        if (!(error instanceof ApiError)) {
          return;
        }
        if (error.status === 422) {
          setApproveGate(Object.values(error.fields).flat());
        } else if (error.status === 503) {
          setApproveUnavailable({ requestId: error.requestId });
        }
      },
    });
  };

  const handleReturn = (reason: string) => {
    setReturnError(null);
    if (activeId === null) {
      return;
    }
    returnMutation.mutate(
      { planId: activeId, reason },
      {
        onSuccess: () => closeDrawer(),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 422) {
            setReturnError(error.fields['reason']?.[0] ?? error.message);
          }
        },
      },
    );
  };

  if (queueQuery.isPending) {
    return (
      <div aria-busy="true" className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (queueQuery.isError) {
    if (
      queueQuery.error instanceof ApiError &&
      queueQuery.error.status === 403
    ) {
      return <PermissionDenied audience="advisor" />;
    }
    return (
      <ErrorState
        onRetry={() => void queueQuery.refetch()}
        requestId={
          queueQuery.error instanceof ApiError
            ? queueQuery.error.requestId
            : null
        }
      />
    );
  }

  const items = queueQuery.data;
  if (!items || items.length === 0) {
    return (
      <EmptyState
        compact
        title={t('queue.empty.title')}
        description={t('queue.empty.body')}
        className="max-w-xl"
      />
    );
  }

  const activeItem = items.find((item) => item.id === activeId) ?? null;
  const cgpaForActive = activeItem
    ? (caseload.find((student) => student.id === activeItem.student.id)?.cgpa ??
      null)
    : null;

  return (
    <>
      <QueueTable
        items={items}
        activeId={activeId}
        onActivate={(item) => {
          setApproveGate(null);
          setApproveUnavailable(null);
          setReturnError(null);
          setActiveId(item.id);
        }}
      />
      {activeItem && (
        <ReviewDrawer
          open
          onOpenChange={(next) => {
            if (!next) {
              closeDrawer();
            }
          }}
          student={activeItem.student}
          cgpa={cgpaForActive}
          plan={planQuery.data ?? null}
          planPending={planQuery.isPending}
          planFailed={planQuery.isError}
          onRetryPlan={() => void planQuery.refetch()}
          meeting={
            meetingsQuery.data?.find(
              (meeting) => meeting.student.id === activeItem.student.id,
            ) ?? null
          }
          onRequestMeeting={() => setInviteOpen(true)}
          comments={commentsQuery.data ?? []}
          commentPending={addComment.isPending}
          onAddComment={(body) => addComment.mutateAsync(body)}
          approvePending={approveMutation.isPending}
          approveGate={approveGate}
          approveUnavailable={approveUnavailable}
          onApprove={handleApprove}
          returnPending={returnMutation.isPending}
          returnError={returnError}
          onReturn={handleReturn}
        />
      )}
      {activeItem && inviteOpen && (
        <InviteStudentDialog
          caseload={caseload}
          student={activeItem.student}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </>
  );
};
