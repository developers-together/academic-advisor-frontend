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
      aria-label={t('goalDialog.title')}
      className={cn('grid gap-2 sm:grid-cols-3', className)}
    >
      {GOALS.map((goal) => (
        <button
          key={goal}
          type="button"
          onClick={() => onPick(suggestions[goal])}
          className="rounded-lg border border-border bg-card p-3 text-start text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden"
        >
          {suggestions[goal]}
        </button>
      ))}
    </div>
  );
};
