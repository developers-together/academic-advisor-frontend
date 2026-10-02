import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner, ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/dialog/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';
import type { AvailabilityWindowRow } from '@/types/domain';

import { useAvailability } from '../api/get-availability';
import { useUpdateAvailability } from '../api/update-availability';

import { SlotEditor } from './slot-editor';

export const HoursDocument = () => {
  const { t } = useTranslation('advisor');
  const availabilityQuery = useAvailability();
  const updateAvailability = useUpdateAvailability();
  const [clearDone, setClearDone] = useState(false);
  const [addingFirstRow, setAddingFirstRow] = useState(false);

  const publish = (rows: AvailabilityWindowRow[]) => {
    updateAvailability.mutate(rows);
  };

  const clearHours = () => {
    updateAvailability.mutate([], { onSuccess: () => setClearDone(true) });
  };

  if (availabilityQuery.isPending) {
    return (
      <div aria-busy="true" className="max-w-xl space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (availabilityQuery.isError) {
    if (
      availabilityQuery.error instanceof ApiError &&
      availabilityQuery.error.status === 403
    ) {
      return <PermissionDenied audience="advisor" />;
    }
    return (
      <ErrorState
        onRetry={() => void availabilityQuery.refetch()}
        requestId={
          availabilityQuery.error instanceof ApiError
            ? availabilityQuery.error.requestId
            : null
        }
      />
    );
  }

  const availability = availabilityQuery.data;

  if (!availability || availability.rows.length === 0) {
    if (addingFirstRow) {
      return (
        <div className="max-w-xl">
          <SlotEditor
            initialRows={[{ day: 'Sunday', from: '', to: '' }]}
            onSubmit={publish}
            submitPending={updateAvailability.isPending}
          />
        </div>
      );
    }
    return (
      <EmptyState
        compact
        className="max-w-xl"
        title={t('hours.empty.title')}
        description={t('hours.empty.body')}
        action={{
          label: t('hours.addRow'),
          onClick: () => setAddingFirstRow(true),
        }}
      />
    );
  }

  return (
    <div className="max-w-xl space-y-4">
      {availability.is_default && (
        <Banner variant="info">{t('hours.defaultNotice')}</Banner>
      )}

      <SlotEditor
        key={JSON.stringify(availability.rows)}
        initialRows={availability.rows}
        onSubmit={publish}
        submitPending={updateAvailability.isPending}
      />

      {!availability.is_default && (
        <ConfirmationDialog
          triggerButton={
            <Button variant="outline" disabled={updateAvailability.isPending}>
              {t('hours.clear')}
            </Button>
          }
          confirmButton={
            <Button
              variant="destructive"
              onClick={clearHours}
              isLoading={updateAvailability.isPending}
              disabled={updateAvailability.isPending}
            >
              {t('hours.clearConfirm.confirm')}
            </Button>
          }
          title={t('hours.clearConfirm.title')}
          body={t('hours.clearConfirm.body')}
          cancelButtonText={t('actions.cancel', { ns: 'common' })}
          isDone={clearDone}
        />
      )}
    </div>
  );
};
