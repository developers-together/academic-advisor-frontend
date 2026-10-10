import { useTranslation } from 'react-i18next';

import { RecordFreshness } from '@/components/domain/record-freshness';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { useUser } from '@/lib/auth';
import type { AcademicRecord } from '@/types/domain';

import { CourseHistoryTable } from './course-history-table';
import { CourseMap } from './course-map';
import { CurrentEnrollments } from './current-enrollments';
import { IdentityCard } from './identity-card';
import { ProgressRing } from './progress-ring';

export type RecordDocumentProps = {
  record: AcademicRecord;
  onRetryRecord: () => void;
  isRetryingRecord?: boolean;
};

export const RecordDocument = ({
  record,
  onRetryRecord,
  isRetryingRecord = false,
}: RecordDocumentProps) => {
  const { t } = useTranslation('plan');
  const user = useUser();
  const completedCount = record.prerequisite_map.filter(
    (entry) => entry.state === 'completed',
  ).length;
  const completedShare =
    record.prerequisite_map.length > 0
      ? completedCount / record.prerequisite_map.length
      : 0;

  return (
    <div className="space-y-6">
      {user.data && (
        <IdentityCard
          user={user.data}
          academic
          curriculumYear={record.curriculum_year_level}
        />
      )}
      <RecordFreshness
        lastSyncedAt={record.last_synced_at}
        onRetry={onRetryRecord}
        isRetrying={isRetryingRecord}
      />

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

      <CurrentEnrollments enrollments={record.current_enrollments} />
      <CourseHistoryTable history={record.history} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{t('courseMap.title')}</CardTitle>
            </div>
            <ProgressRing value={completedShare} size={64} />
          </div>
        </CardHeader>
        <CardBody>
          <CourseMap
            entries={record.prerequisite_map}
            onRetry={onRetryRecord}
            isRetrying={isRetryingRecord}
          />
        </CardBody>
      </Card>
    </div>
  );
};
