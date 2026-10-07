import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/components/ui/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';

import { useCurrentTerm, useUpdateCurrentTerm } from '../api/academics';

const KINDS = ['fall', 'spring', 'summer'] as const;

const fieldClass =
  'mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden';

export const CurrentTermForm = () => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const termQuery = useCurrentTerm();
  const updateTerm = useUpdateCurrentTerm();

  const [draft, setDraft] = useState<Partial<
    Record<'code' | 'kind' | 'opens' | 'closes' | 'starts', string>
  > | null>(null);

  const term = termQuery.data;
  const value = (field: keyof NonNullable<typeof draft>) =>
    draft?.[field] ?? term?.[field] ?? '';

  if (termQuery.isPending) {
    return (
      <Card aria-busy="true">
        <CardHeader>
          <CardTitle>{t('academics.currentTerm.title')}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </CardBody>
      </Card>
    );
  }

  if (termQuery.isError) {
    if (termQuery.error instanceof ApiError && termQuery.error.status === 403) {
      return <PermissionDenied audience="admin" />;
    }
    return (
      <ErrorState
        onRetry={() => void termQuery.refetch()}
        requestId={
          termQuery.error instanceof ApiError ? termQuery.error.requestId : null
        }
      />
    );
  }

  const dirty =
    draft !== null &&
    (Object.keys(draft) as Array<keyof NonNullable<typeof draft>>).some(
      (field) => draft[field] !== term?.[field],
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('academics.currentTerm.title')}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('academics.currentTerm.context')}
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="current-term-code" className="text-sm font-medium">
              {t('academics.currentTerm.code')}
            </label>
            <input
              id="current-term-code"
              value={value('code')}
              onChange={(event) =>
                setDraft({ ...draft, code: event.target.value })
              }
              className={`${fieldClass} tabular-nums`}
            />
          </div>
          <div>
            <label htmlFor="current-term-kind" className="text-sm font-medium">
              {t('academics.currentTerm.kind')}
            </label>
            <select
              id="current-term-kind"
              value={value('kind')}
              onChange={(event) =>
                setDraft({ ...draft, kind: event.target.value })
              }
              className={fieldClass}
            >
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`academics.currentTerm.kind_${kind}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="current-term-opens" className="text-sm font-medium">
              {t('academics.currentTerm.opens')}
            </label>
            <input
              id="current-term-opens"
              type="date"
              value={value('opens')}
              onChange={(event) =>
                setDraft({ ...draft, opens: event.target.value })
              }
              className={`${fieldClass} tabular-nums`}
            />
          </div>
          <div>
            <label
              htmlFor="current-term-closes"
              className="text-sm font-medium"
            >
              {t('academics.currentTerm.closes')}
            </label>
            <input
              id="current-term-closes"
              type="date"
              value={value('closes')}
              onChange={(event) =>
                setDraft({ ...draft, closes: event.target.value })
              }
              className={`${fieldClass} tabular-nums`}
            />
          </div>
          <div>
            <label
              htmlFor="current-term-starts"
              className="text-sm font-medium"
            >
              {t('academics.currentTerm.starts')}
            </label>
            <input
              id="current-term-starts"
              type="date"
              value={value('starts')}
              onChange={(event) =>
                setDraft({ ...draft, starts: event.target.value })
              }
              className={`${fieldClass} tabular-nums`}
            />
          </div>
        </div>
        <div>
          <Button
            disabled={!dirty}
            isLoading={updateTerm.isPending}
            aria-busy={updateTerm.isPending}
            onClick={() =>
              term &&
              updateTerm.mutate(
                {
                  code: value('code'),
                  kind: value('kind'),
                  opens: value('opens'),
                  closes: value('closes'),
                  starts: value('starts'),
                },
                {
                  onSuccess: () => {
                    setDraft(null);
                    addNotification({
                      type: 'success',
                      title: t('academics.currentTerm.saved'),
                    });
                  },
                  onError: () =>
                    addNotification({
                      type: 'error',
                      title: t('common:errors.saveFailed'),
                    }),
                },
              )
            }
          >
            {t('academics.currentTerm.save')}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
