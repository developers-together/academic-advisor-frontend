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
import type { StudentSummary } from '@/types/domain';

import { useCreateVisitRequest } from '../api/create-visit-request';
import type { VisitSlotInput } from '../api/create-visit-request';

import { slotRowError, SlotRowsField } from './slot-rows-field';

export type RequestMeetingDialogProps = {
  student: StudentSummary;
  onClose: () => void;
};

export const RequestMeetingDialog = ({
  student,
  onClose,
}: RequestMeetingDialogProps) => {
  const { t } = useTranslation('advisor');
  const queryClient = useQueryClient();
  const addNotification = useNotifications((state) => state.addNotification);
  const createRequest = useCreateVisitRequest();
  const [rows, setRows] = useState<VisitSlotInput[]>([]);
  const [failed, setFailed] = useState(false);

  const invalid = rows.some((row) => slotRowError(row) !== null);

  const save = () => {
    setFailed(false);
    createRequest.mutate(
      { studentId: student.id, slots: rows },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            title: t('meetings.requestDialog.success', { name: student.name }),
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
            {t('meetings.requestDialog.title', { name: student.name })}
          </DialogTitle>
          <DialogDescription>
            {t('meetings.requestDialog.body')}
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
            disabled={invalid || rows.length === 0}
            isLoading={createRequest.isPending}
            aria-busy={createRequest.isPending}
          >
            {t('meetings.requestDialog.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
