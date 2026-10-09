import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MeetingRequestCard } from '@/components/domain/meeting-request-card';
import { ReasonDialog } from '@/components/domain/reason-dialog';
import { ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotifications } from '@/components/ui/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyAdvisor } from '@/features/profile/api/get-advisor';
import { formatCairoSlotRange } from '@/lib/i18n/format';
import type { MeetingRequest } from '@/types/domain';

import {
  useAcceptMeetingProposal,
  useCancelMyMeetingRequest,
  useDeclineMeetingProposal,
} from '../api/meeting-mutations';

import { RequestMeetingDialog } from './request-meeting-dialog';

export type MyMeetingsProps = {
  meetings: MeetingRequest[] | undefined;
  isPending?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

export const MyMeetings = ({
  meetings,
  isPending = false,
  isError = false,
  onRetry,
}: MyMeetingsProps) => {
  const { t } = useTranslation('advisor');
  const addNotification = useNotifications((state) => state.addNotification);
  const advisorQuery = useMyAdvisor();

  const acceptProposal = useAcceptMeetingProposal();
  const declineProposal = useDeclineMeetingProposal();
  const cancelRequest = useCancelMyMeetingRequest();

  const [requestOpen, setRequestOpen] = useState(false);
  const [pickedSlots, setPickedSlots] = useState<Record<number, number>>({});
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const advisorName = advisorQuery.data?.advisor?.name;

  const actionsFor = (meeting: MeetingRequest) => {
    if (meeting.status === 'awaiting_response') {
      const picked = pickedSlots[meeting.id] ?? meeting.slots[0]?.id ?? null;
      return (
        <div className="w-full space-y-3">
          {meeting.slots.length > 0 && (
            <fieldset>
              <legend className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                {t('myMeetings.pickSlot')}
              </legend>
              <div
                role="radiogroup"
                aria-label={t('myMeetings.pickSlot')}
                className="mt-2 flex flex-wrap gap-2"
              >
                {meeting.slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    role="radio"
                    aria-checked={picked === slot.id}
                    onClick={() =>
                      setPickedSlots((state) => ({
                        ...state,
                        [meeting.id]: slot.id,
                      }))
                    }
                    className={`flex min-h-11 items-center rounded-md border px-3 text-sm tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden ${
                      picked === slot.id
                        ? 'border-primary bg-crimson-100 font-medium text-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    {formatCairoSlotRange(slot.starts_at, slot.ends_at)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={picked === null}
              isLoading={
                acceptProposal.isPending &&
                acceptProposal.variables?.id === meeting.id
              }
              onClick={() =>
                picked !== null &&
                acceptProposal.mutate(
                  { id: meeting.id, input: picked },
                  {
                    onSuccess: () =>
                      addNotification({
                        type: 'success',
                        title: t('myMeetings.accepted'),
                      }),
                    onError: () =>
                      addNotification({
                        type: 'error',
                        title: t('myMeetings.actionFailed'),
                      }),
                  },
                )
              }
            >
              {t('myMeetings.actions.accept')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeclineId(meeting.id)}
            >
              {t('myMeetings.actions.decline')}
            </Button>
          </div>
        </div>
      );
    }
    if (meeting.status === 'requested' || meeting.status === 'confirmed') {
      return (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setCancelId(meeting.id)}
        >
          {t('myMeetings.actions.cancel')}
        </Button>
      );
    }
    return undefined;
  };

  const openCount =
    meetings?.filter((meeting) =>
      ['requested', 'awaiting_response', 'confirmed'].includes(meeting.status),
    ).length ?? 0;

  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState compact onRetry={onRetry} />;
  }

  return (
    <div className="space-y-3">
      {openCount === 0 && (
        <Button onClick={() => setRequestOpen(true)}>
          {t('myMeetings.request')}
        </Button>
      )}

      {(meetings?.length ?? 0) === 0 ? (
        <EmptyState
          compact
          title={t('myMeetings.emptyTitle')}
          description={t('myMeetings.emptyBody')}
        />
      ) : (
        <ul className="space-y-3">
          {meetings?.map((meeting) => (
            <li key={meeting.id}>
              <MeetingRequestCard
                meeting={meeting}
                otherParty={
                  advisorName
                    ? t('myMeetings.with', { name: advisorName })
                    : t('myMeetings.advisorFallback')
                }
                viewerIsRequester={meeting.requester_id === meeting.student.id}
                actions={actionsFor(meeting)}
              />
            </li>
          ))}
        </ul>
      )}

      {openCount > 0 && (
        <Button variant="outline" onClick={() => setRequestOpen(true)}>
          {t('myMeetings.requestAnother')}
        </Button>
      )}

      {requestOpen && (
        <RequestMeetingDialog onClose={() => setRequestOpen(false)} />
      )}
      <ReasonDialog
        open={declineId !== null}
        title={t('myMeetings.declineDialog.title')}
        body={t('myMeetings.declineDialog.body')}
        confirmLabel={t('myMeetings.declineDialog.confirm')}
        reasonLabel={t('myMeetings.declineDialog.reasonLabel')}
        pending={declineProposal.isPending}
        onCancel={() => setDeclineId(null)}
        onConfirm={(reason) => {
          if (declineId === null) return;
          declineProposal.mutate(
            { id: declineId, input: reason },
            {
              onSuccess: () => {
                setDeclineId(null);
                addNotification({
                  type: 'info',
                  title: t('myMeetings.declined'),
                });
              },
              onError: () =>
                addNotification({
                  type: 'error',
                  title: t('myMeetings.actionFailed'),
                }),
            },
          );
        }}
      />
      <ReasonDialog
        open={cancelId !== null}
        title={t('myMeetings.cancelDialog.title')}
        body={t('myMeetings.cancelDialog.body')}
        confirmLabel={t('myMeetings.cancelDialog.confirm')}
        reasonLabel={t('myMeetings.cancelDialog.reasonLabel')}
        pending={cancelRequest.isPending}
        onCancel={() => setCancelId(null)}
        onConfirm={(reason) => {
          if (cancelId === null) return;
          cancelRequest.mutate(
            { id: cancelId, input: reason },
            {
              onSuccess: () => {
                setCancelId(null);
                addNotification({
                  type: 'info',
                  title: t('myMeetings.cancelled'),
                });
              },
              onError: () =>
                addNotification({
                  type: 'error',
                  title: t('myMeetings.actionFailed'),
                }),
            },
          );
        }}
      />
    </div>
  );
};
