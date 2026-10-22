import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { api } from '@/lib/api-client';
import { readableApiError } from '@/lib/api-error';
import { withPasswordAuthentication } from '@/lib/auth';

export const ResendVerificationForm = ({ email }: { email: string }) => {
  const { t } = useTranslation('auth');
  const [password, setPassword] = useState('');
  const resend = useMutation({
    mutationFn: async () => {
      await withPasswordAuthentication({ email, password }, () =>
        api.post('/email/verification-notification'),
      );
    },
    onSuccess: () => setPassword(''),
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        resend.mutate();
      }}
    >
      <p className="text-muted-foreground">{t('registered.resendHint')}</p>
      <Input
        type="password"
        autoComplete="current-password"
        label={t('login.password')}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <Button
        type="submit"
        variant="outline"
        disabled={!password || resend.isPending}
        isLoading={resend.isPending}
      >
        {t('registered.resend')}
      </Button>
      {resend.isSuccess && <p role="status">{t('registered.resent')}</p>}
      {resend.isError && (
        <p role="alert" className="text-destructive">
          {readableApiError(resend.error, t('common:errors.saveFailed'))}
        </p>
      )}
    </form>
  );
};
