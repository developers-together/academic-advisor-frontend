import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import { readableApiError, ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';
import type { RegistrationWindow } from '@/types/domain';

import {
  useRegistrationWindows,
  useUpdateRegistrationWindow,
} from '../api/registration-windows';

const localDateTime = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
};

const WindowDates = ({ entry }: { entry: RegistrationWindow }) => {
  const { t } = useTranslation('admin');
  const updateWindow = useUpdateRegistrationWindow();
  const addNotification = useNotifications((state) => state.addNotification);
  const [opens, setOpens] = useState(localDateTime(entry.opens_at));
  const [closes, setCloses] = useState(localDateTime(entry.closes_at));
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 rounded-lg border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        if (!opens || !closes || new Date(opens) >= new Date(closes)) {
          setError(t('windows.dateOrder'));
          return;
        }
        updateWindow.mutate(
          {
            id: entry.id,
            input: {
              opens_at: new Date(opens).toISOString(),
              closes_at: new Date(closes).toISOString(),
            },
          },
          {
            onSuccess: () =>
              addNotification({ type: 'success', title: t('windows.saved') }),
            onError: (failure) =>
              setError(
                readableApiError(failure, t('common:errors.saveFailed')),
              ),
          },
        );
      }}
    >
      <h2 className="text-sm font-semibold">{entry.term_code}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          type="datetime-local"
          label={t('windows.columns.opens')}
          value={opens}
          onChange={(event) => setOpens(event.target.value)}
          required
        />
        <Input
          type="datetime-local"
          label={t('windows.columns.closes')}
          value={closes}
          onChange={(event) => setCloses(event.target.value)}
          required
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={updateWindow.isPending}
        isLoading={updateWindow.isPending}
      >
        {t('common:actions.save')}
      </Button>
    </form>
  );
};

export const RegistrationWindowsDocument = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const windowsQuery = useRegistrationWindows();

  if (windowsQuery.isPending)
    return <Skeleton className="h-40 w-full max-w-3xl" />;
  if (windowsQuery.isError) {
    if (
      windowsQuery.error instanceof ApiError &&
      windowsQuery.error.status === 403
    )
      return <PermissionDenied audience="admin" />;
    return <ErrorState onRetry={() => void windowsQuery.refetch()} />;
  }
  if (windowsQuery.data.length === 0)
    return (
      <EmptyState
        compact
        title={t('windows.empty.title')}
        description={t('windows.empty.body')}
        action={{
          label: t('windows.empty.action'),
          onClick: () => navigate(paths.admin.academics.getHref()),
        }}
      />
    );

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">{t('windows.hint')}</p>
      {windowsQuery.data.map((entry) => (
        <WindowDates
          key={`${entry.id}:${entry.opens_at}:${entry.closes_at}`}
          entry={entry}
        />
      ))}
    </div>
  );
};
