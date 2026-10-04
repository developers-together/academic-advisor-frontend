import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';

import {
  useAiConfiguration,
  useUpdateAiConfiguration,
} from '../api/ai-configuration';

export const AiConfigurationDocument = () => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const configQuery = useAiConfiguration();
  const updateConfig = useUpdateAiConfiguration();

  const [draft, setDraft] = useState<{
    quota: string;
    enabled: boolean;
  } | null>(null);

  const config = configQuery.data;
  const quota =
    draft?.quota ?? (config ? String(config.quota_per_student) : '');
  const enabled = draft?.enabled ?? config?.assistant_enabled ?? true;
  const setQuota = (value: string) =>
    setDraft({ quota: value, enabled: draft?.enabled ?? enabled });
  const setEnabled = (value: boolean) =>
    setDraft({ quota: draft?.quota ?? quota, enabled: value });

  if (configQuery.isPending) {
    return (
      <div aria-busy="true" className="max-w-xl space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (configQuery.isError) {
    if (
      configQuery.error instanceof ApiError &&
      configQuery.error.status === 403
    ) {
      return <PermissionDenied audience="admin" />;
    }
    return (
      <ErrorState
        onRetry={() => void configQuery.refetch()}
        requestId={
          configQuery.error instanceof ApiError
            ? configQuery.error.requestId
            : null
        }
      />
    );
  }

  const dirty =
    config !== null &&
    config !== undefined &&
    draft !== null &&
    (Number(quota) !== config.quota_per_student ||
      enabled !== config.assistant_enabled);

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-muted-foreground">{t('ai.hint')}</p>

      <div>
        <label htmlFor="ai-quota" className="text-sm font-medium">
          {t('ai.quotaLabel')}
        </label>
        <input
          id="ai-quota"
          type="number"
          min={0}
          value={quota}
          onChange={(event) => setQuota(event.target.value)}
          className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-base tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t('ai.quotaHint')}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="ai-enabled"
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="size-5 rounded border-input"
        />
        <label htmlFor="ai-enabled" className="text-sm font-medium">
          {t('ai.enabledLabel')}
        </label>
      </div>

      <div>
        <Button
          disabled={!dirty}
          isLoading={updateConfig.isPending}
          aria-busy={updateConfig.isPending}
          onClick={() =>
            updateConfig.mutate(
              {
                quota_per_student: Math.max(0, Number(quota) || 0),
                assistant_enabled: enabled,
              },
              {
                onSuccess: () =>
                  addNotification({
                    type: 'success',
                    title: t('ai.saved'),
                  }),
              },
            )
          }
        >
          {t('ai.save')}
        </Button>
      </div>
    </div>
  );
};
