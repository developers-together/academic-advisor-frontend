import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotifications } from '@/components/ui/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiError } from '@/lib/api-error';
import { formatDate } from '@/lib/i18n/format';
import type { AssignmentRecord } from '@/types/domain';

import { useCancelPendingAssignment } from '../api/cancel-pending-assignment';
import { usePendingAssignments } from '../api/get-pending-assignments';

const COLUMN_KEYS = ['studentId', 'advisor', 'created'] as const;

export const PendingAssignmentsCard = () => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const pendingQuery = usePendingAssignments();
  const cancelAssignment = useCancelPendingAssignment();
  const [cancelTarget, setCancelTarget] = useState<AssignmentRecord | null>(
    null,
  );

  const confirmCancel = () => {
    if (!cancelTarget) {
      return;
    }
    cancelAssignment.mutate(cancelTarget.id, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: t('assignments.pending.cancelledToast'),
        });
      },
      onSettled: () => setCancelTarget(null),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('assignments.pending.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('assignments.pending.helper')}
        </p>
      </CardHeader>
      <CardBody>
        {pendingQuery.isPending ? (
          <div aria-busy="true" className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : pendingQuery.isError ? (
          <ErrorState
            compact
            onRetry={() => void pendingQuery.refetch()}
            requestId={
              pendingQuery.error instanceof ApiError
                ? pendingQuery.error.requestId
                : null
            }
          />
        ) : pendingQuery.data.length === 0 ? (
          <EmptyState
            compact
            title={t('assignments.pending.empty.title')}
            description={t('assignments.pending.empty.body')}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <TableElement>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {COLUMN_KEYS.map((key) => (
                    <TableHead
                      key={key}
                      className="bg-card px-3 py-2 text-2xs font-medium tracking-wide uppercase"
                    >
                      {t(`assignments.pending.columns.${key}`)}
                    </TableHead>
                  ))}
                  <TableHead className="bg-card px-3 py-2 text-2xs font-medium tracking-wide uppercase">
                    <span className="sr-only">
                      {t('common:actions.moreActions')}
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingQuery.data.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="px-3 py-2">
                      <span className="bidi-code text-sm font-medium tabular-nums">
                        {assignment.student_id}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {assignment.advisor.name}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-muted-foreground tabular-nums">
                      {formatDate(assignment.created_at)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelTarget(assignment)}
                      >
                        {t('assignments.pending.cancel')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableElement>
          </div>
        )}
      </CardBody>

      <ConfirmDialog
        open={cancelTarget !== null}
        title={t('assignments.pending.cancelDialog.title')}
        body={t('assignments.pending.cancelDialog.body', {
          studentId: cancelTarget?.student_id ?? '',
        })}
        confirmLabel={t('assignments.pending.cancelDialog.confirm')}
        destructive
        pending={cancelAssignment.isPending}
        onCancel={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
      />
    </Card>
  );
};
