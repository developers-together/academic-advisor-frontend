import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import type { PlannedCourse } from '@/types/domain';
import { cn } from '@/utils/cn';

export type BuilderLineProps = {
  course: PlannedCourse;
  title: string | null;
  disabled?: boolean;
  errors?: string[];
  onRemove: () => void;
  className?: string;
};

export const BuilderLine = ({
  course,
  title,
  disabled = false,
  errors = [],
  onRemove,
  className,
}: BuilderLineProps) => {
  const { t } = useTranslation('plan');

  const lineTitle = course.title ?? title;

  return (
    <div className={cn('py-3', className)}>
      <div className="sm:flex sm:flex-wrap sm:items-center sm:gap-x-3">
        <div className="min-w-0 sm:flex sm:min-w-0 sm:flex-1 sm:items-baseline sm:gap-x-3">
          <span className="bidi-code font-mono text-sm font-semibold">
            {course.course_code}
          </span>
          {lineTitle && (
            <span className="mt-0.5 block text-sm sm:mt-0 sm:min-w-0 sm:wrap-break-word">
              {lineTitle}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0 sm:flex-nowrap sm:gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {course.credits == null
              ? t('builder.line.creditsUnknown')
              : t('builder.line.credits', { credits: course.credits })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 text-muted-foreground hover:text-destructive"
            aria-label={t('builder.line.remove', { code: course.course_code })}
            disabled={disabled}
            onClick={onRemove}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
      {errors.map((message) => (
        <p
          key={message}
          className="mt-1 w-full text-sm text-destructive"
          role="status"
        >
          {message}
        </p>
      ))}
    </div>
  );
};
