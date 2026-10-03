import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { paths } from '@/config/paths';
import { ConversationList } from '@/features/ai-chat/components/conversation-list';
import { GoalDialog } from '@/features/ai-chat/components/goal-dialog';
import { Transcript } from '@/features/ai-chat/components/transcript';
import { cn } from '@/utils/cn';

export type ChatDocumentProps = {
  conversationId: number | null;
};

export const ChatDocument = ({ conversationId }: ChatDocumentProps) => {
  const { t } = useTranslation('chat');
  const navigate = useNavigate();
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  return (
    <ContentLayout
      title={t('title')}
      context={t('context')}
      actions={
        <Button onClick={() => setGoalDialogOpen(true)}>
          {t('newConversation')}
        </Button>
      }
    >
      <div className="grid items-start gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
        <aside
          className={cn(
            'min-w-0',
            conversationId !== null && 'hidden md:block',
          )}
        >
          <ConversationList
            activeId={conversationId}
            onNewConversation={() => setGoalDialogOpen(true)}
          />
        </aside>
        <section className="min-w-0" aria-label={t('title')}>
          {conversationId === null ? (
            <EmptyState
              className="hidden md:flex"
              title={t('transcript.none.title')}
              description={t('transcript.none.body')}
            />
          ) : (
            <Transcript conversationId={conversationId} />
          )}
        </section>
      </div>
      <GoalDialog
        open={goalDialogOpen}
        onClose={() => setGoalDialogOpen(false)}
        onCreated={(conversation) => {
          setGoalDialogOpen(false);
          void navigate(paths.app.conversation.getHref(conversation.id));
        }}
      />
    </ContentLayout>
  );
};
