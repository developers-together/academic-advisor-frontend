import { useTranslation } from 'react-i18next';

import { PlanStateChip } from '@/components/domain/plan-state-chip';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import {
  useAcademicRecord,
  buildCourseTitleIndex,
} from '@/lib/api/academic-record';
import type { Plan } from '@/types/domain';

import { PlanLine } from './plan-line';

const lineId = (courseCode: string) =>
  `plan-line-${encodeURIComponent(courseCode)}`;

export type PlanDocumentProps = {
  plan: Plan;
  lineErrors?: Record<string, string[]>;
};

export const PlanDocument = ({ plan, lineErrors }: PlanDocumentProps) => {
  const { t } = useTranslation();
  const academicRecord = useAcademicRecord();
  const titles = buildCourseTitleIndex(academicRecord.data);

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            {t('termContext', { ns: 'plan', term: plan.term_code })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {t('dashboard.courseCount', {
              ns: 'plan',
              count: plan.courses.length,
            })}
            {' · '}
            {t('builder.creditsTotal', {
              ns: 'plan',
              total: plan.total_credit_hours,
            })}
          </p>
        </div>
        <PlanStateChip
          key={plan.status}
          status={plan.status}
          variant="banner"
        />
      </CardHeader>
      <CardBody className="pt-0">
        {plan.return_reason && (
          <div className="mb-4 rounded-lg border border-state-returned-border bg-state-returned p-3 text-sm text-state-returned-foreground">
            {plan.return_reason}
          </div>
        )}
        {plan.summary && (
          <p className="mb-4 text-sm text-muted-foreground">{plan.summary}</p>
        )}
        {plan.courses.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">
            {t('builder.emptyPlan.body', { ns: 'plan' })}
          </p>
        )}
        {plan.warnings.length > 0 && (
          <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3">
            <h3 className="text-sm font-medium">
              {t('builder.validation.advisoryTitle', { ns: 'plan' })}
            </h3>
            <ul className="mt-2 list-disc space-y-1 ps-4 text-sm">
              {plan.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        <ul className="divide-y">
          {plan.courses.map((course) => (
            <li
              key={course.course_code}
              id={lineId(course.course_code)}
              tabIndex={-1}
              className="list-none rounded-lg focus:outline-2 focus:outline-offset-4 focus:outline-ring"
            >
              <PlanLine
                course={course}
                title={titles.get(course.course_code) ?? null}
                errors={lineErrors?.[course.course_code] ?? []}
              />
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
};
