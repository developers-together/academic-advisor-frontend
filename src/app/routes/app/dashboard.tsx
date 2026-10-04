import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Banner, ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { KpiCard } from '@/components/ui/kpi-card';
import { SkeletonCard, SkeletonText } from '@/components/ui/skeleton';
import { StatusChip } from '@/components/ui/status-chip';
import { paths } from '@/config/paths';
import { useMyMeetingRequests } from '@/features/my-advisor/api/get-my-meeting-requests';
import { useNotifications } from '@/features/notifications/api/get-notifications';
import { useCreatePlan } from '@/features/plan/api/create-plan';
import { usePlan } from '@/features/plan/api/get-plan';
import { PlanCard } from '@/features/plan/components/plan-card';
import { AdvisorCard } from '@/features/profile/components/advisor-card';
import { useAcademicRecord } from '@/lib/api/academic-record';
import { ApiError } from '@/lib/api-error';
import { useUser } from '@/lib/auth';
import { formatDateTime } from '@/lib/i18n/format';

export default function DashboardRoute() {
  const { t } = useTranslation('plan');
  const user = useUser();
  const planQuery = usePlan();
  const createPlan = useCreatePlan();
  const recordQuery = useAcademicRecord();
  return (
    <ContentLayout
      title={t('dashboard.title')}
      context={
        planQuery.data?.term_code
          ? t('termContext', { term: planQuery.data.term_code })
          : undefined
      }
    >
      <div className="space-y-6">
        {!user.data?.advisor_id && (
          <Banner variant="warning">{t('noAdvisor.banner')}</Banner>
        )}

        <section aria-busy={planQuery.isPending} aria-label={t('myPlan.title')}>
          {planQuery.isPending && <SkeletonCard className="max-w-xl" />}

          {planQuery.isError &&
            planQuery.error instanceof ApiError &&
            planQuery.error.status !== 404 && (
              <ErrorState
                onRetry={() => void planQuery.refetch()}
                requestId={planQuery.error.requestId}
              />
            )}

          {planQuery.data && <PlanCard plan={planQuery.data} />}

          {planQuery.isError &&
            planQuery.error instanceof ApiError &&
            planQuery.error.status === 404 && (
              <EmptyState
                className="max-w-xl"
                title={t('dashboard.empty.title')}
                description={t('dashboard.empty.body')}
                action={{
                  label: t('dashboard.empty.action'),
                  loading: createPlan.isPending,
                  onClick: () => {
                    createPlan.mutate();
                  },
                }}
              />
            )}
        </section>

        <section aria-label={t('home.progressTitle')}>
          <h2 className="mb-3 text-sm font-semibold">
            {t('home.progressTitle')}
          </h2>
          <ProgressStrip
            isPending={recordQuery.isPending}
            cgpa={recordQuery.data?.cgpa ?? null}
            remaining={recordQuery.data?.remaining_requirements ?? null}
            onRetry={() => void recordQuery.refetch()}
            requestId={
              recordQuery.error instanceof ApiError
                ? recordQuery.error.requestId
                : null
            }
            failed={recordQuery.isError}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section aria-label={t('home.meetingTitle')}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{t('home.meetingTitle')}</CardTitle>
              </CardHeader>
              <CardBody>
                <NextMeeting />
              </CardBody>
            </Card>
          </section>

          <section aria-label={t('profile.advisor.title')}>
            <AdvisorCard />
          </section>
        </div>

        <section
          aria-label={t('home.notificationsTitle')}
          className="max-w-2xl"
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('home.notificationsTitle')}</CardTitle>
            </CardHeader>
            <CardBody>
              <NotificationsDigest />
            </CardBody>
          </Card>
        </section>

        <section aria-label={t('home.aiTitle')} className="max-w-2xl">
          <Card className="border-primary/30">
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{t('home.aiTitle')}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('home.aiBody')}
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to={paths.app.chat.getHref()}>{t('home.aiCta')}</Link>
              </Button>
            </CardBody>
          </Card>
        </section>
      </div>
    </ContentLayout>
  );
}

const ProgressStrip = ({
  isPending,
  cgpa,
  remaining,
  onRetry,
  requestId,
  failed,
}: {
  isPending: boolean;
  cgpa: number | null;
  remaining: string | null;
  onRetry: () => void;
  requestId: string | null;
  failed: boolean;
}) => {
  const { t } = useTranslation('plan');

  if (isPending) {
    return <SkeletonText lines={2} />;
  }
  if (failed) {
    return <ErrorState compact onRetry={onRetry} requestId={requestId} />;
  }

  return (
    <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <KpiCard
        label={t('profile.cgpa.label')}
        value={
          cgpa === null ? (
            <span className="text-base font-normal text-muted-foreground">
              {t('profile.unavailable')}
            </span>
          ) : (
            String(cgpa)
          )
        }
        context={t('profile.cgpa.context')}
      />
      <KpiCard
        label={t('profile.remaining.label')}
        value={
          remaining ?? (
            <span className="text-base font-normal text-muted-foreground">
              {t('profile.unavailable')}
            </span>
          )
        }
        context={t('profile.remaining.context')}
      />
    </div>
  );
};

const NextMeeting = () => {
  const { t } = useTranslation('plan');
  const navigate = useNavigate();
  const meetingsQuery = useMyMeetingRequests();

  if (meetingsQuery.isPending) {
    return <SkeletonText lines={2} />;
  }

  const meetings = meetingsQuery.data ?? [];
  const confirmed = meetings.find(
    (meeting) =>
      meeting.status === 'confirmed' && meeting.selected_slot_id !== null,
  );
  const awaiting = meetings.find(
    (meeting) => meeting.status === 'awaiting_response',
  );

  if (confirmed) {
    const slot = confirmed.slots.find(
      (entry) => entry.id === confirmed.selected_slot_id,
    );
    return (
      <div className="space-y-3">
        <StatusChip domain="meeting" status="confirmed" />
        {slot && (
          <p className="text-sm font-medium tabular-nums">
            {formatDateTime(slot.starts_at)}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(paths.app.advisor.getHref())}
        >
          {t('myAdvisor.title')}
        </Button>
      </div>
    );
  }

  if (awaiting) {
    return (
      <div className="space-y-3">
        <StatusChip domain="meeting" status="awaiting_response" />
        <p className="text-sm text-muted-foreground">
          {t('home.meetingRespond')}
        </p>
        <Button size="sm" onClick={() => navigate(paths.app.advisor.getHref())}>
          {t('home.meetingRespondCta')}
        </Button>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">{t('home.meetingNone')}</p>
  );
};

const NotificationsDigest = () => {
  const { t } = useTranslation('plan');
  const notificationsQuery = useNotifications();

  if (notificationsQuery.isPending) {
    return <SkeletonText lines={2} />;
  }
  if (notificationsQuery.isError) {
    return null;
  }

  const unread = (notificationsQuery.data?.items ?? [])
    .filter((notification) => notification.read_at === null)
    .slice(0, 2);

  if (unread.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('home.notificationsEmpty')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {unread.map((notification) => (
          <li key={notification.id} className="rounded-md border p-3">
            <p className="text-sm font-medium">{notification.title}</p>
            {notification.body && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {notification.body}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {formatDateTime(notification.created_at)}
            </p>
          </li>
        ))}
      </ul>
      <Link
        to={paths.app.notifications.getHref()}
        className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
      >
        {t('home.notificationsViewAll')}
      </Link>
    </div>
  );
};
