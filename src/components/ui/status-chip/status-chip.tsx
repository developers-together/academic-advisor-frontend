import { cva, type VariantProps } from 'class-variance-authority';
import {
  CalendarCheck,
  CalendarClock,
  CalendarX2,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  PauseCircle,
  RefreshCw,
  Save,
  TriangleAlert,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/cn';

const statusChipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'border-border bg-muted text-muted-foreground',
        info: 'border-info/30 bg-info/10 text-info',
        warning: 'border-warning/30 bg-warning/10 text-warning-foreground',
        success: 'border-success/30 bg-success/10 text-success',
        destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-2xs',
        md: 'px-2 py-0.5 text-xs',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      size: 'md',
    },
  },
);

export type MeetingStatus =
  | 'requested'
  | 'awaiting_response'
  | 'confirmed'
  | 'completed'
  | 'declined'
  | 'cancelled'
  | 'expired'
  | 'conflict';

export type AccountStatus = 'active' | 'suspended';

export type DataStatus =
  'saving' | 'saved' | 'updating' | 'stale' | 'offline' | 'error';

export type StatusChipProps = {
  domain: 'meeting' | 'account' | 'data';
  status: MeetingStatus | AccountStatus | DataStatus;
  size?: VariantProps<typeof statusChipVariants>['size'];
  className?: string;
};

type StatusPresentation = {
  labelKey: string;
  tone: NonNullable<VariantProps<typeof statusChipVariants>['tone']>;
  icon: LucideIcon;
};

const meetingStatuses: Record<MeetingStatus, StatusPresentation> = {
  requested: {
    labelKey: 'statusChip.meeting.requested',
    tone: 'info',
    icon: CalendarClock,
  },
  awaiting_response: {
    labelKey: 'statusChip.meeting.awaiting_response',
    tone: 'warning',
    icon: PauseCircle,
  },
  confirmed: {
    labelKey: 'statusChip.meeting.confirmed',
    tone: 'success',
    icon: CalendarCheck,
  },
  completed: {
    labelKey: 'statusChip.meeting.completed',
    tone: 'success',
    icon: Check,
  },
  declined: {
    labelKey: 'statusChip.meeting.declined',
    tone: 'destructive',
    icon: CalendarX2,
  },
  cancelled: {
    labelKey: 'statusChip.meeting.cancelled',
    tone: 'destructive',
    icon: CalendarX2,
  },
  expired: {
    labelKey: 'statusChip.meeting.expired',
    tone: 'destructive',
    icon: CircleAlert,
  },
  conflict: {
    labelKey: 'statusChip.meeting.conflict',
    tone: 'destructive',
    icon: TriangleAlert,
  },
};

const accountStatuses: Record<AccountStatus, StatusPresentation> = {
  active: {
    labelKey: 'statusChip.account.active',
    tone: 'success',
    icon: CircleCheck,
  },
  suspended: {
    labelKey: 'statusChip.account.suspended',
    tone: 'destructive',
    icon: CircleAlert,
  },
};

const dataStatuses: Record<DataStatus, StatusPresentation> = {
  saving: { labelKey: 'statusChip.data.saving', tone: 'info', icon: Clock },
  saved: { labelKey: 'statusChip.data.saved', tone: 'success', icon: Save },
  updating: {
    labelKey: 'statusChip.data.updating',
    tone: 'info',
    icon: RefreshCw,
  },
  stale: {
    labelKey: 'statusChip.data.stale',
    tone: 'warning',
    icon: TriangleAlert,
  },
  offline: {
    labelKey: 'statusChip.data.offline',
    tone: 'neutral',
    icon: WifiOff,
  },
  error: {
    labelKey: 'statusChip.data.error',
    tone: 'destructive',
    icon: CircleAlert,
  },
};

const presentations = {
  meeting: meetingStatuses,
  account: accountStatuses,
  data: dataStatuses,
} as const;

export const StatusChip = ({
  domain,
  status,
  size,
  className,
}: StatusChipProps) => {
  const { t } = useTranslation();
  const book = presentations[domain] as Record<string, StatusPresentation>;
  const presentation = book[status];
  if (!presentation) return null;
  const Icon = presentation.icon;
  const label = t(presentation.labelKey);

  return (
    <span
      className={cn(
        statusChipVariants({ tone: presentation.tone, size }),
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
      <span className="sr-only">
        {t('statusChip.srLabel', {
          domain: t(`statusChip.domains.${domain}`),
          status: label,
        })}
      </span>
    </span>
  );
};

StatusChip.displayName = 'StatusChip';
