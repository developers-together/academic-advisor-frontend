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

import { useOpenSlots } from '../api/get-open-slots';
import { useConfirmMeetingRequest } from '../api/meeting-mutations';

import { SlotPicker } from './slot-picker';

export type ConfirmMeetingDialogProps = {
  meeting: MeetingRequest;
  onClose: () => void;
};

export const ConfirmMeetingDialog = ({
  meeting,
  onClose,
}: ConfirmMeetingDialogProps) => {
  const { t } = useTranslation('advisor');
  const addNotification = useNotifications((state) => state.addNotification);
  const openSlots = useOpenSlots(true);
  const confirmRequest = useConfirmMeetingRequest();
  const [selected, setSelected] = useState<string[]>(
    meeting.slots.length > 0 && meeting.selected_slot_id === null
      ? [
          `${Date.parse(meeting.slots[0].starts_at)}-${Date.parse(
            meeting.slots[0].ends_at,
          )}`,
        ]
      : [],
  );
  const [failed, setFailed] = useState<string | null>(null);

  const save = () => {
    setFailed(null);
    const [startsAt, endsAt] = selected[0]
      .split('-')
      .map((value) => new Date(Number(value)).toISOString());
    confirmRequest.mutate(
      { id: meeting.id, input: { startsAt, endsAt } },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            title: t('meetings.confirmDialog.success', {
              name: meeting.student.name,
            }),
          });
          onClose();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            setFailed(t('meetings.confirmDialog.conflict'));
            return;
          }
          setFailed(t('common:errors.sendFailed'));
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('meetings.confirmDialog.title', { name: meeting.student.name })}
          </DialogTitle>
          <DialogDescription>
            {t('meetings.confirmDialog.body')}
          </DialogDescription>
        </DialogHeader>

        <SlotPicker
          slots={openSlots.data}
          isPending={openSlots.isPending}
          mode="single"
          selected={selected}
          onSelectedChange={setSelected}
        />

        {failed && (
          <Banner variant="destructive" title={failed}>
            {t('meetings.confirmDialog.conflictBody')}
          </Banner>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={save}
            disabled={selected.length === 0}
            isLoading={confirmRequest.isPending}
            aria-busy={confirmRequest.isPending}
          >
            {t('meetings.confirmDialog.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
