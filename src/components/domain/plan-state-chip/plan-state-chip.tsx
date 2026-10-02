import { Lock } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import type { PlanStatus } from '@/types/domain';
import { cn } from '@/utils/cn';

const LOCKED_STATES: PlanStatus[] = ['returned', 'approved'];

type TokenPair = {
  bg: string;
  fg: string;
  border: string;
  dot: string;
};

const stateTokens: Record<PlanStatus, TokenPair> = {
  draft: {
    bg: 'bg-state-draft',
    fg: 'text-state-draft-foreground',
    border: 'border-state-draft-border',
    dot: 'bg-slate-400',
  },
  submitted: {
    bg: 'bg-state-submitted',
    fg: 'text-state-submitted-foreground',
    border: 'border-state-submitted-border',
    dot: 'bg-blue-500',
  },
  under_review: {
    bg: 'bg-state-under-review',
    fg: 'text-state-under-review-foreground',
    border: 'border-state-under-review-border',
    dot: 'bg-amber-500',
  },
  returned: {
    bg: 'bg-state-returned',
    fg: 'text-state-returned-foreground',
    border: 'border-state-returned-border',
    dot: 'bg-orange-500',
  },
  approved: {
    bg: 'bg-state-approved',
    fg: 'text-state-approved-foreground',
    border: 'border-state-approved-border',
    dot: 'bg-emerald-500',
  },
  expired: {
    bg: 'bg-state-failed',
    fg: 'text-state-failed-foreground',
    border: 'border-dashed border-state-failed-border',
    dot: 'bg-red-400',
  },
  closed: {
    bg: 'bg-state-closed',
    fg: 'text-state-closed-foreground',
    border: 'border-state-closed-border',
    dot: 'bg-slate-400',
  },
  withdrawn: {
    bg: 'bg-state-closed',
    fg: 'text-state-closed-foreground',
    border: 'border-state-closed-border',
    dot: 'bg-slate-400',
  },
  discarded: {
    bg: 'bg-state-closed',
    fg: 'text-state-closed-foreground',
    border: 'border-state-closed-border',
    dot: 'bg-slate-400',
  },
};

export type PlanStateChipProps = {
  status: PlanStatus;
  variant?: 'chip' | 'dot' | 'banner';
  className?: string;
};

export const PlanStateChip = ({
  status,
  variant = 'chip',
  className,
}: PlanStateChipProps) => {
  const { t } = useTranslation();
  const tokens = stateTokens[status];
  const label = t(`planStates.${status}`);
  const locked = LOCKED_STATES.includes(status);

  const srLabel = (
    <span className="sr-only">{t('planStates.srLabel', { state: label })}</span>
  );

  if (variant === 'dot') {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5', className)}
        aria-live="polite"
      >
        <span
          aria-hidden
          className={cn('size-2 shrink-0 rounded-full', tokens.dot)}
        />
        <span className={cn('text-2xs font-medium', tokens.fg)}>{label}</span>
        {srLabel}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex animate-chip-in items-center gap-2 rounded-full border',
        tokens.bg,
        tokens.fg,
        tokens.border,
        variant === 'banner' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-1 text-xs',
        className,
      )}
      aria-live="polite"
    >
      <span
        aria-hidden
        className={cn('size-2 shrink-0 rounded-full', tokens.dot)}
      />
      <span className="font-medium">{label}</span>
      {locked && <Lock className="size-3.5" aria-hidden />}
      {srLabel}
    </span>
  );
};
