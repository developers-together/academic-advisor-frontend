import { ArrowRight, BookOpen, CalendarDays, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Banner, ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard, SkeletonText } from '@/components/ui/skeleton';
import { StatusChip } from '@/components/ui/status-chip';
import { paths } from '@/config/paths';
import { useMyMeetingRequests } from '@/features/my-advisor/api/get-my-meeting-requests';
import { deepLinkHref } from '@/features/notifications/api/deep-link';
import { useNotifications } from '@/features/notifications/api/get-notifications';
import { useReadNotification } from '@/features/notifications/api/read-notification';
import { NotificationItem } from '@/features/notifications/components/notification-item';
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
      className="student-home"
      context={t('redesign.welcome', { name: user.data?.name ?? '' })}
    >
      {!user.data?.advisor_id && (
        <Banner variant="warning" className="mb-6">
          {t('noAdvisor.banner')}
        </Banner>
      )}
      <div className="home-main">
        <div className="min-w-0 space-y-6">
          <section
            aria-busy={planQuery.isPending}
            aria-label={t('myPlan.title')}
          >
            {planQuery.isPending && <SkeletonCard />}
            {planQuery.isError &&
              !(
                planQuery.error instanceof ApiError &&
                planQuery.error.status === 404
              ) && (
                <ErrorState
                  onRetry={() => void planQuery.refetch()}
                  requestId={
                    planQuery.error instanceof ApiError
                      ? planQuery.error.requestId
                      : null
                  }
                />
              )}
            {planQuery.data && <PlanCard plan={planQuery.data} />}
            {planQuery.isError &&
              planQuery.error instanceof ApiError &&
              planQuery.error.status === 404 && (
                <EmptyState
                  title={t('dashboard.empty.title')}
                  description={t('dashboard.empty.body')}
                  action={{
                    label: t('dashboard.empty.action'),
                    loading: createPlan.isPending,
                    onClick: () => createPlan.mutate(),
                  }}
                />
              )}
          </section>
          <section
            className="home-ai-invitation"
            aria-label={t('home.aiTitle')}
          >
            <Sparkles className="size-7 text-primary-text" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold tracking-tight">
                {t('redesign.aiHeading')}
              </h2>
              <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                {t('home.aiBody')}
              </p>
              <Link
                to={paths.app.chat.getHref()}
                className="home-text-link mt-3"
              >
                {t('home.aiCta')}
                <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
              </Link>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('home.aiDisclaimer')}
              </p>
            </div>
          </section>
          <section
            aria-label={t('home.notificationsTitle')}
            className="home-updates"
          >
            <h2 className="mb-4 text-lg font-semibold">
              {t('home.notificationsTitle')}
            </h2>
            <NotificationsDigest />
          </section>
        </div>
        <aside className="home-support">
          <section
            aria-label={t('home.progressTitle')}
            className="home-support-section"
          >
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="size-4 text-primary-text" aria-hidden />
              {t('home.progressTitle')}
            </h2>
            <ProgressStrip
              isPending={recordQuery.isPending}
              cgpa={recordQuery.data?.cgpa ?? null}
              onRetry={() => void recordQuery.refetch()}
              requestId={
                recordQuery.error instanceof ApiError
                  ? recordQuery.error.requestId
                  : null
              }
              failed={recordQuery.isError}
            />
          </section>
          <section
            aria-label={t('home.meetingTitle')}
            className="home-support-section"
          >
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4 text-primary-text" aria-hidden />
              {t('home.meetingTitle')}
            </h2>
            <NextMeeting />
          </section>
          <section
            aria-label={t('profile.advisor.title')}
            className="home-advisor"
          >
            <AdvisorCard />
          </section>
        </aside>
      </div>
    </ContentLayout>
  );
}

const ProgressStrip = ({
  isPending,
  cgpa,
  onRetry,
  requestId,
  failed,
}: {
  isPending: boolean;
  cgpa: number | null;
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
    <div className="max-w-2xl">
      <p className="text-xs text-muted-foreground">{t('profile.cgpa.label')}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
        {cgpa === null ? (
          <span className="text-base font-normal text-muted-foreground">
            {t('profile.unavailable')}
          </span>
        ) : (
          String(cgpa)
        )}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {t('profile.cgpa.context')}
      </p>
      <Link
        to={paths.app.record.getHref()}
        className="mt-3 inline-flex min-h-11 items-center rounded-md text-sm font-medium text-primary-text focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t('pulse.openRecord')}
      </Link>
    </div>
  );
};

const NextMeeting = () => {
  const { t } = useTranslation('plan');
  const navigate = useNavigate();
  const meetingsQuery = useMyMeetingRequests();
  const [currentTime] = useState(() => Date.now());

  if (meetingsQuery.isPending) {
    return <SkeletonText lines={2} />;
  }

  if (meetingsQuery.isError) {
    return <ErrorState compact onRetry={() => void meetingsQuery.refetch()} />;
  }

  const meetings = meetingsQuery.data ?? [];
  const confirmed = meetings
    .filter((meeting) => {
      const slot = meeting.slots.find(
        (entry) => entry.id === meeting.selected_slot_id,
      );
      return (
        meeting.status === 'confirmed' &&
        slot &&
        new Date(slot.starts_at).getTime() >= currentTime
      );
    })
    .sort((first, second) => {
      const startsAt = (meeting: typeof first) =>
        new Date(
          meeting.slots.find((entry) => entry.id === meeting.selected_slot_id)!
            .starts_at,
        ).getTime();
      return startsAt(first) - startsAt(second);
    })[0];
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
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('home.meetingNone')}</p>
      <Button asChild variant="outline">
        <Link to={paths.app.advisor.getHref()}>{t('myAdvisor.title')}</Link>
      </Button>
    </div>
  );
};

const NotificationsDigest = () => {
  const { t } = useTranslation('plan');
  const notificationsQuery = useNotifications();
  const readNotification = useReadNotification();
  const navigate = useNavigate();

  if (notificationsQuery.isPending) {
    return <SkeletonText lines={2} />;
  }
  if (notificationsQuery.isError) {
    return (
      <ErrorState compact onRetry={() => void notificationsQuery.refetch()} />
    );
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
      {readNotification.isError && (
        <Banner variant="destructive">
          {t('common:errors.saveFailedBody')}
        </Banner>
      )}
      <ul className="space-y-2">
        {unread.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onOpen={(entry) => {
              const target = deepLinkHref(entry.deep_link, 'student');
              readNotification.mutate(entry.id, {
                onSuccess: () => navigate(target),
              });
            }}
          />
        ))}
      </ul>
      <Link
        to={paths.app.notifications.getHref()}
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary-text underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
      >
        {t('home.notificationsViewAll')}
      </Link>
    </div>
  );
};
