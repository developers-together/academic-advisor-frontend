import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/dialog/confirmation-dialog';
import {
  buildCourseTitleIndex,
  useAcademicRecord,
} from '@/lib/api/academic-record';
import { ApiError } from '@/lib/api-error';
import type { Plan } from '@/types/domain';

import { useAddPlanCourse } from '../api/add-plan-course';
import { useDiscardPlan } from '../api/discard-plan';
import { useRemovePlanCourse } from '../api/remove-plan-course';
import { parseSubmitFailure } from '../api/submit-failure';
import type { SubmitFailure } from '../api/submit-failure';
import { useSubmitPlan } from '../api/submit-plan';
import { useUpdatePlanCourse } from '../api/update-plan-course';

import { BuilderLine } from './builder-line';
import { CoursePicker } from './course-picker';
import { SubmitGate } from './submit-gate';
import { ValidationPanel } from './validation-panel';

const lineId = (courseCode: string) =>
  `plan-line-${encodeURIComponent(courseCode)}`;

export type BuilderDocumentProps = {
  plan: Plan;
};

export const BuilderDocument = ({ plan }: BuilderDocumentProps) => {
  const { t } = useTranslation('plan');
  const academicRecord = useAcademicRecord();
  const addCourse = useAddPlanCourse();
  const updateCourse = useUpdatePlanCourse();
  const removeCourse = useRemovePlanCourse();
  const submitPlanMutation = useSubmitPlan();
  const discardPlanMutation = useDiscardPlan();

  const [failure, setFailure] = useState<SubmitFailure | null>(null);
  const [windowClosed, setWindowClosed] = useState(false);
  const [serviceUnavailable, setServiceUnavailable] = useState<{
    requestId: string | null;
  } | null>(null);

  const titles = buildCourseTitleIndex(academicRecord.data);

  const clearResults = () => {
    setFailure(null);
    setWindowClosed(false);
    setServiceUnavailable(null);
  };

  const pending =
    addCourse.isPending ||
    updateCourse.isPending ||
    removeCourse.isPending ||
    submitPlanMutation.isPending;

  const handleSubmit = () => {
    submitPlanMutation.mutate(undefined, {
      onSuccess: () => clearResults(),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 422) {
          const parsed = parseSubmitFailure(error);
          setWindowClosed(parsed.windowClosed);
          setFailure(parsed.total > 0 ? parsed : null);
          setServiceUnavailable(null);
          document.getElementById('validation-panel-title')?.focus();
          return;
        }
        setFailure(null);
        setWindowClosed(false);
        setServiceUnavailable({
          requestId: error instanceof ApiError ? error.requestId : null,
        });
      },
    });
  };

  const jumpToLine = (courseCode: string) => {
    const line = document.getElementById(lineId(courseCode));
    line?.scrollIntoView({ block: 'center' });
    line?.focus();
  };

  return (
    <div className="max-w-2xl space-y-4">
      <CoursePicker
        plan={plan}
        disabled={addCourse.isPending}
        onSelect={(courseCode) => {
          clearResults();
          addCourse.mutate({ courseCode });
        }}
      />
      <Card>
        <CardHeader className="pb-0">
          <h2 className="text-base font-semibold">
            {t('termContext', { term: plan.term_code })}
          </h2>
        </CardHeader>
        <CardBody>
          {plan.courses.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium">
                {t('builder.emptyPlan.title')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('builder.emptyPlan.body')}
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {plan.courses.map((course) => {
                const linePending =
                  (updateCourse.isPending &&
                    updateCourse.variables?.courseCode ===
                      course.course_code) ||
                  (removeCourse.isPending &&
                    removeCourse.variables?.courseCode === course.course_code);
                return (
                  <li
                    key={course.course_code}
                    id={lineId(course.course_code)}
                    tabIndex={-1}
                    className="list-none focus-visible:outline-none"
                  >
                    <BuilderLine
                      course={course}
                      title={titles.get(course.course_code) ?? null}
                      disabled={linePending}
                      errors={failure?.lineErrors[course.course_code] ?? []}
                      onGroupChange={(group) => {
                        clearResults();
                        updateCourse.mutate({
                          courseCode: course.course_code,
                          group,
                        });
                      }}
                      onSectionChange={(section) => {
                        clearResults();
                        updateCourse.mutate({
                          courseCode: course.course_code,
                          section,
                        });
                      }}
                      onRemove={() => {
                        clearResults();
                        removeCourse.mutate({
                          courseCode: course.course_code,
                        });
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
      <ValidationPanel
        warnings={plan.warnings}
        failure={failure}
        onJumpToLine={jumpToLine}
      />
      <SubmitGate
        canSubmit={plan.courses.length > 0}
        pending={pending}
        submitting={submitPlanMutation.isPending}
        failure={failure}
        windowClosed={windowClosed}
        serviceUnavailable={serviceUnavailable}
        onSubmit={handleSubmit}
        discard={
          <ConfirmationDialog
            triggerButton={
              <Button variant="outline" className="h-11">
                {t('builder.discard')}
              </Button>
            }
            confirmButton={
              <Button
                variant="destructive"
                onClick={() => discardPlanMutation.mutate()}
                isLoading={discardPlanMutation.isPending}
                disabled={discardPlanMutation.isPending}
              >
                {t('myPlan.discardConfirm.confirm')}
              </Button>
            }
            title={t('myPlan.discardConfirm.title')}
            body={t('myPlan.discardConfirm.body', { term: plan.term_code })}
            cancelButtonText={t('common:actions.cancel')}
            icon="danger"
            isDone={discardPlanMutation.isSuccess}
          />
        }
      />
    </div>
  );
};
