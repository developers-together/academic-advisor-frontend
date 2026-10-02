import { useTranslation } from 'react-i18next';

import { StaleSisBanner } from '@/components/domain/stale-sis-banner';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import type { AcademicRecord, User } from '@/types/domain';

import { AdvisorCard } from './advisor-card';
import { CourseHistoryTable } from './course-history-table';
import { CurrentEnrollments } from './current-enrollments';
import { IdentityCard } from './identity-card';
import { PrereqMap } from './prereq-map';

export type ProfileDocumentProps = {
  user: User;
  record: AcademicRecord;
  onRetryRecord: () => void;
  isRetryingRecord?: boolean;
};

export const ProfileDocument = ({
  user,
  record,
  onRetryRecord,
  isRetryingRecord = false,
}: ProfileDocumentProps) => {
  const { t } = useTranslation('plan');

  return (
    <div className="space-y-6">
      <StaleSisBanner
        staleness={record.staleness}
        lastSyncedAt={record.last_synced_at}
        onRetry={onRetryRecord}
        isRetrying={isRetryingRecord}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <IdentityCard
          user={user}
          curriculumYear={record.curriculum_year_level}
        />
        <AdvisorCard />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          label={t('profile.cgpa.label')}
          value={
            record.cgpa === null ? (
              <span className="text-base font-normal text-muted-foreground">
                {t('profile.unavailable')}
              </span>
            ) : (
              String(record.cgpa)
            )
          }
          context={t('profile.cgpa.context')}
        />
        <KpiCard
          label={t('profile.remaining.label')}
          value={
            record.remaining_requirements ?? (
              <span className="text-base font-normal text-muted-foreground">
                {t('profile.unavailable')}
              </span>
            )
          }
          context={t('profile.remaining.context')}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('profile.prereqMap.title')}</CardTitle>
        </CardHeader>
        <CardBody>
          <PrereqMap
            entries={record.prerequisite_map}
            onRetry={onRetryRecord}
            isRetrying={isRetryingRecord}
          />
        </CardBody>
      </Card>

      <CurrentEnrollments enrollments={record.current_enrollments} />

      <CourseHistoryTable history={record.history} />
    </div>
  );
};
