import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ReviewDrawer } from '@/components/domain/review-drawer';
import { ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  useAddPlanComment,
  useApproveReviewPlan,
  usePlanComments,
  useReviewPlan,
  useReturnReviewPlan,
} from '@/lib/api/advisor-plan-review';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';
import type { StudentSummary } from '@/types/domain';

import { useCaseload } from '../api/get-caseload';

import { CaseloadTable } from './caseload-table';

const SEARCH_DEBOUNCE_MS = 300;

export type ExplorerDocumentProps = {
  onRequestMeeting?: (student: StudentSummary) => void;
};

export const ExplorerDocument = ({
  onRequestMeeting,
}: ExplorerDocumentProps) => {
  const { t } = useTranslation('advisor');
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const caseloadQuery = useCaseload(debouncedSearch);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [approveGate, setApproveGate] = useState<string[] | null>(null);
  const [approveUnavailable, setApproveUnavailable] = useState<{
    requestId: string | null;
  } | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);

  const activeStudent =
    caseloadQuery.data?.find((student) => student.id === activeId) ?? null;
  const planQuery = useReviewPlan(activeStudent?.plan_id ?? null);
  const commentsQuery = usePlanComments(activeStudent?.plan_id ?? null);
  const addComment = useAddPlanComment(activeStudent?.plan_id ?? 0);
  const approveMutation = useApproveReviewPlan(activeStudent?.plan_id ?? null);
  const returnMutation = useReturnReviewPlan();

  useEffect(() => {
    if (planQuery.data) {
      void queryClient.invalidateQueries({
        queryKey: ['advisor', 'caseload'],
      });
    }
  }, [planQuery.data, queryClient]);

  const closeDrawer = () => {
    const rowId = activeId !== null ? `explorer-row-${activeId}` : null;
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
    if (activeStudent?.plan_id === null || activeStudent === null) {
      return;
    }
    returnMutation.mutate(
      { planId: activeStudent.plan_id, reason },
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

  if (caseloadQuery.isPending) {
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

  if (caseloadQuery.isError) {
    if (
      caseloadQuery.error instanceof ApiError &&
      caseloadQuery.error.status === 403
    ) {
      return <PermissionDenied audience="advisor" />;
    }
    return (
      <ErrorState
        onRetry={() => void caseloadQuery.refetch()}
        requestId={
          caseloadQuery.error instanceof ApiError
            ? caseloadQuery.error.requestId
            : null
        }
      />
    );
  }

  const students = caseloadQuery.data ?? [];

  if (students.length === 0) {
    if (debouncedSearch) {
      return (
        <EmptyState
          compact
          title={t('students.emptySearch.title', { search: debouncedSearch })}
          description={t('students.emptySearch.body')}
          action={{
            label: t('actions.clearSearch', { ns: 'common' }),
            onClick: () => setSearch(''),
          }}
          className="max-w-xl"
        />
      );
    }
    return (
      <EmptyState
        compact
        title={t('students.emptyCaseload.title')}
        description={t('students.emptyCaseload.body')}
        className="max-w-xl"
      />
    );
  }

  const plan = planQuery.data ?? null;
  const planReviewable =
    plan !== null &&
    (plan.status === 'submitted' || plan.status === 'under_review');

  return (
    <>
      <CaseloadTable
        students={students}
        search={search}
        onSearchChange={setSearch}
        activeId={activeId}
        onActivate={(student) => {
          setApproveGate(null);
          setApproveUnavailable(null);
          setReturnError(null);
          setActiveId(student.id);
        }}
      />
      {activeStudent && (
        <ReviewDrawer
          open
          onOpenChange={(next) => {
            if (!next) {
              closeDrawer();
            }
          }}
          student={activeStudent}
          cgpa={activeStudent.cgpa}
          plan={activeStudent.plan_id === null ? null : plan}
          planPending={activeStudent.plan_id !== null && planQuery.isPending}
          planFailed={planQuery.isError}
          onRetryPlan={() => void planQuery.refetch()}
          planUnavailable={
            activeStudent.plan_id === null
              ? t('students.noPlan', { name: activeStudent.name })
              : null
          }
          planReviewable={planReviewable}
          onRequestMeeting={
            onRequestMeeting
              ? () =>
                  onRequestMeeting({
                    id: activeStudent.id,
                    name: activeStudent.name,
                    student_id: activeStudent.student_id,
                  })
              : undefined
          }
          comments={commentsQuery.data ?? []}
          commentPending={addComment.isPending}
          onAddComment={(body) => addComment.mutate(body)}
          approvePending={approveMutation.isPending}
          approveGate={approveGate}
          approveUnavailable={approveUnavailable}
          onApprove={handleApprove}
          returnPending={returnMutation.isPending}
          returnError={returnError}
          onReturn={handleReturn}
        />
      )}
    </>
  );
};
