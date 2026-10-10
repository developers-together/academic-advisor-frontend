import {
  BookOpen,
  GripVertical,
  LockKeyhole,
  Plus,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useAcademicRecord } from '@/lib/api/academic-record';
import type { Plan } from '@/types/domain';

export const COURSE_DRAG_TYPE = 'application/x-advisor-course';

export const CourseShelf = ({
  plan,
  disabled,
  onAdd,
}: {
  plan: Plan;
  disabled: boolean;
  onAdd: (code: string) => void;
}) => {
  const { t } = useTranslation('plan');
  const record = useAcademicRecord();
  const [search, setSearch] = useState('');
  const planned = new Set(plan.courses.map((course) => course.course_code));
  const courses = (record.data?.prerequisite_map ?? []).filter(
    (course) =>
      course.state !== 'completed' &&
      !planned.has(course.course_code) &&
      `${course.course_code} ${course.title ?? ''}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );

  return (
    <aside
      className="self-start rounded-2xl border bg-card p-5 xl:sticky xl:top-6"
      aria-labelledby="course-shelf-title"
    >
      <div className="mb-2 flex items-center gap-2">
        <BookOpen className="size-5 text-primary-text" aria-hidden />
        <h2 id="course-shelf-title" className="font-semibold">
          {t('builder.shelf.title')}
        </h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {t('builder.shelf.description')}
      </p>
      <label className="mb-4 flex h-11 items-center gap-2 rounded-xl border bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="sr-only">{t('builder.addPlaceholder')}</span>
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-hidden"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('builder.addPlaceholder')}
        />
      </label>
      {record.isPending ? (
        <SkeletonCard />
      ) : record.isError ? (
        <ErrorState
          compact
          onRetry={() => void record.refetch()}
          pending={record.isFetching}
        />
      ) : (
        <ul className="max-h-[55dvh] space-y-3 overflow-y-auto pe-1">
          {courses.map((course) => {
            const locked = course.state === 'locked';
            return (
              <li
                key={course.course_code}
                draggable={!disabled && !locked}
                onDragStart={(event) => {
                  if (disabled || locked) {
                    event.preventDefault();
                    return;
                  }
                  event.dataTransfer.setData(
                    COURSE_DRAG_TYPE,
                    course.course_code,
                  );
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                className={
                  locked
                    ? 'rounded-xl border bg-muted/30 p-3'
                    : 'cursor-grab rounded-xl border bg-background p-3 transition-colors hover:border-primary/50 active:cursor-grabbing'
                }
              >
                <div className="flex items-start gap-2">
                  {locked ? (
                    <LockKeyhole
                      className="mt-1 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  ) : (
                    <GripVertical
                      className="mt-1 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-primary-text">
                      {course.course_code}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {course.title ?? course.course_code}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {locked
                        ? t('builder.shelf.requires', {
                            courses: course.prerequisites.join(', '),
                          })
                        : t('builder.mapState.eligible')}
                    </p>
                  </div>
                  {!locked && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-11 shrink-0"
                      disabled={disabled}
                      aria-label={t('builder.shelf.add', {
                        course: course.course_code,
                      })}
                      title={t('builder.shelf.add', {
                        course: course.course_code,
                      })}
                      onClick={() => onAdd(course.course_code)}
                    >
                      <Plus className="size-4" aria-hidden />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
          {courses.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              {search
                ? t('builder.addSearchEmpty', { query: search })
                : t('builder.shelf.empty')}
            </li>
          )}
        </ul>
      )}
    </aside>
  );
};
