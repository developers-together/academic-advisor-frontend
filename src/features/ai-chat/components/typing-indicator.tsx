import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/avatar';

export const TypingIndicator = () => {
  const { t } = useTranslation('chat');
  return (
    <li className="flex gap-3">
      <Avatar name="AI" size="sm" aria-hidden />
      <div
        role="status"
        className="flex items-center gap-1 rounded-lg border border-border bg-card p-3"
      >
        <span className="sr-only">{t('transcript.typing')}</span>
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            aria-hidden
            className="size-1.5 animate-typing rounded-full bg-muted-foreground"
            style={{ animationDelay: `${dot * 200}ms` }}
          />
        ))}
      </div>
    </li>
  );
};
