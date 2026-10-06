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
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 py-3',
        className,
      )}
    >
      <span className="bidi-code w-20 shrink-0 font-mono text-sm font-semibold">
        {course.course_code}
      </span>
      {title && (
        <span className="min-w-0 flex-1 truncate text-sm">{title}</span>
      )}
      <select
        aria-label={t('builder.line.groupAria', { code: course.course_code })}
        value={course.group}
        disabled={disabled}
        onChange={(event) => onGroupChange(event.target.value)}
        className={selectClass}
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
        className={selectClass}
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
