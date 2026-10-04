import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
export type ReasonDialogProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  reasonLabel?: string;
  reasonRequired?: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string | null) => void;
};

export const ReasonDialog = ({
  open,
  title,
  body,
  confirmLabel,
  reasonLabel,
  reasonRequired = false,
  pending = false,
  onCancel,
  onConfirm,
}: ReasonDialogProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  const blocked = reasonRequired && reason.trim().length === 0;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>

        {reasonLabel && (
          <div>
            <label htmlFor="meeting-reason" className="text-sm font-medium">
              {reasonLabel}
              {reasonRequired && <span aria-hidden> *</span>}
            </label>
            <textarea
              id="meeting-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={2000}
              aria-required={reasonRequired}
              className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason.trim() || null)}
            disabled={blocked}
            isLoading={pending}
            aria-busy={pending}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
