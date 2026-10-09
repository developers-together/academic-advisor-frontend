import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { paths } from '@/config/paths';
import { ApiError } from '@/lib/api-error';
import { registerInputSchema, useRegister } from '@/lib/auth';
import { useLanguageStore } from '@/lib/language';
import { cn } from '@/utils/cn';

type SignupFormProps = {
  onRegistered: (email: string) => void;
};

const resolver = zodResolver(registerInputSchema);

export const SignupForm = ({ onRegistered }: SignupFormProps) => {
  const { t } = useTranslation('auth');
  const register = useRegister();
  const language = useLanguageStore((state) => state.language);

  const form = useForm<z.input<typeof registerInputSchema>>({
    resolver,
    mode: 'onBlur',
    defaultValues: {
      email: '',
      studentId: '',
      nationalId: '',
      password: '',
      passwordConfirmation: '',
      language_preference: language,
    },
  });

  const submit = form.handleSubmit((values) => {
    register.mutate(values, {
      onSuccess: (result) => {
        if (result.kind === 'pending-verification') {
          onRegistered(result.email);
        }
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          if (error.status === 429) {
            form.setError('email', {
              message: t('common:errors.tooManyAttempts'),
            });
            return;
          }
          const fieldMap: Record<
            string,
            keyof z.input<typeof registerInputSchema>
          > = {
            email: 'email',
            student_id: 'studentId',
            national_id: 'nationalId',
            password: 'password',
            password_confirmation: 'passwordConfirmation',
          };
          for (const [key, messages] of Object.entries(error.fields)) {
            const field = fieldMap[key];
            if (field && messages[0]) {
              form.setError(field, { message: messages[0] });
            }
          }
        }
      },
    });
  });

  const languagePreference = form.watch('language_preference');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1">
        <Input
          type="email"
          label={t('signup.email')}
          autoComplete="email"
          error={form.formState.errors.email}
          registration={form.register('email')}
          className="h-11 text-base"
        />
        <p className="text-xs text-muted-foreground">
          {t('signup.emailHelper')}
        </p>
      </div>

      <div className="space-y-1">
        <Input
          inputMode="numeric"
          label={t('signup.studentId')}
          autoComplete="off"
          error={form.formState.errors.studentId}
          registration={form.register('studentId')}
          className="h-11 text-base"
        />
        <p className="text-xs text-muted-foreground">
          {t('signup.studentIdHelper')}
        </p>
      </div>

      <div className="space-y-1">
        <Input
          inputMode="numeric"
          label={t('signup.nationalId')}
          autoComplete="off"
          error={form.formState.errors.nationalId}
          registration={form.register('nationalId')}
          className="h-11 text-base"
        />
        <p className="text-xs text-muted-foreground">
          {t('signup.nationalIdHelper')}
        </p>
      </div>

      <div className="space-y-1">
        <Input
          type="password"
          label={t('signup.password')}
          autoComplete="new-password"
          error={form.formState.errors.password}
          registration={form.register('password')}
          className="h-11 text-base"
        />
        <p className="text-xs text-muted-foreground">
          {t('signup.passwordHelper')}
        </p>
      </div>

      <Input
        type="password"
        label={t('signup.passwordConfirmation')}
        autoComplete="new-password"
        error={form.formState.errors.passwordConfirmation}
        registration={form.register('passwordConfirmation')}
        className="h-11 text-base"
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t('signup.language')}</legend>
        <div
          className="grid grid-cols-2 gap-2"
          role="radiogroup"
          aria-label={t('signup.language')}
        >
          {(['en', 'ar'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={languagePreference === value}
              onClick={() => {
                form.setValue('language_preference', value);
                useLanguageStore.getState().setLanguage(value);
              }}
              className={cn(
                'h-11 rounded-md border text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
                languagePreference === value
                  ? 'border-crimson-300 bg-crimson-100 text-crimson-800'
                  : 'border-input bg-background hover:bg-accent',
              )}
            >
              {value === 'en' ? t('signup.languageEn') : t('signup.languageAr')}
            </button>
          ))}
        </div>
      </fieldset>

      <Button
        type="submit"
        isLoading={register.isPending}
        disabled={register.isPending}
        aria-busy={register.isPending}
        className="h-11 w-full"
      >
        {t('signup.submit')}
      </Button>

      <p className="text-sm">
        <Link
          to={paths.auth.login.getHref()}
          className="text-primary-text underline underline-offset-4 hover:decoration-2"
        >
          {t('registered.backToSignIn')}
        </Link>
      </p>
    </form>
  );
};
