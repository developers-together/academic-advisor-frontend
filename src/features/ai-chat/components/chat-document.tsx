import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  History,
  MessageSquarePlus,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { paths } from '@/config/paths';
import { useCreateConversation } from '@/features/ai-chat/api/conversations';
import { Composer } from '@/features/ai-chat/components/composer';
import { ConversationList } from '@/features/ai-chat/components/conversation-list';
import { Transcript } from '@/features/ai-chat/components/transcript';
import { useUser } from '@/lib/auth';

export type ChatDocumentProps = { conversationId: number | null };

export const ChatDocument = ({ conversationId }: ChatDocumentProps) => {
  const { t } = useTranslation('chat');
  const user = useUser();
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
  const initialMessage =
    state &&
    typeof state === 'object' &&
    'message' in state &&
    typeof state.message === 'string'
      ? state.message
      : undefined;
  const [draft, setDraft] = useState(initialDraft);
  const [historyOpen, setHistoryOpen] = useState(false);
  const createConversation = useCreateConversation();
  const startConversation = (message = '') => {
    if (createConversation.isPending) return;
    if (!message.trim()) {
      setDraft('');
      setHistoryOpen(false);
      void navigate('/app/chat', { state: null });
      return;
    }
    createConversation.mutate(
      { goal: 'maintain' },
      {
        onError: () => setDraft((current) => current || message),
        onSuccess: (conversation) => {
          setHistoryOpen(false);
          void navigate(paths.app.conversation.getHref(conversation.id), {
            state: { message },
          });
        },
      },
    );
  };

  return (
    <ContentLayout title={t('title')} className="advisor-studio" header={false}>
      <div className="studio-page-actions">
        <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2"
              aria-label={t('studio.history')}
              title={t('studio.history')}
            >
              <History className="size-5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{t('studio.history')}</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent side="right" className="w-full sm:max-w-md">
            <DrawerHeader>
              <DrawerTitle>{t('studio.history')}</DrawerTitle>
              <DrawerDescription>{t('studio.historyBody')}</DrawerDescription>
            </DrawerHeader>
            <Button
              className="my-5 w-full"
              onClick={() => startConversation()}
              disabled={createConversation.isPending}
              icon={<MessageSquarePlus className="size-4" aria-hidden />}
            >
              {t('newConversation')}
            </Button>
            <ConversationList
              activeId={conversationId}
              onNewConversation={() => startConversation()}
              onSelect={() => setHistoryOpen(false)}
            />
          </DrawerContent>
        </Drawer>
        <Button
          variant="ghost"
          className="gap-2"
          aria-label={t('newConversation')}
          title={t('newConversation')}
          onClick={() => startConversation()}
          disabled={createConversation.isPending}
        >
          <MessageSquarePlus className="size-5 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{t('newConversation')}</span>
        </Button>
      </div>
      {createConversation.isError && (
        <Banner variant="destructive" className="mb-4">
          {t('composer.sendFailed')}
        </Banner>
      )}
      <section
        className={
          conversationId === null ? 'studio-entry' : 'studio-conversation'
        }
        aria-label={t('title')}
      >
        {conversationId === null ? (
          <div className="studio-welcome">
            <div className="studio-intro">
              <img
                src="/ejust-logo.png"
                alt="E-JUST"
                className="studio-mark object-contain"
              />
              <h2>
                {user.data?.name
                  ? t('studio.greeting', { name: user.data.name.split(' ')[0] })
                  : t('studio.title')}
              </h2>
            </div>
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={(message) => startConversation(message)}
              onStop={() => {}}
              replying={false}
              quotaExhausted={false}
              starting={createConversation.isPending}
            />
            <div
              className="studio-starting-points"
              role="group"
              aria-label={t('promptLabel')}
            >
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
                  onClick={() => {
                    setDraft(t(`starters.${key}`));
                    document
                      .querySelector<HTMLTextAreaElement>(
                        '.studio-composer textarea',
                      )
                      ?.focus();
                  }}
                  disabled={createConversation.isPending}
                >
                  <Icon className="size-4 text-primary-text" aria-hidden />
                  <span>{t(`starters.${key}`)}</span>
                  <ArrowRight
                    className="ms-auto size-4 rtl:-scale-x-100"
                    aria-hidden
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Transcript
            key={conversationId}
            conversationId={conversationId}
            initialDraft={initialDraft}
            initialMessage={initialMessage}
          />
        )}
      </section>
    </ContentLayout>
  );
};
