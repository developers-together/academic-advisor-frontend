import { useTranslation } from 'react-i18next';

import type { PlannedCourse } from '@/types/domain';
import { cn } from '@/utils/cn';

export type PlanLineProps = {
  course: PlannedCourse;
  title: string | null;
  errors?: string[];
  className?: string;
};

export const PlanLine = ({
  course,
  title,
  errors = [],
  className,
}: PlanLineProps) => {
  const { t } = useTranslation('plan');

  const lineTitle = course.title ?? title;

  return (
    <div
      className={cn(
        'flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b py-3 last:border-b-0',
        className,
      )}
    >
      <span className="bidi-code font-mono text-sm font-semibold">
        {course.course_code}
      </span>
      {lineTitle && (
        <span className="min-w-0 flex-1 text-sm wrap-break-word">
          {lineTitle}
        </span>
      )}
      <span className="text-xs text-muted-foreground tabular-nums">
        {course.credits == null
          ? t('builder.line.creditsUnknown')
          : t('builder.line.credits', { credits: course.credits })}
      </span>
      {course.reason && (
        <span className="w-full text-xs text-muted-foreground">
          {t('builder.line.aiNote')}: {course.reason}
        </span>
      )}
      {errors.map((message) => (
        <p
          key={message}
          className="w-full text-sm text-destructive"
          role="status"
        >
          {message}
        </p>
      ))}
    </div>
  );
};
