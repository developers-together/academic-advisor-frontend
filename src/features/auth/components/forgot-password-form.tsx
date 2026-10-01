import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { paths } from '@/config/paths';
import { api } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, 'auth.errors.emailRequired')
    .email('auth.errors.emailInvalid'),
});

const resolver = zodResolver(forgotSchema);

export const ForgotPasswordForm = () => {
  const { t } = useTranslation('auth');
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const form = useForm<z.input<typeof forgotSchema>>({
    resolver,
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  const send = async (email: string) => {
    setPending(true);
    try {
      await api.post('/forgot-password', { email });
      setSentTo(email);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        form.setError('email', { message: t('common:errors.tooManyAttempts') });
      } else if (error instanceof ApiError) {
        const message = error.fields.email?.[0];
        if (message) {
          form.setError('email', { message });
        }
      }
    } finally {
      setPending(false);
    }
  };

  if (sentTo) {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          {t('forgot.sent.body', { email: sentTo })}
        </p>
        <p className="text-muted-foreground">{t('forgot.sent.nextStep')}</p>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="h-11"
            disabled={pending}
            onClick={() => {
              void send(sentTo);
            }}
          >
            {t('forgot.sent.sendAgain')}
          </Button>
          <Link
            to={paths.auth.login.getHref()}
            className="inline-flex h-11 items-center justify-center text-primary underline-offset-4 hover:underline"
          >
            {t('forgot.sent.backToSignIn')}
          </Link>
        </div>
      </div>
    );
  }

  const submit = form.handleSubmit((values) => {
    void send(values.email);
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="space-y-4"
      noValidate
    >
      <p className="text-sm text-muted-foreground">{t('forgot.context')}</p>
      <Input
        type="email"
        label={t('forgot.email')}
        autoComplete="email"
        error={form.formState.errors.email}
        registration={form.register('email')}
        className="h-11 text-base"
      />
      <Button
        type="submit"
        isLoading={pending}
        disabled={pending}
        aria-busy={pending}
        className="h-11 w-full"
      >
        {t('forgot.submit')}
      </Button>
    </form>
  );
};
