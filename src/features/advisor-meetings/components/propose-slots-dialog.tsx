import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notifications';
import { ApiError } from '@/lib/api-error';
import type { VisitRequest } from '@/types/domain';

import { useProposeVisitSlots } from '../api/propose-visit-slots';

import { emptySlotRow, slotRowError, SlotRowsField } from './slot-rows-field';

export type ProposeSlotsDialogProps = {
  request: VisitRequest;
  onClose: () => void;
};

export const ProposeSlotsDialog = ({
  request,
  onClose,
}: ProposeSlotsDialogProps) => {
  const { t } = useTranslation('advisor');
  const queryClient = useQueryClient();
  const addNotification = useNotifications((state) => state.addNotification);
  const proposeSlots = useProposeVisitSlots();
  const [rows, setRows] = useState([emptySlotRow()]);
  const [failed, setFailed] = useState(false);

  const invalid = rows.some((row) => slotRowError(row) !== null);

  const save = () => {
    setFailed(false);
    proposeSlots.mutate(
      { requestId: request.id, slots: rows },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            title: t('meetings.slotDialog.success', {
              name: request.student?.name,
            }),
          });
          onClose();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            void queryClient.invalidateQueries({
              queryKey: ['advisor', 'visit-requests'],
            });
            addNotification({
              type: 'info',
              title: t('common:errors.conflict'),
            });
            onClose();
            return;
          }
          setFailed(true);
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('meetings.slotDialog.title', { name: request.student?.name })}
          </DialogTitle>
          <DialogDescription>
            {t('meetings.slotDialog.timezone')}
          </DialogDescription>
        </DialogHeader>

        <SlotRowsField rows={rows} onRowsChange={setRows} />

        {failed && (
          <Banner variant="destructive" title={t('common:errors.loadFailed')}>
            {t('common:errors.loadFailedBody')}
          </Banner>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={save}
            disabled={invalid}
            isLoading={proposeSlots.isPending}
            aria-busy={proposeSlots.isPending}
          >
            {t('meetings.slotDialog.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
