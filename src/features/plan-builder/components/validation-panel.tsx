import { CircleAlert, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

import type { SubmitFailure } from '../api/submit-failure';

export type ValidationPanelProps = {
  warnings: string[];
  failure: SubmitFailure | null;
  onJumpToLine: (courseCode: string) => void;
  className?: string;
};

export const ValidationPanel = ({
  warnings,
  failure,
  onJumpToLine,
  className,
}: ValidationPanelProps) => {
  const { t } = useTranslation('plan');
  const hasIssues = failure !== null && failure.total > 0;

  return (
    <section
      aria-labelledby="validation-panel-title"
      aria-live="polite"
      className={cn('rounded-lg border bg-card p-4', className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="validation-panel-title"
          className="text-sm font-semibold"
          tabIndex={-1}
        >
          {t('builder.validation.title')}
        </h2>
        {hasIssues && (
          <p className="text-sm font-medium text-destructive">
            {t('builder.validation.issuesCount', { count: failure.total })}
          </p>
        )}
      </div>
      {hasIssues ? (
        <ul className="mt-3 space-y-3">
          {failure.planMessages.map((message) => (
            <li
              key={message}
              className="flex items-start gap-2 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{message}</span>
            </li>
          ))}
          {Object.entries(failure.lineErrors).map(([courseCode, messages]) => (
            <li key={courseCode} className="space-y-1">
              {messages.map((message) => (
                <div
                  key={message}
                  className="flex items-start gap-2 text-sm text-destructive"
                >
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{message}</span>
                </div>
              ))}
              <Button
                variant="link"
                size="sm"
                className="min-h-11 px-2 text-sm"
                onClick={() => onJumpToLine(courseCode)}
              >
                {t('builder.validation.jumpToLine')}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('builder.validation.helper')}
          </p>
          {warnings.length > 0 && (
            <div>
              <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                {t('builder.validation.advisoryTitle')}
              </p>
              <ul className="mt-1 space-y-1">
                {warnings.map((warning) => (
                  <li
                    key={warning}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <TriangleAlert
                      className="mt-0.5 size-4 shrink-0 text-warning"
                      aria-hidden
                    />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
