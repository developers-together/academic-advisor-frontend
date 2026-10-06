import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';
import { formatDate } from '@/lib/i18n/format';

import {
  useRegistrationWindows,
  useUpdateRegistrationWindow,
} from '../api/registration-windows';

export const RegistrationWindowsDocument = () => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const windowsQuery = useRegistrationWindows();
  const updateWindow = useUpdateRegistrationWindow();
  const [closeTerm, setCloseTerm] = useState<{
    id: number;
    term: string;
  } | null>(null);

  if (windowsQuery.isPending) {
    return (
      <div aria-busy="true" className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (windowsQuery.isError) {
    if (
      windowsQuery.error instanceof ApiError &&
      windowsQuery.error.status === 403
    ) {
      return <PermissionDenied audience="admin" />;
    }
    return (
      <ErrorState
        onRetry={() => void windowsQuery.refetch()}
        requestId={
          windowsQuery.error instanceof ApiError
            ? windowsQuery.error.requestId
            : null
        }
      />
    );
  }

  const windows = windowsQuery.data;

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">{t('windows.hint')}</p>
      <TableElement>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>{t('windows.columns.term')}</TableHead>
            <TableHead>{t('windows.columns.opens')}</TableHead>
            <TableHead>{t('windows.columns.closes')}</TableHead>
            <TableHead>{t('windows.columns.state')}</TableHead>
            <TableHead className="text-end">
              {t('windows.columns.actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {windows.map((entry) => (
            <TableRow key={entry.id} className="border-border">
              <TableCell className="px-3 py-2 text-sm font-medium">
                {entry.term_code}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm tabular-nums">
                {formatDate(entry.opens_at)}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm tabular-nums">
                {formatDate(entry.closes_at)}
              </TableCell>
              <TableCell className="px-3 py-2">
                {entry.is_active ? (
                  <Badge variant="success">{t('windows.active')}</Badge>
                ) : (
                  <Badge>{t('windows.inactive')}</Badge>
                )}
              </TableCell>
              <TableCell className="px-3 py-2 text-end">
                {entry.is_active ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={updateWindow.isPending}
                    onClick={() =>
                      setCloseTerm({ id: entry.id, term: entry.term_code })
                    }
                  >
                    {t('windows.deactivate')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateWindow.isPending}
                    onClick={() =>
                      updateWindow.mutate(
                        { id: entry.id, input: { is_active: true } },
                        {
                          onSuccess: () =>
                            addNotification({
                              type: 'success',
                              title: t('windows.activated', {
                                term: entry.term_code,
                              }),
                            }),
                          onError: () =>
                            addNotification({
                              type: 'error',
                              title: t('common:errors.saveFailed'),
                            }),
                        },
                      )
                    }
                  >
                    {t('windows.activate')}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableElement>

      <ConfirmDialog
        open={closeTerm !== null}
        onCancel={() => setCloseTerm(null)}
        title={t('windows.deactivateConfirm.title', {
          term: closeTerm?.term,
        })}
        body={t('windows.deactivateConfirm.body', {
          term: closeTerm?.term,
        })}
        confirmLabel={t('windows.deactivateConfirm.confirm')}
        onConfirm={() => {
          if (closeTerm === null) return;
          updateWindow.mutate(
            { id: closeTerm.id, input: { is_active: false } },
            {
              onSuccess: () => {
                addNotification({
                  type: 'info',
                  title: t('windows.deactivated', { term: closeTerm.term }),
                });
                setCloseTerm(null);
              },
              onError: () => {
                addNotification({
                  type: 'error',
                  title: t('common:errors.saveFailed'),
                });
                setCloseTerm(null);
              },
            },
          );
        }}
      />
    </div>
  );
};
