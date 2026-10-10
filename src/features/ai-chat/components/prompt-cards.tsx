import { ArrowUpRight } from 'lucide-react';
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
      aria-label={t('promptLabel')}
      className={cn('grid gap-2 sm:grid-cols-3', className)}
    >
      {SUGGESTED_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onPick(prompt)}
          className="group rounded-2xl border border-border bg-muted/30 p-4 text-start text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden"
        >
          <ArrowUpRight
            className="mb-3 size-5 text-primary-text transition-transform group-hover:-translate-y-0.5 rtl:-scale-x-100"
            aria-hidden
          />
          {prompt}
        </button>
      ))}
    </div>
  );
};
