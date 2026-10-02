import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/form';
import { formatDateTime } from '@/lib/i18n/format';
import type { PlanComment } from '@/types/domain';

export type CommentThreadProps = {
  comments: PlanComment[];
  submitPending?: boolean;
  onSubmit: (body: string) => void;
  className?: string;
};

export const CommentThread = ({
  comments,
  submitPending = false,
  onSubmit,
  className,
}: CommentThreadProps) => {
  const { t } = useTranslation('advisor');

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

  const submit = form.handleSubmit((values) => {
    onSubmit(values.body.trim());
    form.reset({ body: '' });
  });

  return (
    <section
      aria-label={t('review.comments.title')}
      className={className}
      aria-busy={submitPending}
    >
      <h2 className="text-sm font-semibold">{t('review.comments.title')}</h2>
      {comments.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {t('review.comments.empty')}
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="border-b pb-3 last:border-b-0">
              <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
              <p className="mt-1 text-2xs text-muted-foreground">
                <span>{comment.author.name}</span>
                <span aria-hidden> · </span>
                <time dateTime={comment.created_at}>
                  {formatDateTime(comment.created_at)}
                </time>
              </p>
            </li>
          ))}
        </ul>
      )}
      <form
        noValidate
        className="mt-4 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Textarea
          label={t('review.comments.placeholder')}
          error={form.formState.errors['body']}
          registration={form.register('body')}
          placeholder={t('review.comments.placeholder')}
          className="min-h-20 text-sm"
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
    </section>
  );
};
