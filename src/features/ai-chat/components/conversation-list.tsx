import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { Link } from '@/components/ui/link';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { usePlanConversations } from '@/features/ai-chat/api/conversations';
import { formatDateTime } from '@/lib/i18n/format';
import type { PlanConversation } from '@/types/domain';
import { cn } from '@/utils/cn';

export type ConversationListProps = {
  activeId: number | null;
  onNewConversation: () => void;
  className?: string;
};

const ConversationItem = ({
  conversation,
  active,
}: {
  conversation: PlanConversation;
  active: boolean;
}) => {
  const { t } = useTranslation('chat');
  return (
    <li>
      <Link
        to={paths.app.conversation.getHref(conversation.id)}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'block rounded-lg border p-3 transition-colors',
          active
            ? 'border-crimson-300 bg-crimson-100'
            : 'border-transparent hover:bg-accent',
        )}
      >
        <span className="block truncate text-sm font-medium text-foreground">
          {conversation.title ?? t('list.untitled')}
        </span>
        <span className="mt-1.5 flex items-center gap-2">
          <span className="text-2xs text-muted-foreground">
            {formatDateTime(conversation.updated_at)}
          </span>
        </span>
      </Link>
    </li>
  );
};

export const ConversationList = ({
  activeId,
  onNewConversation,
  className,
}: ConversationListProps) => {
  const { t } = useTranslation('chat');
  const conversationsQuery = usePlanConversations();

  if (conversationsQuery.isPending) {
    return (
      <div
        className={cn('space-y-2', className)}
        aria-busy="true"
        data-testid="loading conversations"
      >
        {[0, 1, 2].map((row) => (
          <div key={row} className="rounded-lg border p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (conversationsQuery.isError) {
    return (
      <ErrorState compact onRetry={() => void conversationsQuery.refetch()} />
    );
  }

  const conversations = conversationsQuery.data;

  if (conversations.length === 0) {
    return (
      <EmptyState
        className={className}
        title={t('list.empty.title')}
        description={t('list.empty.body')}
        action={{ label: t('newConversation'), onClick: onNewConversation }}
      />
    );
  }

  return (
    <nav aria-label={t('title')} className={className}>
      <ul className="space-y-2">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === activeId}
          />
        ))}
      </ul>
    </nav>
  );
};
