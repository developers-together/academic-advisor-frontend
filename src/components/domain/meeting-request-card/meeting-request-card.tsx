import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { SlotViewer } from '@/components/domain/slot-viewer';
import { Card, CardBody } from '@/components/ui/card';
import { StatusChip } from '@/components/ui/status-chip';
import { formatDateTime } from '@/lib/i18n/format';
import type { MeetingRequest } from '@/types/domain';
import { cn } from '@/utils/cn';

export type MeetingRequestCardProps = {
  meeting: MeetingRequest;
  otherParty: string;
  viewerIsRequester: boolean;
  actions?: React.ReactNode;
  className?: string;
};

export const MeetingRequestCard = ({
  meeting,
  otherParty,
  viewerIsRequester,
  actions,
  className,
}: MeetingRequestCardProps) => {
  const { t } = useTranslation();
  const { t: tAdvisor } = useTranslation('advisor');
  const selected = meeting.slots.find(
    (slot) => slot.id === meeting.selected_slot_id,
  );

  return (
    <Card className={cn(className)}>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusChip domain="meeting" status={meeting.status} />
          <span className="text-xs text-muted-foreground tabular-nums">
            {t('meetingCard.updated', {
              datetime: formatDateTime(meeting.updated_at),
            })}
          </span>
        </div>

        <p className="text-sm font-medium">{otherParty}</p>
        <p className="text-sm text-muted-foreground">
          {t(
            `meetingCard.directionLine_${
              meeting.direction === 'student_to_advisor'
                ? viewerIsRequester
                  ? 'studentRequested'
                  : 'studentRequest'
                : viewerIsRequester
                  ? 'advisorInvite'
                  : 'advisorInviteToYou'
            }`,
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            {t('meetingCard.reason')}
          </span>
          <span>{tAdvisor(`reasons.${meeting.reason}`)}</span>
        </div>

        {meeting.note && (
          <p className="text-sm text-muted-foreground">{meeting.note}</p>
        )}

        {selected && (
          <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2">
            <p className="text-2xs font-medium tracking-wide text-success-emphasis uppercase">
              {t('meetingCard.selectedSlot')}
            </p>
            <p className="text-sm font-medium tabular-nums">
              {formatDateTime(selected.starts_at)}
            </p>
          </div>
        )}

        {!selected && <SlotViewer slots={meeting.slots} />}

        {meeting.cancellation_reason && (
          <p className="text-sm text-destructive">
            {t('meetingCard.cancellationReason', {
              reason: meeting.cancellation_reason,
            })}
          </p>
        )}

        {meeting.completed_at && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {t('meetingCard.completedAt', {
              datetime: formatDateTime(meeting.completed_at),
            })}
          </p>
        )}

        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </CardBody>
    </Card>
  );
};

MeetingRequestCard.displayName = 'MeetingRequestCard';
