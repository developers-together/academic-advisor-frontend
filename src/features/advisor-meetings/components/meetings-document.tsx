import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MeetingRequestCard } from '@/components/domain/meeting-request-card';
import { ReasonDialog } from '@/components/domain/reason-dialog';
import { ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotifications } from '@/components/ui/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCaseload } from '@/features/advisor-students/api/get-caseload';
import { ApiError } from '@/lib/api-error';
import { useUser } from '@/lib/auth';
import { PermissionDenied } from '@/lib/authorization';
import type { MeetingRequest } from '@/types/domain';

import { useMeetingRequests } from '../api/get-meeting-requests';
import {
  useCancelMeetingRequest,
  useCompleteMeetingRequest,
  useDeclineMeetingRequest,
} from '../api/meeting-mutations';

import { ConfirmMeetingDialog } from './confirm-meeting-dialog';
import { InviteStudentDialog } from './invite-student-dialog';
import { ProposeTimeDialog } from './propose-time-dialog';

type MeetingsFilter = 'attention' | 'scheduled' | 'history';

const MEETING_FILTERS: MeetingsFilter[] = ['attention', 'scheduled', 'history'];

const OPEN_STATUSES: MeetingRequest['status'][] = [
  'requested',
  'awaiting_response',
];

const matchesFilter = (meeting: MeetingRequest, filter: MeetingsFilter) => {
  if (filter === 'attention') {
    return OPEN_STATUSES.includes(meeting.status);
  }
  if (filter === 'scheduled') {
    return meeting.status === 'confirmed';
  }
  return ['completed', 'declined', 'cancelled', 'expired', 'conflict'].includes(
    meeting.status,
  );
};

export const MeetingsDocument = () => {
  const { t } = useTranslation('advisor');
  const queryClient = useQueryClient();
  const addNotification = useNotifications((state) => state.addNotification);
  const user = useUser();

  const requestsQuery = useMeetingRequests();
  const caseloadQuery = useCaseload('');

  const declineRequest = useDeclineMeetingRequest();
  const cancelRequest = useCancelMeetingRequest();
  const completeRequest = useCompleteMeetingRequest();

  const [filter, setFilter] = useState<MeetingsFilter>('attention');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [proposeId, setProposeId] = useState<number | null>(null);
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const requests = requestsQuery.data ?? [];
  const counts = useMemo(
    () => ({
      attention: requests.filter((meeting) =>
        matchesFilter(meeting, 'attention'),
      ).length,
      scheduled: requests.filter((meeting) =>
        matchesFilter(meeting, 'scheduled'),
      ).length,
      history: requests.filter((meeting) => matchesFilter(meeting, 'history'))
        .length,
    }),
    [requests],
  );
  const visible = requests.filter((meeting) => matchesFilter(meeting, filter));

  const actionsFor = (meeting: MeetingRequest) => {
    if (meeting.status === 'requested') {
      return (
        <>
          <Button size="sm" onClick={() => setConfirmId(meeting.id)}>
            {t('meetings.actions.confirm')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setProposeId(meeting.id)}
          >
            {t('meetings.actions.propose')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeclineId(meeting.id)}
          >
            {t('meetings.actions.decline')}
          </Button>
        </>
      );
    }
    if (meeting.status === 'confirmed') {
      return (
        <>
          <Button size="sm" onClick={() => complete(meeting.id)}>
            {t('meetings.actions.complete')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCancelId(meeting.id)}
          >
            {t('meetings.actions.cancel')}
          </Button>
        </>
      );
    }
    if (
      meeting.status === 'awaiting_response' &&
      meeting.requester_id === user.data?.id
    ) {
      return (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setCancelId(meeting.id)}
        >
          {t('meetings.actions.cancel')}
        </Button>
      );
    }
    return undefined;
  };

  const complete = (id: number) => {
    completeRequest.mutate(
      { id, input: undefined },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            void queryClient.invalidateQueries({
              queryKey: ['advisor', 'meeting-requests'],
            });
            addNotification({
              type: 'info',
              title: t('common:errors.conflict'),
            });
            return;
          }
          addNotification({
            type: 'error',
            title: t('meetings.actionFailed'),
          });
        },
      },
    );
  };

  if (requestsQuery.isPending) {
    return (
      <div aria-busy="true" className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-36 w-full max-w-xl" />
        <Skeleton className="h-36 w-full max-w-xl" />
      </div>
    );
  }

  if (requestsQuery.isError) {
    if (
      requestsQuery.error instanceof ApiError &&
      requestsQuery.error.status === 403
    ) {
      return <PermissionDenied audience="advisor" />;
    }
    return (
      <ErrorState
        onRetry={() => void requestsQuery.refetch()}
        requestId={
          requestsQuery.error instanceof ApiError
            ? requestsQuery.error.requestId
            : null
        }
      />
    );
  }

  const confirmMeeting = requests.find((meeting) => meeting.id === confirmId);
  const proposeMeeting = requests.find((meeting) => meeting.id === proposeId);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as MeetingsFilter)}
        >
          <TabsList aria-label={t('meetings.title')}>
            {MEETING_FILTERS.map((key) => (
              <TabsTrigger key={key} value={key}>
                {t(`meetings.tabs.${key}`)}{' '}
                <span className="text-muted-foreground tabular-nums">
                  ({counts[key]})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button onClick={() => setInviteOpen(true)}>
          {t('meetings.invite')}
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          compact
          className="mt-4 max-w-xl"
          title={t(`meetings.empty.${filter}.title`)}
          description={t(`meetings.empty.${filter}.body`)}
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((meeting) => (
            <li key={meeting.id} className="max-w-xl">
              <MeetingRequestCard
                meeting={meeting}
                otherParty={meeting.student.name}
                viewerIsRequester={meeting.requester_id === user.data?.id}
                actions={actionsFor(meeting)}
              />
            </li>
          ))}
        </ul>
      )}

      {inviteOpen && caseloadQuery.data && (
        <InviteStudentDialog
          caseload={caseloadQuery.data}
          onClose={() => setInviteOpen(false)}
        />
      )}
      {confirmMeeting && (
        <ConfirmMeetingDialog
          meeting={confirmMeeting}
          onClose={() => setConfirmId(null)}
        />
      )}
      {proposeMeeting && (
        <ProposeTimeDialog
          meeting={proposeMeeting}
          onClose={() => setProposeId(null)}
        />
      )}
      <ReasonDialog
        open={declineId !== null}
        title={t('meetings.declineDialog.title')}
        body={t('meetings.declineDialog.body')}
        confirmLabel={t('meetings.declineDialog.confirm')}
        reasonLabel={t('meetings.declineDialog.reasonLabel')}
        pending={declineRequest.isPending}
        onCancel={() => setDeclineId(null)}
        onConfirm={(reason) => {
          if (declineId === null) return;
          declineRequest.mutate(
            { id: declineId, input: reason },
            {
              onSuccess: () => setDeclineId(null),
              onError: () =>
                addNotification({
                  type: 'error',
                  title: t('meetings.actionFailed'),
                }),
            },
          );
        }}
      />
      <ReasonDialog
        open={cancelId !== null}
        title={t('meetings.cancelDialog.title')}
        body={t('meetings.cancelDialog.body')}
        confirmLabel={t('meetings.cancelDialog.confirm')}
        reasonLabel={t('meetings.cancelDialog.reasonLabel')}
        pending={cancelRequest.isPending}
        onCancel={() => setCancelId(null)}
        onConfirm={(reason) => {
          if (cancelId === null) return;
          cancelRequest.mutate(
            { id: cancelId, input: reason },
            {
              onSuccess: () => setCancelId(null),
              onError: () =>
                addNotification({
                  type: 'error',
                  title: t('meetings.actionFailed'),
                }),
            },
          );
        }}
      />
    </div>
  );
};
