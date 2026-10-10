import { Check, Copy } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MDPreview } from '@/components/ui/md-preview';
import { formatDateTime } from '@/lib/i18n/format';
import { cn } from '@/utils/cn';

export type MessageBubbleProps = {
  messageRole: 'user' | 'assistant';
  content: string;
  createdAt: string;
  streaming?: boolean;
  className?: string;
  entranceFrom?: DOMRect | null;
};

const AssistantBubble = ({
  content,
  streaming = false,
}: {
  content: string;
  streaming?: boolean;
}) => (
  <div className="max-w-prose p-1">
    <MDPreview value={content} />
    {streaming && (
      <span
        aria-hidden
        className="ms-1 inline-block h-4 w-0.5 animate-pulse bg-foreground"
      />
    )}
  </div>
);

const UserBubble = ({ content }: { content: string }) => (
  <div className="max-w-prose rounded-2xl rounded-se-md bg-primary/8 px-4 py-3">
    <p className="text-sm whitespace-pre-wrap">{content}</p>
  </div>
);

export const MessageBubble = ({
  messageRole,
  content,
  createdAt,
  streaming = false,
  className,
  entranceFrom,
}: MessageBubbleProps) => {
  const { t } = useTranslation('chat');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  );
  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [copyState]);
  const bubbleRef = useRef<HTMLLIElement>(null);
  useLayoutEffect(() => {
    const element = bubbleRef.current;
    if (
      !entranceFrom ||
      !element?.animate ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const target = element.getBoundingClientRect();
    element.animate(
      [
        {
          transform: `translate(${entranceFrom.left - target.left}px, ${entranceFrom.top - target.top}px) scale(0.96)`,
          opacity: 0.65,
        },
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      ],
      { duration: 440, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  }, [entranceFrom]);

  const mark =
    messageRole === 'assistant' ? (
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-text">
        <img src="/ejust-logo.png" alt="" className="size-6 object-contain" />
      </span>
    ) : null;

  return (
    <li
      ref={bubbleRef}
      className={cn(
        'group flex gap-3',
        messageRole === 'user' && 'ms-auto max-w-[90%] flex-row-reverse',
        className,
      )}
    >
      {mark}
      <div className="min-w-0">
        {messageRole === 'assistant' ? (
          <AssistantBubble content={content} streaming={streaming} />
        ) : (
          <UserBubble content={content} />
        )}
        <time className="sr-only">
          <span className="sr-only">
            {messageRole === 'assistant'
              ? t('transcript.assistantMark')
              : t('transcript.userMark')}
          </span>
          {formatDateTime(createdAt)}
        </time>
        {!streaming && (
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              aria-label={
                copyState === 'copied'
                  ? t('transcript.copied')
                  : t('transcript.copy')
              }
              title={t('transcript.copy')}
              className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(content);
                  setCopyState('copied');
                } catch {
                  setCopyState('failed');
                }
              }}
            >
              {copyState === 'copied' ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
            </button>
            <span
              className={
                copyState === 'failed' ? 'text-xs text-destructive' : 'sr-only'
              }
              role="status"
            >
              {copyState === 'copied'
                ? t('transcript.copied')
                : copyState === 'failed'
                  ? t('transcript.copyFailed')
                  : ''}
            </span>
          </div>
        )}
      </div>
    </li>
  );
};
