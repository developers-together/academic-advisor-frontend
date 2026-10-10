import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ErrorState, Banner } from '@/components/ui/banner';
import { Button, RetryButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  planConversationsRootKey,
  usePlanConversation,
} from '@/features/ai-chat/api/conversations';
import { useSendTurn } from '@/features/ai-chat/api/use-send-turn';
import { Composer } from '@/features/ai-chat/components/composer';
import { MessageBubble } from '@/features/ai-chat/components/message-bubble';
import { PromptCards } from '@/features/ai-chat/components/prompt-cards';
import { SubmitResultRow } from '@/features/ai-chat/components/submit-result-row';
import {
  ArmedCard,
  SubmitSuggestionCard,
} from '@/features/ai-chat/components/submit-suggestion-card';
import { ToolEventRow } from '@/features/ai-chat/components/tool-event-row';
import { TypingIndicator } from '@/features/ai-chat/components/typing-indicator';
import { useTranscriptFollow } from '@/features/ai-chat/hooks/use-transcript-follow';
import { useTurnStreamStore } from '@/features/ai-chat/stores/turn-stream-store';
import { useScrollableTabIndex } from '@/hooks/use-scrollable-tab-index';
import { ApiError } from '@/lib/api-error';

export type TranscriptProps = {
  conversationId: number;
  initialDraft?: string;
  initialMessage?: string;
};

export const Transcript = ({
  conversationId,
  initialDraft = '',
  initialMessage,
}: TranscriptProps) => {
  const { t } = useTranslation('chat');
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const conversationQuery = usePlanConversation(conversationId);
  const sendTurn = useSendTurn(conversationId);
  const turn = useTurnStreamStore(
    (state) => state.turns[String(conversationId)],
  );
  const sessionToolEvents = useTurnStreamStore(
    (state) => state.toolEvents[String(conversationId)],
  );
  const sessionSubmitResults = useTurnStreamStore(
    (state) => state.submitResults[String(conversationId)],
  );
  const submitSuggested = useTurnStreamStore(
    (state) => state.submitSuggested[String(conversationId)] ?? false,
  );
  const quotaExhausted = useTurnStreamStore((state) => state.quotaExhausted);
  const [draft, setDraft] = useState(initialDraft);
  const [announcement, setAnnouncement] = useState('');
  const [entrance, setEntrance] = useState<{
    content: string;
    from: DOMRect;
  } | null>(null);
  const {
    containerRef,
    pinned,
    follow,
    scrollToLatest,
    jumpToLatest,
    handleScroll,
  } = useTranscriptFollow();
  const { ref: scrollRef, tabIndex } = useScrollableTabIndex(containerRef);

  const initialSendRef = useRef(false);
  const mutateTurn = sendTurn.mutate;
  useEffect(() => {
    if (!initialMessage || !conversationQuery.data || initialSendRef.current)
      return;
    initialSendRef.current = true;
    void navigate(`/app/chat/${conversationId}`, {
      replace: true,
      state: null,
    });
    mutateTurn(initialMessage, {
      onError: () =>
        setDraft((current) => (current.trim() ? current : initialMessage)),
      onSuccess: (response) => {
        if (response) setAnnouncement(t('transcript.replyReady'));
      },
    });
    document
      .querySelector<HTMLTextAreaElement>('.studio-composer textarea')
      ?.focus();
  }, [
    initialMessage,
    conversationQuery.data,
    conversationId,
    navigate,
    mutateTurn,
    t,
  ]);

  const error = conversationQuery.error;

  useEffect(() => {
    if (pinned) {
      follow();
    }
  }, [pinned, follow, turn, conversationQuery.data]);

  useEffect(() => {
    if (
      conversationQuery.isError &&
      error instanceof ApiError &&
      error.status === 404
    ) {
      void queryClient.invalidateQueries({
        queryKey: planConversationsRootKey,
        exact: true,
      });
    }
  }, [conversationQuery.isError, error, queryClient]);

  if (conversationQuery.isPending) {
    return (
      <div
        className="space-y-8"
        aria-busy="true"
        data-testid="loading conversation"
      >
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="ms-9 h-16 w-3/4" />
      </div>
    );
  }

  if (conversationQuery.isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <EmptyState
          title={t('list.missing.title')}
          description={t('list.missing.body')}
          action={{
            label: t('list.back'),
            onClick: () => void navigate('/app/chat'),
          }}
        />
      );
    }
    return <ErrorState onRetry={() => void conversationQuery.refetch()} />;
  }

  const conversation = conversationQuery.data;
  const messages = (conversation.messages ?? []).filter(
    (message) =>
      !turn ||
      message.role !== 'assistant' ||
      turn.messageIdsBeforeTurn.includes(message.id),
  );
  const hasUserMessages = messages.some((message) => message.role === 'user');
  const replying = turn?.status === 'typing' || turn?.status === 'streaming';
  const blocks = turn?.blocks ?? [];
  const lastTextIndex = blocks.reduce(
    (last, block, index) => (block.kind === 'text' ? index : last),
    -1,
  );

  const send = (message: string, onError: () => void) => {
    const composer = document.querySelector('.studio-composer textarea');
    if (composer)
      setEntrance({
        content: message,
        from: composer.getBoundingClientRect(),
      });
    scrollToLatest();
    setAnnouncement('');
    sendTurn.mutate(message, {
      onError,
      onSuccess: (response) => {
        if (response) setAnnouncement(t('transcript.replyReady'));
      },
    });
  };

  return (
    <div className="studio-transcript flex min-h-0 flex-col gap-4">
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </p>
      <div className="studio-transcript-body relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          data-testid="transcript-scroll"
          role="group"
          aria-label={t('transcript.label')}
          tabIndex={tabIndex}
          className="studio-scroll overflow-y-auto focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
        >
          <ul aria-label={t('transcript.label')} className="space-y-8">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                entranceFrom={
                  message.id < 0 &&
                  message.role === 'user' &&
                  entrance?.content === message.content
                    ? entrance.from
                    : undefined
                }
                messageRole={message.role}
                content={message.content}
                createdAt={message.created_at}
              />
            ))}
            {turn && !turn.userMessageReconciled && (
              <MessageBubble
                messageRole="user"
                content={turn.userMessage}
                createdAt={turn.startedAt}
              />
            )}
            {turn &&
              blocks.map((block, index) => {
                if (block.kind === 'text') {
                  return (
                    <MessageBubble
                      key={`turn-text-${index}`}
                      messageRole="assistant"
                      content={block.text}
                      createdAt={turn.startedAt}
                      streaming={index === lastTextIndex && replying}
                    />
                  );
                }
                if (block.kind === 'tool') {
                  return (
                    <ToolEventRow
                      key={`tool-${(sessionToolEvents ?? []).indexOf(block.toolEvent)}`}
                      toolEvent={block.toolEvent}
                    />
                  );
                }
                return (
                  <SubmitResultRow
                    key={`result-${(sessionSubmitResults ?? []).indexOf(block.result)}`}
                    result={block.result}
                  />
                );
              })}
            {turn?.status === 'typing' && <TypingIndicator />}
            {turn?.status === 'stopped' && (
              <li className="text-xs text-muted-foreground">
                {t('transcript.stopped')}
              </li>
            )}
            {turn?.status === 'failed' && turn.error && (
              <>
                <li className="text-2xs text-muted-foreground">
                  {t('transcript.failedPartial')}
                </li>
                <li>
                  <Banner
                    variant="destructive"
                    action={
                      turn.error.retryable ? (
                        <RetryButton
                          variant="outline"
                          size="sm"
                          className="h-11"
                          onClick={() =>
                            send(turn.userMessage, () =>
                              setDraft(turn.userMessage),
                            )
                          }
                        >
                          {tCommon('actions.retry')}
                        </RetryButton>
                      ) : undefined
                    }
                  >
                    {turn.error.message || t('transcript.failedFallback')}
                  </Banner>
                </li>
              </>
            )}
            {!turn &&
              (sessionToolEvents ?? []).map((toolEvent, index) => (
                <ToolEventRow key={`tool-${index}`} toolEvent={toolEvent} />
              ))}
            {!turn &&
              (sessionSubmitResults ?? []).map((result, index) => (
                <SubmitResultRow key={`result-${index}`} result={result} />
              ))}
          </ul>
        </div>
        {!pinned && (
          <Button
            variant="outline"
            className="absolute inset-x-0 bottom-4 mx-auto h-11 w-fit rounded-full bg-card"
            onClick={jumpToLatest}
          >
            {t('transcript.jumpToLatest')}
          </Button>
        )}
      </div>
      {conversation.submission_confirmed_at ? (
        <ArmedCard
          onSuggestion={() => setDraft(t('submitCard.armedSuggestion'))}
        />
      ) : (
        submitSuggested && (
          <SubmitSuggestionCard conversationId={conversationId} />
        )
      )}
      {!hasUserMessages && (
        <PromptCards onPick={(text) => send(text, () => setDraft(text))} />
      )}
      <Composer
        value={draft}
        onChange={setDraft}
        onSend={send}
        onStop={sendTurn.stop}
        replying={replying}
        quotaExhausted={quotaExhausted}
      />
    </div>
  );
};
