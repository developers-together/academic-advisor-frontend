import { CircleCheck, CircleDashed } from 'lucide-react';
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
  const { share: completedShare, unresolved } = requirementProgress(record);

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
          {unresolved ? (
            <p className="text-sm text-muted-foreground">
              {t('requirements.progressUnresolved')}
            </p>
          ) : (
            <ProgressRing value={completedShare} size={96} />
          )}
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

      <section aria-label={t('requirements.title')}>
        <Card>
          <CardHeader>
            <CardTitle>{t('requirements.title')}</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-3">
              {record.prerequisite_map
                .filter((entry) => entry.type !== 'elective')
                .map((entry) => {
                  const outstanding =
                    entry.requirement_outstanding ??
                    entry.state !== 'completed';
                  const Icon = outstanding ? CircleDashed : CircleCheck;
                  return (
                    <li
                      key={entry.course_code}
                      className="flex items-start gap-2"
                    >
                      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <div className="min-w-0 text-sm">
                        <bdi className="font-semibold">{entry.course_code}</bdi>
                        {entry.title && <span> {entry.title}</span>}
                        <p className="text-muted-foreground">
                          {t(
                            `requirements.${outstanding ? 'outstanding' : 'satisfied'}`,
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              {(record.elective_groups ?? []).map((group) => {
                const retakes = group.committed_course_codes.filter(
                  (code) => !group.passed_course_codes.includes(code),
                );
                const Icon =
                  group.status === 'satisfied' ? CircleCheck : CircleDashed;
                return (
                  <li key={group.key} className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold">{group.name}</p>
                      <p className="text-muted-foreground">
                        {t(`requirements.${group.status}`)}
                      </p>
                      {group.required_passes !== null && (
                        <p className="text-muted-foreground tabular-nums">
                          {t('requirements.passes', {
                            required: group.required_passes,
                            remaining: group.remaining_passes,
                          })}
                        </p>
                      )}
                      <p className="mt-1 text-muted-foreground">
                        {t('requirements.alternatives')}{' '}
                        <bdi>{group.course_codes.join(', ')}</bdi>
                      </p>
                      {group.status === 'outstanding' && retakes.length > 0 && (
                        <p className="mt-1 text-warning">
                          {t('requirements.retake')}{' '}
                          <bdi>{retakes.join(', ')}</bdi>
                        </p>
                      )}
                      {group.planned_course_codes.length > 0 && (
                        <p className="mt-1 text-muted-foreground">
                          {t('requirements.reserved')}{' '}
                          <bdi>{group.planned_course_codes.join(', ')}</bdi>
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('courseMap.title')}</CardTitle>
        </CardHeader>
        <CardBody>
          <CourseMap
            entries={mapEntries}
            currentLevel={record.curriculum_year_level}
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
  const { completedCount, share, unresolved } = requirementProgress(record);
  const foundations = map.filter((entry) => entry.prerequisites.length === 0);
  const foundationsCleared =
    foundations.length > 0 &&
    foundations.every((entry) =>
      entry.type === 'elective'
        ? entry.elective_group?.status === 'satisfied'
        : entry.state === 'completed',
    );

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
    { key: 'halfway', earned: !unresolved && share >= 0.5, hint: null },
    {
      key: 'map_mastered',
      earned: !unresolved && share === 1,
      hint: null,
    },
  ];
};

const requirementProgress = (record: AcademicRecord) => {
  const compulsory = record.prerequisite_map.filter(
    (entry) => entry.type !== 'elective',
  );
  const groups = record.elective_groups ?? [];
  const unresolved = groups.some((group) => group.required_passes === null);
  const required =
    compulsory.length +
    groups.reduce((sum, group) => sum + (group.required_passes ?? 0), 0);
  const completedCount =
    compulsory.filter((entry) => entry.state === 'completed').length +
    groups.reduce(
      (sum, group) =>
        sum +
        Math.min(group.required_passes ?? 0, group.passed_course_codes.length),
      0,
    );
  return {
    completedCount,
    share: required > 0 ? completedCount / required : 0,
    unresolved,
  };
};
