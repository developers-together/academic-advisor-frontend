import { ArrowUp, Square } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/link';
import {
  createTurnInputSchema,
  TURN_MESSAGE_MAX,
} from '@/features/ai-chat/api/send-turn-input';

export type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, onError: () => void) => void;
  onStop: () => void;
  replying: boolean;
  quotaExhausted: boolean;
  starting?: boolean;
};

const COMPOSER_MAX_HEIGHT = 160;
const COUNTER_THRESHOLD = 200;

export const Composer = ({
  value,
  onChange,
  onSend,
  onStop,
  replying,
  quotaExhausted,
  starting = false,
}: ComposerProps) => {
  const { t } = useTranslation('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      createTurnInputSchema({
        required: t('errors.messageRequired'),
        tooLong: t('errors.messageTooLong'),
      }),
    [t],
  );

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
  }, [value]);

  const disabled = quotaExhausted;
  const charsLeft = TURN_MESSAGE_MAX - value.length;

  const send = () => {
    if (replying || starting || quotaExhausted) return;
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    setError(null);
    const message = parsed.data;
    onChange('');
    onSend(message, () => {
      if (!textareaRef.current?.value.trim()) onChange(message);
    });
    textareaRef.current?.focus();
  };

  return (
    <div className="studio-composer space-y-2">
      {quotaExhausted && (
        <Banner
          variant="warning"
          action={
            <Link
              to="/app/builder"
              className="text-sm font-medium text-primary-text"
            >
              {t('quota.openBuilder')}
            </Link>
          }
        >
          {t('quota.banner')}
        </Banner>
      )}
      <div className="chat-composer-shell">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          maxLength={TURN_MESSAGE_MAX}
          placeholder={t('composer.placeholder')}
          aria-label={t('composer.placeholder')}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              if (!disabled && !replying && !starting && value.trim()) send();
            }
          }}
          className="w-full resize-none rounded-xl border-0 bg-transparent px-3 py-2.5 text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
        />
        {replying ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="chat-send"
            aria-label={t('composer.stop')}
            onClick={onStop}
          >
            <Square className="size-4 fill-current" aria-hidden />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            className="chat-send"
            aria-label={t('composer.send')}
            disabled={starting || quotaExhausted || value.trim().length === 0}
            onClick={send}
          >
            <ArrowUp className="size-5" aria-hidden />
          </Button>
        )}
      </div>
      {(replying || error || charsLeft <= COUNTER_THRESHOLD) && (
        <div className="flex items-center justify-between gap-3 text-2xs text-muted-foreground">
          {replying ? (
            <p role="status">{t('composer.replying')}</p>
          ) : (
            <p>{error}</p>
          )}
          {charsLeft <= COUNTER_THRESHOLD && (
            <p>{t('composer.counter', { count: charsLeft })}</p>
          )}
        </div>
      )}
    </div>
  );
};
