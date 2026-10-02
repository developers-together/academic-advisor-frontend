import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotifications } from '@/components/ui/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiError } from '@/lib/api-error';
import { useUser } from '@/lib/auth';
import { PermissionDenied } from '@/lib/authorization';

import { useCompleteVisitRequest } from '../api/complete-visit-request';
import { useVisitRequests } from '../api/get-visit-requests';

import { ProposeSlotsDialog } from './propose-slots-dialog';
import { VisitRequestCard } from './visit-request-card';

type MeetingsFilter = 'open' | 'done';

const MEETING_FILTERS: MeetingsFilter[] = ['open', 'done'];

export const MeetingsDocument = () => {
  const { t } = useTranslation('advisor');
  const queryClient = useQueryClient();
  const addNotification = useNotifications((state) => state.addNotification);
  const user = useUser();

  const requestsQuery = useVisitRequests();
  const completeRequest = useCompleteVisitRequest();

  const [filter, setFilter] = useState<MeetingsFilter>('open');
  const [proposeRequestId, setProposeRequestId] = useState<number | null>(null);

  const requests = requestsQuery.data ?? [];
  const counts = {
    open: requests.filter((request) => request.status === 'proposed').length,
    done: requests.filter((request) => request.status === 'done').length,
  };
  const visible = requests.filter((request) =>
    filter === 'open'
      ? request.status === 'proposed'
      : request.status === 'done',
  );

  const markDone = (requestId: number) => {
    completeRequest.mutate(requestId, {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void queryClient.invalidateQueries({
            queryKey: ['advisor', 'visit-requests'],
          });
          addNotification({
            type: 'info',
            title: t('common:errors.conflict'),
          });
        }
      },
    });
  };

  if (requestsQuery.isPending) {
    return (
      <div aria-busy="true" className="space-y-3">
        <Skeleton className="h-10 w-48" />
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

  const proposeRequest =
    requests.find((request) => request.id === proposeRequestId) ?? null;

  return (
    <div>
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

      {visible.length === 0 ? (
        <EmptyState
          compact
          className="mt-4 max-w-xl"
          title={t(
            filter === 'open'
              ? 'meetings.emptyOpen.title'
              : 'meetings.emptyDone.title',
          )}
          description={
            filter === 'open' ? t('meetings.emptyOpen.body') : undefined
          }
        />
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((request) => (
            <li key={request.id} className="max-w-xl">
              <VisitRequestCard
                request={request}
                initiatedByMe={request.initiator_id === user.data?.id}
                markDonePending={
                  completeRequest.isPending &&
                  completeRequest.variables === request.id
                }
                onMarkDone={() => markDone(request.id)}
                onProposeSlots={() => setProposeRequestId(request.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {proposeRequest && (
        <ProposeSlotsDialog
          request={proposeRequest}
          onClose={() => setProposeRequestId(null)}
        />
      )}
    </div>
  );
};
