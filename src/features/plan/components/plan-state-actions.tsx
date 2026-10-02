import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner, ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import type { Plan } from '@/types/domain';

import { SeenButton } from './seen-button';

export type PlanStateActionsProps = {
  plan: Plan;
  canSubmit: boolean;
  submitBlockedCount: number;
  submitting: boolean;
  withdrawPending: boolean;
  discardPending: boolean;
  seenPending: boolean;
  windowClosed: boolean;
  serviceUnavailable: { requestId: string | null } | null;
  onSubmit: () => void;
  onWithdraw: () => void;
  onDiscard: () => void;
  onSeen: () => void;
};

export const PlanStateActions = ({
  plan,
  canSubmit,
  submitBlockedCount,
  submitting,
  withdrawPending,
  discardPending,
  seenPending,
  windowClosed,
  serviceUnavailable,
  onSubmit,
  onWithdraw,
  onDiscard,
  onSeen,
}: PlanStateActionsProps) => {
  const { t } = useTranslation('plan');

  if (plan.status === 'draft') {
    if (windowClosed) {
      return (
        <Banner
          variant="window-closed"
          title={t('builder.windowClosedTitle')}
          className="max-w-md"
        >
          {t('builder.windowClosed')}
        </Banner>
      );
    }
    if (serviceUnavailable) {
      return (
        <ErrorState
          compact
          title={t('builder.submitUnavailableTitle')}
          message={t('builder.submitUnavailableBody')}
          onRetry={onSubmit}
          requestId={serviceUnavailable.requestId}
        />
      );
    }
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <DraftSubmit
          canSubmit={canSubmit}
          submitBlockedCount={submitBlockedCount}
          submitting={submitting}
          onSubmit={onSubmit}
        />
        <MoreActions
          term={plan.term_code}
          withdrawable
          withdrawPending={withdrawPending}
          discardPending={discardPending}
          onWithdraw={onWithdraw}
          onDiscard={onDiscard}
        />
      </div>
    );
  }

  if (plan.status === 'returned') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <SeenButton pending={seenPending} onConfirm={onSeen} />
        <MoreActions
          term={plan.term_code}
          withdrawable={false}
          withdrawPending={withdrawPending}
          discardPending={discardPending}
          onWithdraw={onWithdraw}
          onDiscard={onDiscard}
        />
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      {plan.status === 'submitted'
        ? t('dashboard.context.submittedFallback')
        : t(`dashboard.context.${plan.status}`)}
    </p>
  );
};

type DraftSubmitProps = {
  canSubmit: boolean;
  submitBlockedCount: number;
  submitting: boolean;
  onSubmit: () => void;
};

const DraftSubmit = ({
  canSubmit,
  submitBlockedCount,
  submitting,
  onSubmit,
}: DraftSubmitProps) => {
  const { t } = useTranslation('plan');

  const helper =
    submitBlockedCount > 0
      ? t('builder.validation.submitBlocked', { count: submitBlockedCount })
      : canSubmit
        ? null
        : t('builder.emptyPlan.body');

  return (
    <>
      <Button
        className="h-11"
        onClick={onSubmit}
        disabled={submitting || !canSubmit || submitBlockedCount > 0}
        isLoading={submitting}
        aria-describedby={helper ? 'plan-actions-helper' : undefined}
      >
        {t('builder.submit')}
      </Button>
      {helper && (
        <p id="plan-actions-helper" className="text-sm text-muted-foreground">
          {helper}
        </p>
      )}
    </>
  );
};

type MoreActionsProps = {
  term: string;
  withdrawable: boolean;
  withdrawPending: boolean;
  discardPending: boolean;
  onWithdraw: () => void;
  onDiscard: () => void;
};

const MoreActions = ({
  term,
  withdrawable,
  withdrawPending,
  discardPending,
  onWithdraw,
  onDiscard,
}: MoreActionsProps) => {
  const { t } = useTranslation('plan');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-11">
            {t('common:actions.moreActions')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {withdrawable && (
            <DropdownMenuItem
              disabled={withdrawPending}
              onSelect={() => setWithdrawOpen(true)}
            >
              {t('myPlan.withdraw')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={discardPending}
            onSelect={() => setDiscardOpen(true)}
          >
            {t('myPlan.discard')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={withdrawOpen}
        onCancel={() => setWithdrawOpen(false)}
        title={t('myPlan.withdrawConfirm.title')}
        body={t('myPlan.withdrawConfirm.body', { term })}
        confirmLabel={t('myPlan.withdrawConfirm.confirm')}
        destructive
        pending={withdrawPending}
        onConfirm={() => {
          setWithdrawOpen(false);
          onWithdraw();
        }}
      />
      <ConfirmDialog
        open={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        title={t('myPlan.discardConfirm.title')}
        body={t('myPlan.discardConfirm.body', { term })}
        confirmLabel={t('myPlan.discardConfirm.confirm')}
        destructive
        pending={discardPending}
        onConfirm={() => {
          setDiscardOpen(false);
          onDiscard();
        }}
      />
    </>
  );
};

type ConfirmDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
};

const ConfirmDialog = ({
  open,
  onCancel,
  onConfirm,
  title,
  body,
  confirmLabel,
  destructive = false,
  pending = false,
}: ConfirmDialogProps) => {
  const { t } = useTranslation();
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button ref={cancelRef} variant="outline" onClick={onCancel}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            isLoading={pending}
            disabled={pending}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
