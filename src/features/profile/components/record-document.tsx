import { useTranslation } from 'react-i18next';

import { RecordFreshness } from '@/components/domain/record-freshness';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { usePlan } from '@/features/plan/api/get-plan';
import { useUser } from '@/lib/auth';
import type { AcademicRecord } from '@/types/domain';

import { CourseHistoryTable } from './course-history-table';
import { CourseMap } from './course-map';
import { IdentityCard } from './identity-card';
import { MilestonesCard, type Milestone } from './milestones-card';
import { ProgressRing } from './progress-ring';

export type RecordDocumentProps = {
  record: AcademicRecord;
  plannedCourseCodes?: string[];
  onRetryRecord: () => void;
  isRetryingRecord?: boolean;
};

export const RecordDocument = ({
  record,
  plannedCourseCodes = [],
  onRetryRecord,
  isRetryingRecord = false,
}: RecordDocumentProps) => {
  const { t } = useTranslation('plan');
  const user = useUser();
  const planQuery = usePlan();
  const planStatus = planQuery.data?.status ?? null;
  const milestones = milestonesOf(record, planStatus);
  const planned = new Set(plannedCourseCodes);
  const mapEntries = record.prerequisite_map.map((entry) =>
    entry.state === 'eligible' && planned.has(entry.course_code)
      ? { ...entry, state: 'planned' as const }
      : entry,
  );
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

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <MilestonesCard milestones={milestones} />
        <Card className="flex flex-col items-center justify-center gap-2 px-8">
          <ProgressRing value={completedShare} size={96} />
        </Card>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>{t('courseMap.title')}</CardTitle>
        </CardHeader>
        <CardBody>
          <CourseMap
            entries={mapEntries}
            onRetry={onRetryRecord}
            isRetrying={isRetryingRecord}
          />
        </CardBody>
      </Card>

      <CourseHistoryTable history={record.history} />
    </div>
  );
};

const milestonesOf = (
  record: AcademicRecord,
  planStatus: string | null,
): Milestone[] => {
  const map = record.prerequisite_map;
  const completedCount = map.filter(
    (entry) => entry.state === 'completed',
  ).length;
  const share = map.length > 0 ? completedCount / map.length : 0;
  const foundations = map.filter((entry) => entry.prerequisites.length === 0);
  const foundationsCleared =
    foundations.length > 0 &&
    foundations.every((entry) => entry.state === 'completed');

  return [
    { key: 'first_step', earned: completedCount > 0, hint: null },
    {
      key: 'plan_architect',
      earned:
        planStatus !== null && !['draft', 'discarded'].includes(planStatus),
      hint: null,
    },
    {
      key: 'approved',
      earned: planStatus === 'approved' || planStatus === 'closed',
      hint: null,
    },
    { key: 'level_cleared', earned: foundationsCleared, hint: null },
    { key: 'halfway', earned: share >= 0.5, hint: null },
    {
      key: 'map_mastered',
      earned: map.length > 0 && completedCount === map.length,
      hint: null,
    },
  ];
};
