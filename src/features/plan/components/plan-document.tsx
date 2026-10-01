import { useTranslation } from 'react-i18next';

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import {
  useAcademicRecord,
  buildCourseTitleIndex,
} from '@/lib/api/academic-record';
import type { Plan } from '@/types/domain';

import { PlanLine } from './plan-line';
import { PlanStateChip } from './plan-state-chip';

export type PlanDocumentProps = {
  plan: Plan;
};

export const PlanDocument = ({ plan }: PlanDocumentProps) => {
  const { t } = useTranslation();
  const academicRecord = useAcademicRecord();
  const titles = buildCourseTitleIndex(academicRecord.data);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <h2 className="text-base font-semibold">
          {t('termContext', { ns: 'plan', term: plan.term_code })}
        </h2>
        <PlanStateChip status={plan.status} variant="banner" />
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
            <li key={course.course_code} className="list-none">
              <PlanLine
                course={course}
                title={titles.get(course.course_code) ?? null}
              />
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
};
