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
      <CardHeader className="flex-row items-center justify-between">
        <h2 className="text-base font-semibold">
          {t('termContext', { ns: 'plan', term: plan.term_code })}
        </h2>
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
        <ul className="divide-y">
          {plan.courses.map((course) => (
            <li
              key={course.course_code}
              id={lineId(course.course_code)}
              tabIndex={-1}
              className="list-none focus-visible:outline-none"
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
