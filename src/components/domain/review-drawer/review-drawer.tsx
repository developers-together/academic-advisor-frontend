import { zodResolver } from '@hookform/resolvers/zod';
import { CircleX, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { CommentThread } from '@/components/domain/comment-thread';
import { PlanStateChip } from '@/components/domain/plan-state-chip';
import { Banner, ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { EmptyState } from '@/components/ui/empty-state';
import { Textarea } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusChip } from '@/components/ui/status-chip';
import { formatDateTime, formatNumber } from '@/lib/i18n/format';
import type {
  MeetingRequest,
  Plan,
  PlanComment,
  StudentSummary,
} from '@/types/domain';

export type ReviewDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentSummary;
  cgpa: number | null;
  plan: Plan | null;
  planPending: boolean;
  planFailed?: boolean;
  onRetryPlan?: () => void;
  planUnavailable?: string | null;
  planReviewable?: boolean;
  onRequestMeeting?: () => void;
  comments: PlanComment[];
  meeting?: MeetingRequest | null;
  commentPending?: boolean;
  onAddComment: (body: string) => void | Promise<unknown>;
  approvePending?: boolean;
  approveGate?: string[] | null;
  approveUnavailable?: { requestId: string | null } | null;
  onApprove: () => void;
  returnPending?: boolean;
  returnError?: string | null;
  onReturn: (reason: string) => void;
};

export const ReviewDrawer = ({
  open,
  onOpenChange,
  student,
  cgpa,
  plan,
  planPending,
  planFailed = false,
  onRetryPlan,
  planUnavailable = null,
  planReviewable = true,
  onRequestMeeting,
  comments,
  meeting = null,
  commentPending = false,
  onAddComment,
  approvePending = false,
  approveGate = null,
  approveUnavailable = null,
  onApprove,
  returnPending = false,
  returnError = null,
  onReturn,
}: ReviewDrawerProps) => {
  const { t } = useTranslation('advisor');

  const reasonSchema = useMemo(
    () =>
      z.object({
        reason: z
          .string()
          .trim()
          .min(1, {
            message: t('review.return.required', { name: student.name }),
          })
          .max(2000, { message: t('review.return.maxLength') }),
      }),
    [t, student.name],
  );

  const form = useForm({
    resolver: zodResolver(reasonSchema),
    mode: 'onBlur',
    defaultValues: { reason: '' },
  });
  const reason = form.watch('reason');
  const hasDraft = reason.trim().length > 0;

  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [returnConfirmOpen, setReturnConfirmOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const requestReturn = async () => {
    const valid = await form.trigger('reason');
    if (!valid) {
      form.setFocus('reason');
      return;
    }
    setReturnConfirmOpen(true);
  };

  const closeDialogsAndDrawer = () => {
    setApproveConfirmOpen(false);
    setReturnConfirmOpen(false);
    setDiscardOpen(false);
    form.reset({ reason: '' });
    onOpenChange(false);
  };

  const pending = planPending || approvePending || returnPending;
  const mergedReasonError = returnError
    ? { type: 'server', message: returnError }
    : form.formState.errors['reason'];

  const gateBlocked = planReviewable && (approveGate?.length ?? 0) > 0;

  useEffect(() => {
    if (open && gateBlocked) {
      document
        .getElementById('review-validation')
        ?.scrollIntoView?.({ block: 'center' });
    }
  }, [open, gateBlocked]);

  const drawerSide = document.documentElement.dir === 'rtl' ? 'left' : 'right';

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            if (hasDraft) {
              setDiscardOpen(true);
            } else {
              onOpenChange(false);
            }
          }
        }}
      >
        <DrawerContent side={drawerSide} className="p-0 sm:max-w-lg">
          <div className="flex h-full flex-col">
            <DrawerHeader className="border-b p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <DrawerTitle className="text-lg font-semibold">
                    {student.name}
                  </DrawerTitle>
                  <DrawerDescription className="mt-1 text-sm">
                    {student.student_id && (
                      <span className="me-2">{student.student_id}</span>
                    )}
                    <span>
                      {cgpa === null
                        ? t('review.contextNone')
                        : t('review.context', { cgpa: formatNumber(cgpa) })}
                    </span>
                  </DrawerDescription>
                </div>
                {plan && <PlanStateChip status={plan.status} />}
              </div>
            </DrawerHeader>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {planUnavailable && (
                <EmptyState compact title={planUnavailable} />
              )}

              {!planUnavailable && planPending && (
                <div aria-hidden className="space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}

              {!planUnavailable && planFailed && (
                <ErrorState compact onRetry={onRetryPlan} />
              )}

              {plan && (
                <>
                  <section aria-label={t('review.academic.title')}>
                    <h2 className="text-sm font-semibold">
                      {t('review.academic.title')}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {plan.summary ?? t('review.academic.noSummary')}
                    </p>
                    <p className="mt-1 text-sm font-medium tabular-nums">
                      {t('review.academic.credits', {
                        count: formatNumber(plan.total_credit_hours),
                      })}
                    </p>
                  </section>

                  <section
                    aria-label={t('review.courses', { term: plan.term_code })}
                  >
                    <h2 className="text-sm font-semibold">
                      {t('review.courses', { term: plan.term_code })}
                    </h2>
                    <ul className="mt-2 divide-y">
                      {plan.courses.map((course) => (
                        <li key={course.course_code} className="flex py-2">
                          <span className="bidi-code font-mono text-sm font-semibold">
                            {course.course_code}
                          </span>
                          <span className="ms-auto text-xs text-muted-foreground">
                            {course.group} · {course.section}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {gateBlocked && (
                    <section
                      id="review-validation"
                      aria-label={t('review.validation')}
                    >
                      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                        <CircleX
                          className="size-4 text-destructive"
                          aria-hidden
                        />
                        {t('review.validation')}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('review.approveFailed.body')}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {approveGate?.map((message) => (
                          <li
                            key={message}
                            className="flex items-start gap-1.5"
                          >
                            <CircleX
                              className="mt-0.5 size-4 shrink-0 text-destructive"
                              aria-hidden
                            />
                            <span className="text-sm">{message}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {plan.warnings.length > 0 && (
                    <section aria-label={t('review.warnings')}>
                      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                        <TriangleAlert
                          className="size-4 text-warning"
                          aria-hidden
                        />
                        {t('review.warnings')}
                      </h2>
                      <ul className="mt-2 list-disc space-y-1 ps-5">
                        {plan.warnings.map((warning) => (
                          <li
                            key={warning}
                            className="text-sm text-muted-foreground"
                          >
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <CommentThread
                    comments={comments}
                    submitPending={commentPending}
                    onSubmit={onAddComment}
                  />

                  <section aria-label={t('review.meeting')}>
                    <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                      {t('review.meeting')}
                    </h2>
                    {meeting ? (
                      <div className="mt-2 space-y-2 rounded-md border p-3">
                        <StatusChip domain="meeting" status={meeting.status} />
                        {meeting.slots.map((slot) => (
                          <p key={slot.id} className="text-sm tabular-nums">
                            {formatDateTime(slot.starts_at)}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t('review.meetingNone')}
                      </p>
                    )}
                  </section>

                  {planReviewable && (
                    <section aria-label={t('review.return.action')}>
                      <form
                        noValidate
                        onSubmit={(event) => event.preventDefault()}
                      >
                        <Textarea
                          label={t('review.return.label')}
                          error={mergedReasonError}
                          registration={form.register('reason')}
                          placeholder={t('review.return.placeholder')}
                          className="min-h-24"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('review.return.helper', { name: student.name })}
                        </p>
                      </form>
                    </section>
                  )}
                </>
              )}
            </div>

            <div className="space-y-3 border-t p-4">
              {planUnavailable ? (
                onRequestMeeting && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={onRequestMeeting}
                      className="h-11 flex-1 sm:flex-none"
                    >
                      {t('review.requestMeeting')}
                    </Button>
                  </div>
                )
              ) : (
                <>
                  {!planReviewable && (
                    <Banner variant="info">{t('review.notReviewable')}</Banner>
                  )}

                  {planReviewable && approveUnavailable && (
                    <ErrorState
                      compact
                      title={t('common:errors.sisUnavailable')}
                      message={t('common:errors.sisUnavailableBody')}
                      onRetry={onApprove}
                      requestId={approveUnavailable.requestId}
                    />
                  )}

                  {planReviewable ? (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setApproveConfirmOpen(true)}
                        isLoading={approvePending}
                        disabled={pending}
                        aria-busy={approvePending}
                        className="h-11 flex-1 sm:flex-none"
                      >
                        {t('review.approve.action')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void requestReturn()}
                        isLoading={returnPending}
                        disabled={pending}
                        aria-busy={returnPending}
                        className="h-11 flex-1 sm:flex-none"
                      >
                        {t('review.return.submit')}
                      </Button>
                      {onRequestMeeting && (
                        <Button
                          variant="outline"
                          onClick={onRequestMeeting}
                          disabled={pending}
                          className="h-11 flex-1 sm:flex-none"
                        >
                          {t('review.requestMeeting')}
                        </Button>
                      )}
                    </div>
                  ) : (
                    onRequestMeeting && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={onRequestMeeting}
                          className="h-11 flex-1 sm:flex-none"
                        >
                          {t('review.requestMeeting')}
                        </Button>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={approveConfirmOpen}
        onCancel={() => setApproveConfirmOpen(false)}
        title={t('review.approve.dialogTitle')}
        body={t('review.approve.dialogBody', { name: student.name })}
        confirmLabel={t('review.approve.confirm')}
        onConfirm={() => {
          setApproveConfirmOpen(false);
          onApprove();
        }}
      />

      <ConfirmDialog
        open={returnConfirmOpen}
        onCancel={() => setReturnConfirmOpen(false)}
        title={t('review.return.dialogTitle')}
        body={t('review.return.dialogBody')}
        confirmLabel={t('review.return.confirm')}
        onConfirm={() => {
          setReturnConfirmOpen(false);
          onReturn(reason.trim());
        }}
      />

      <ConfirmDialog
        open={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        title={t('review.return.discardTitle')}
        body={t('review.return.discardBody')}
        confirmLabel={t('review.return.discardConfirm')}
        destructive
        onConfirm={closeDialogsAndDrawer}
      />
    </>
  );
};
