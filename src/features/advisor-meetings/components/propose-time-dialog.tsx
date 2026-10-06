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
import type { MeetingRequest } from '@/types/domain';

import { useProposeMeetingTimes } from '../api/meeting-mutations';
import { slotInputsToInstants } from '../api/slot-inputs';
import type { SlotInput } from '../api/slot-inputs';

import { emptySlotRow, slotRowError, SlotRowsField } from './slot-rows-field';

export type ProposeTimeDialogProps = {
  meeting: MeetingRequest;
  onClose: () => void;
};

export const ProposeTimeDialog = ({
  meeting,
  onClose,
}: ProposeTimeDialogProps) => {
  const { t } = useTranslation('advisor');
  const addNotification = useNotifications((state) => state.addNotification);
  const propose = useProposeMeetingTimes();
  const [rows, setRows] = useState<SlotInput[]>([emptySlotRow()]);
  const [failed, setFailed] = useState(false);

  const invalid = rows.some((row) => slotRowError(row) !== null);

  const save = () => {
    setFailed(false);
    propose.mutate(
      {
        id: meeting.id,
        input: slotInputsToInstants(rows),
      },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            title: t('meetings.proposeDialog.success', {
              name: meeting.student.name,
            }),
          });
          onClose();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
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
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('meetings.proposeDialog.title', { name: meeting.student.name })}
          </DialogTitle>
          <DialogDescription>
            {t('meetings.proposeDialog.body')}
          </DialogDescription>
        </DialogHeader>

        <SlotRowsField rows={rows} onRowsChange={setRows} />

        {failed && (
          <Banner variant="destructive" title={t('common:errors.sendFailed')}>
            {t('common:errors.sendFailedBody')}
          </Banner>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={save}
            disabled={invalid || rows.length === 0}
            isLoading={propose.isPending}
            aria-busy={propose.isPending}
          >
            {t('meetings.proposeDialog.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
