import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { OFFERED_GROUPS, OFFERED_SECTIONS } from '@/config/plan-offerings';
import type { PlannedCourse } from '@/types/domain';
import { cn } from '@/utils/cn';

export type BuilderLineProps = {
  course: PlannedCourse;
  title: string | null;
  disabled?: boolean;
  errors?: string[];
  onGroupChange: (group: string) => void;
  onSectionChange: (section: string) => void;
  onRemove: () => void;
  className?: string;
};

export const BuilderLine = ({
  course,
  title,
  disabled = false,
  errors = [],
  onGroupChange,
  onSectionChange,
  onRemove,
  className,
}: BuilderLineProps) => {
  const { t } = useTranslation('plan');

  const selectClass =
    'min-h-11 rounded-md border border-input bg-transparent px-2 text-base focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm [@media(pointer:fine)_and_(min-width:1024px)]:min-h-9';

  return (
    <div className={cn('py-3', className)}>
      <div className="sm:flex sm:flex-wrap sm:items-center sm:gap-x-3">
        <div className="min-w-0 sm:flex sm:min-w-0 sm:flex-1 sm:items-baseline sm:gap-x-3">
          <span className="bidi-code font-mono text-sm font-semibold">
            {course.course_code}
          </span>
          {title && (
            <span className="mt-0.5 block text-sm sm:mt-0 sm:min-w-0 sm:truncate">
              {title}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0 sm:flex-nowrap sm:gap-3">
          <select
            aria-label={t('builder.line.groupAria', {
              code: course.course_code,
            })}
            value={course.group}
            disabled={disabled}
            onChange={(event) => onGroupChange(event.target.value)}
            className={cn(selectClass, 'flex-1 sm:flex-none')}
          >
            {OFFERED_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <select
            aria-label={t('builder.line.sectionAria', {
              code: course.course_code,
            })}
            value={course.section}
            disabled={disabled}
            onChange={(event) => onSectionChange(event.target.value)}
            className={cn(selectClass, 'flex-1 sm:flex-none')}
          >
            {OFFERED_SECTIONS.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
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
