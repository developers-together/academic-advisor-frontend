import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-error';
import { loginInputSchema, useLogin } from '@/lib/auth';
import type { User } from '@/types/domain';

type LoginFormProps = {
  onSuccess: (user: User) => void;
};

const resolver = zodResolver(loginInputSchema);

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { t } = useTranslation('auth');
  const login = useLogin();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<z.input<typeof loginInputSchema>>({
    resolver,
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  const submit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: (user) => onSuccess(user),
      onError: (error) => {
        if (error instanceof ApiError) {
          if (error.status === 429) {
            form.setError('email', {
              message: t('common:errors.tooManyAttempts'),
            });
            return;
          }
          for (const [field, messages] of Object.entries(error.fields)) {
            if ((field === 'email' || field === 'password') && messages[0]) {
              form.setError(field, { message: messages[0] });
            }
          }
        }
      },
    });
  });

  return (
    <div>
      {searchParams.get('reason') === 'expired' && (
        <div
          role="status"
          className="mb-4 rounded-md border border-info/30 bg-info/5 p-3 text-sm text-foreground"
        >
          {t('common:errors.sessionEnded')}
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="space-y-4"
        noValidate
      >
        <Input
          type="email"
          label={t('login.email')}
          autoComplete="email"
          error={form.formState.errors['email']}
          registration={form.register('email')}
          className="h-11 text-base"
        />
        <div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label={t('login.password')}
              autoComplete="current-password"
              error={form.formState.errors['password']}
              registration={form.register('password')}
              className="h-11 pe-11 text-base"
            />
            <button
              type="button"
              aria-label={
                showPassword
                  ? t('login.passwordHide')
                  : t('login.passwordReveal')
              }
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-e-1 top-6 flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          isLoading={login.isPending}
          disabled={login.isPending}
          aria-busy={login.isPending}
          className="h-11 w-full"
        >
          {t('login.submit')}
        </Button>
      </form>
      <div className="mt-4 flex flex-col gap-2 text-sm">
        <Link
          to={paths.auth.forgotPassword.getHref()}
          className="text-primary-text underline underline-offset-4 hover:decoration-2"
        >
          {t('login.forgot')}
        </Link>
        <span className="flex flex-col gap-3 text-muted-foreground">
          <Link
            to={paths.auth.signup.getHref()}
            className="text-primary-text underline underline-offset-4 hover:decoration-2"
          >
            {t('login.signup')}
          </Link>{' '}
          {t('login.signupHint')}
        </span>
      </div>
    </div>
  );
};
