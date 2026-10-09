import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/cn';

export const SUGGESTED_PROMPTS = [
  'Help me keep my current level steady this term.',
  'My standing slipped last term and I want it back up.',
  'I want to aim higher than passing. What would excellence look like?',
] as const;

export type PromptCardsProps = {
  onPick: (text: string) => void;
  className?: string;
};

export const PromptCards = ({ onPick, className }: PromptCardsProps) => {
  const { t } = useTranslation('chat');
  return (
    <div
      role="group"
      aria-label={t('promptCards.groupLabel')}
      className={cn('grid gap-2 sm:grid-cols-3', className)}
    >
      {SUGGESTED_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onPick(prompt)}
          className="rounded-lg border border-border bg-card p-3 text-start text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};
