import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
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

import { BuilderLine } from './builder-line';
import { COURSE_DRAG_TYPE, CourseShelf } from './course-shelf';
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
  const removeCourse = useRemovePlanCourse();
  const submitPlanMutation = useSubmitPlan();
  const discardPlanMutation = useDiscardPlan();

  const [dragOver, setDragOver] = useState(false);
  const [failure, setFailure] = useState<SubmitFailure | null>(null);
  const [windowClosed, setWindowClosed] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discardError, setDiscardError] = useState<string | null>(null);
  const [lineError, setLineError] = useState<{
    message: string;
    requestId: string | null;
  } | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState<{
    requestId: string | null;
  } | null>(null);

  const titles = buildCourseTitleIndex(academicRecord.data);
  useEffect(() => {
    if (failure) document.getElementById('validation-panel-title')?.focus();
  }, [failure]);

  const clearResults = () => {
    setFailure(null);
    setWindowClosed(false);
    setServiceUnavailable(null);
    setLineError(null);
  };

  // The plan endpoints answer 422 with a message plus per-field lines
  // (design.md section 7.4: the UI renders the server's words).
  const describeLineError = (error: unknown) => {
    if (error instanceof ApiError) {
      const fieldMessages = Object.values(error.fields).flat().join(' ');
      return {
        message:
          fieldMessages || error.message || t('common:errors.saveFailed'),
        requestId: error.requestId,
      };
    }
    return { message: t('common:errors.saveFailed'), requestId: null };
  };

  const pending =
    addCourse.isPending ||
    removeCourse.isPending ||
    submitPlanMutation.isPending ||
    discardPlanMutation.isPending;

  const handleSubmit = () => {
    submitPlanMutation.mutate(undefined, {
      onSuccess: () => clearResults(),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 422) {
          const parsed = parseSubmitFailure(error);
          setWindowClosed(parsed.windowClosed);
          setFailure(parsed.total > 0 ? parsed : null);
          setServiceUnavailable(null);
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

  const addToPlan = (courseCode: string) => {
    if (
      pending ||
      plan.courses.some((course) => course.course_code === courseCode)
    )
      return;
    clearResults();
    addCourse.mutate(
      { courseCode },
      { onError: (error) => setLineError(describeLineError(error)) },
    );
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 space-y-4" aria-label={t('builder.title')}>
        {lineError && (
          <Banner variant="destructive" title={lineError.message}>
            {lineError.requestId && (
              <p className="text-xs text-muted-foreground">
                {t('common:errors.requestRef', { id: lineError.requestId })}
              </p>
            )}
          </Banner>
        )}
        <div
          className={
            dragOver
              ? 'rounded-2xl ring-2 ring-primary ring-offset-4 ring-offset-background'
              : 'rounded-2xl'
          }
          onDragOver={(event) => {
            if (
              !pending &&
              event.dataTransfer.types.includes(COURSE_DRAG_TYPE)
            ) {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
              setDragOver(true);
            }
          }}
          onDragLeave={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              setDragOver(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const code = event.dataTransfer.getData(COURSE_DRAG_TYPE);
            const course = academicRecord.data?.prerequisite_map.find(
              (entry) => entry.course_code === code,
            );
            if (
              course &&
              course.state !== 'locked' &&
              course.state !== 'completed'
            )
              addToPlan(code);
          }}
        >
          <Card>
            <CardHeader className="pb-0">
              <h2 className="text-base font-semibold">
                {t('termContext', { term: plan.term_code })}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                {t('builder.creditsTotal', {
                  total: plan.total_credit_hours,
                })}
              </p>
              <p
                className="mt-2 text-xs text-muted-foreground"
                aria-live="polite"
              >
                {dragOver
                  ? t('builder.shelf.release')
                  : t('builder.shelf.drop')}
              </p>
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
                          disabled={pending}
                          errors={failure?.lineErrors[course.course_code] ?? []}
                          onRemove={() => {
                            clearResults();
                            removeCourse.mutate(
                              {
                                courseCode: course.course_code,
                              },
                              {
                                onError: (error) =>
                                  setLineError(describeLineError(error)),
                              },
                            );
                          }}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
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
            <>
              <Button
                variant="outline"
                className="h-11"
                disabled={pending}
                onClick={() => {
                  setDiscardError(null);
                  setDiscardOpen(true);
                }}
              >
                {t('builder.discard')}
              </Button>
              <ConfirmDialog
                open={discardOpen}
                onCancel={() => setDiscardOpen(false)}
                onConfirm={() =>
                  discardPlanMutation.mutate(undefined, {
                    onSuccess: () => setDiscardOpen(false),
                    onError: (error) =>
                      setDiscardError(describeLineError(error).message),
                  })
                }
                title={t('myPlan.discardConfirm.title')}
                body={t('myPlan.discardConfirm.body', { term: plan.term_code })}
                confirmLabel={t('myPlan.discardConfirm.confirm')}
                destructive
                pending={discardPlanMutation.isPending}
                error={discardError}
              />
            </>
          }
        />
      </section>
      <CourseShelf plan={plan} disabled={pending} onAdd={addToPlan} />
    </div>
  );
};
