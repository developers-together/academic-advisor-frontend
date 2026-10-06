import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/form';
import { formatDateTime } from '@/lib/i18n/format';
import type { PlanComment } from '@/types/domain';
import { cn } from '@/utils/cn';

export type CommentThreadProps = {
  comments: PlanComment[];
  submitPending?: boolean;
  onSubmit?: (body: string) => void | Promise<unknown>;
  unreadAfter?: string | null;
  title?: string;
  emptyText?: string;
  className?: string;
};

const isUnread = (comment: PlanComment, unreadAfter: string | null) =>
  unreadAfter !== null &&
  dayjs(comment.created_at).valueOf() > dayjs(unreadAfter).valueOf();

export const CommentThread = ({
  comments,
  submitPending = false,
  onSubmit,
  unreadAfter = null,
  title,
  emptyText,
  className,
}: CommentThreadProps) => {
  const { t } = useTranslation('advisor');

  const heading = title ?? t('review.comments.title');
  const empty = emptyText ?? t('review.comments.empty');

  const schema = useMemo(
    () =>
      z.object({
        body: z
          .string()
          .trim()
          .min(1, { message: t('review.comments.required') })
          .max(2000, { message: t('review.comments.maxLength') }),
      }),
    [t],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { body: '' },
  });
  const [postFailed, setPostFailed] = useState(false);

  const submit = form.handleSubmit(async (values) => {
    setPostFailed(false);
    try {
      await onSubmit?.(values.body.trim());
      form.reset({ body: '' });
    } catch {
      setPostFailed(true);
    }
  });

  return (
    <section
      aria-label={heading}
      className={className}
      aria-busy={submitPending}
    >
      <h2 className="text-sm font-semibold">{heading}</h2>
      {comments.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {comments.map((comment) => {
            const unread = isUnread(comment, unreadAfter);
            return (
              <li
                key={comment.id}
                className={cn('rounded-lg p-3', unread && 'bg-crimson-100')}
              >
                <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                <p className="mt-1 flex items-center gap-2 text-2xs text-muted-foreground">
                  <span>{comment.author.name}</span>
                  <span aria-hidden> · </span>
                  <time dateTime={comment.created_at}>
                    {formatDateTime(comment.created_at)}
                  </time>
                  {unread && (
                    <Badge variant="neutral" size="sm">
                      {t('badges.new', { ns: 'common' })}
                    </Badge>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      {onSubmit && (
        <form
          noValidate
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {postFailed && (
            <Banner variant="destructive" title={t('review.comments.failed')}>
              <p className="text-sm text-muted-foreground">
                {t('review.comments.failedBody')}
              </p>
            </Banner>
          )}
          <Textarea
            label={t('review.comments.placeholder')}
            error={form.formState.errors['body']}
            registration={form.register('body')}
            placeholder={t('review.comments.placeholder')}
            className="min-h-20"
          />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            isLoading={submitPending}
            disabled={submitPending}
          >
            {t('review.comments.submit')}
          </Button>
        </form>
      )}
    </section>
  );
};
