import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  MessageSquarePlus,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { useCreateConversation } from '@/features/ai-chat/api/conversations';
import { ConversationList } from '@/features/ai-chat/components/conversation-list';
import { Transcript } from '@/features/ai-chat/components/transcript';
import { cn } from '@/utils/cn';

export type ChatDocumentProps = {
  conversationId: number | null;
};

export const ChatDocument = ({ conversationId }: ChatDocumentProps) => {
  const { t } = useTranslation('chat');
  const navigate = useNavigate();
  const location = useLocation();
  const state: unknown = location.state;
  const initialDraft =
    state &&
    typeof state === 'object' &&
    'draft' in state &&
    typeof state.draft === 'string'
      ? state.draft
      : '';
  const createConversation = useCreateConversation();
  const startConversation = (draft = '') => {
    if (createConversation.isPending) return;
    createConversation.mutate(
      { goal: 'maintain' },
      {
        onSuccess: (conversation) =>
          void navigate(paths.app.conversation.getHref(conversation.id), {
            state: { draft },
          }),
      },
    );
  };

  return (
    <ContentLayout
      title={t('title')}
      context={t('context')}
      actions={
        conversationId !== null ? (
          <Button
            onClick={() => startConversation()}
            isLoading={createConversation.isPending}
            disabled={createConversation.isPending}
            icon={<MessageSquarePlus className="size-4" aria-hidden />}
          >
            {t('newConversation')}
          </Button>
        ) : undefined
      }
    >
      {createConversation.isError && (
        <Banner variant="destructive">{t('errors.sendFailed')}</Banner>
      )}
      <div className="chat-workspace">
        <aside
          className={cn(
            'chat-history min-w-0',
            conversationId !== null && 'hidden md:block',
          )}
        >
          <ConversationList
            activeId={conversationId}
            onNewConversation={() => startConversation()}
          />
        </aside>
        <section className="chat-canvas min-w-0" aria-label={t('title')}>
          {conversationId === null ? (
            <div className="chat-welcome">
              <span className="chat-orb">
                <Sparkles className="size-9" aria-hidden />
              </span>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight">
                {t('transcript.none.title')}
              </h2>
              <p className="mt-3 max-w-md text-base text-muted-foreground">
                {t('transcript.none.body')}
              </p>
              <div className="mt-7 grid w-full max-w-xl gap-3 sm:grid-cols-3">
                {(
                  [
                    { key: 'courses', icon: BookOpen },
                    { key: 'load', icon: CalendarDays },
                    { key: 'plan', icon: Sparkles },
                  ] as const
                ).map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    disabled={createConversation.isPending}
                    onClick={() => startConversation(t(`starters.${key}`))}
                    className="group min-h-28 rounded-2xl border bg-muted/30 p-4 text-start text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <span className="mb-3 flex items-center justify-between">
                      <Icon className="size-5 text-primary-text" aria-hidden />
                      <ArrowUpRight
                        className="size-4 text-muted-foreground rtl:-scale-x-100"
                        aria-hidden
                      />
                    </span>
                    {t(`starters.${key}`)}
                  </button>
                ))}
              </div>
              <Button
                className="mt-7 rounded-full"
                onClick={() => startConversation()}
                disabled={createConversation.isPending}
                isLoading={createConversation.isPending}
                icon={<MessageSquarePlus className="size-4" aria-hidden />}
              >
                {t('newConversation')}
              </Button>
            </div>
          ) : (
            <Transcript
              key={conversationId}
              conversationId={conversationId}
              initialDraft={initialDraft}
            />
          )}
        </section>
      </div>
    </ContentLayout>
  );
};
