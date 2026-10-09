import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { GoalSuggestions, PlanGoal } from '@/types/domain';
import { cn } from '@/utils/cn';

const GOALS: PlanGoal[] = ['maintain', 'improve', 'excel'];

export type PromptCardsProps = {
  suggestions: GoalSuggestions;
  onPick: (text: string) => void;
  className?: string;
};

export const PromptCards = ({
  suggestions,
  onPick,
  className,
}: PromptCardsProps) => {
  const { t } = useTranslation('chat');
  return (
    <div
      role="group"
      aria-label={t('promptLabel')}
      className={cn('grid gap-2 sm:grid-cols-3', className)}
    >
      {GOALS.map((goal) => (
        <button
          key={goal}
          type="button"
          onClick={() => onPick(suggestions[goal])}
          className="group rounded-2xl border border-border bg-muted/30 p-4 text-start text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden"
        >
          <ArrowUpRight
            className="mb-3 size-5 text-primary-text transition-transform group-hover:-translate-y-0.5 rtl:-scale-x-100"
            aria-hidden
          />
          {suggestions[goal]}
        </button>
      ))}
    </div>
  );
};
