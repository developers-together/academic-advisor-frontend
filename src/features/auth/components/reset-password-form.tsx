import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { z } from 'zod';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { paths } from '@/config/paths';
import { api } from '@/lib/api-client';
import { ApiError, readableApiError } from '@/lib/api-error';

const resetSchema = z
  .object({
    password: z.string().min(8, 'auth:errors.passwordMin'),
    passwordConfirmation: z.string().min(1, 'auth:errors.passwordConfirmation'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'auth:errors.passwordMismatch',
    path: ['passwordConfirmation'],
  });

const resolver = zodResolver(resetSchema);

export const ResetPasswordForm = () => {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [done, setDone] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<z.input<typeof resetSchema>>({
    resolver,
    mode: 'onBlur',
    defaultValues: { password: '', passwordConfirmation: '' },
  });

  const reset = async (password: string, passwordConfirmation: string) => {
    setPending(true);
    setSubmitError(null);
    try {
      await api.post('/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        setSubmitError(t('common:errors.tooManyAttempts'));
      } else {
        setSubmitError(
          readableApiError(error, t('common:errors.sendFailedBody')),
        );
      }
    } finally {
      setPending(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="space-y-4 text-sm">
        <p className="font-medium">{t('reset.invalidTitle')}</p>
        <p className="text-muted-foreground">{t('reset.invalidBody')}</p>
        <Button asChild variant="outline" className="h-11">
          <Link to={paths.auth.forgotPassword.getHref()}>
            {t('reset.invalidAction')}
          </Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-sm">
        <p className="font-medium">{t('reset.successTitle')}</p>
        <p className="text-muted-foreground">{t('reset.successBody')}</p>
        <Button asChild className="h-11">
          <Link to={paths.auth.login.getHref()}>
            {t('reset.successAction')}
          </Link>
        </Button>
      </div>
    );
  }

  const submit = form.handleSubmit((values) => {
    void reset(values.password, values.passwordConfirmation);
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
      <p className="text-sm text-muted-foreground">
        {t('reset.context', { email })}
      </p>
      {submitError && <Banner variant="destructive">{submitError}</Banner>}
      <Input
        type="password"
        label={t('reset.password')}
        autoComplete="new-password"
        error={form.formState.errors.password}
        registration={form.register('password')}
        className="h-11 text-base"
      />
      <Input
        type="password"
        label={t('reset.passwordConfirmation')}
        autoComplete="new-password"
        error={form.formState.errors.passwordConfirmation}
        registration={form.register('passwordConfirmation')}
        className="h-11 text-base"
      />
      <Button
        type="submit"
        isLoading={pending}
        disabled={pending}
        aria-busy={pending}
        className="h-11 w-full"
      >
        {t('reset.submit')}
      </Button>
    </form>
  );
};
