import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/avatar';
import { MDPreview } from '@/components/ui/md-preview';
import { useUser } from '@/lib/auth';
import { formatDateTime } from '@/lib/i18n/format';
import { cn } from '@/utils/cn';

export type MessageBubbleProps = {
  messageRole: 'user' | 'assistant';
  content: string;
  createdAt: string;
  streaming?: boolean;
  className?: string;
};

const AssistantBubble = ({
  content,
  streaming = false,
}: {
  content: string;
  streaming?: boolean;
}) => (
  <div className="max-w-prose rounded-lg border border-border bg-card p-1">
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
  <div className="max-w-prose rounded-lg border border-border bg-muted p-3">
    <p className="text-sm whitespace-pre-wrap">{content}</p>
  </div>
);

export const MessageBubble = ({
  messageRole,
  content,
  createdAt,
  streaming = false,
  className,
}: MessageBubbleProps) => {
  const { t } = useTranslation('chat');
  const user = useUser().data;

  const mark =
    messageRole === 'assistant' ? (
      <Avatar name="AI" size="sm" aria-hidden />
    ) : (
      <Avatar
        name={user?.name ?? '?'}
        size="sm"
        className="bg-muted text-muted-foreground"
        aria-hidden
      />
    );

  return (
    <li className={cn('flex gap-3', className)}>
      {mark}
      <div className="min-w-0 flex-1">
        {messageRole === 'assistant' ? (
          <AssistantBubble content={content} streaming={streaming} />
        ) : (
          <UserBubble content={content} />
        )}
        <time className="mt-1 block text-2xs text-muted-foreground">
          <span className="sr-only">
            {messageRole === 'assistant'
              ? t('transcript.assistantMark')
              : t('transcript.userMark')}
          </span>
          {formatDateTime(createdAt)}
        </time>
      </div>
    </li>
  );
};
