import { useTranslation } from 'react-i18next';

import { StaleSisBanner } from '@/components/domain/stale-sis-banner';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import type { AcademicRecord } from '@/types/domain';

import { CourseHistoryTable } from './course-history-table';
import { CurrentEnrollments } from './current-enrollments';
import { PrereqMap } from './prereq-map';

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

  return (
    <div className="space-y-6">
      <StaleSisBanner
        staleness={record.staleness}
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
