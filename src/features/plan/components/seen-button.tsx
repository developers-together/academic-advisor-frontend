import { useRef, useState } from 'react';
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

export type SeenButtonProps = {
  pending: boolean;
  onConfirm: () => void;
  className?: string;
};

export const SeenButton = ({
  pending,
  onConfirm,
  className,
}: SeenButtonProps) => {
  const { t } = useTranslation('plan');
  const [open, setOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        className={className}
        onClick={() => setOpen(true)}
        isLoading={pending}
        disabled={pending}
      >
        {t('myPlan.seen')}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !next && setOpen(false)}>
        <DialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('myPlan.seenConfirm.title')}</DialogTitle>
            <DialogDescription>
              {t('myPlan.seenConfirm.body')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              ref={cancelRef}
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {t('myPlan.seenConfirm.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
