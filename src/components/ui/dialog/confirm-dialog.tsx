import { useRef } from 'react';
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
} from './dialog';

export type ConfirmDialogProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  error?: string | null;
};

export const ConfirmDialog = ({
  open,
  onCancel,
  onConfirm,
  title,
  body,
  confirmLabel,
  destructive = false,
  pending = false,
  error = null,
}: ConfirmDialogProps) => {
  const { t } = useTranslation();
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        {error && <Banner variant="destructive">{error}</Banner>}
        <DialogFooter>
          <Button ref={cancelRef} variant="outline" onClick={onCancel}>
            {t('actions.cancel')}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            isLoading={pending}
            disabled={pending}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
