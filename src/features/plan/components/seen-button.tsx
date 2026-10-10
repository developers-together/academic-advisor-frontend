import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { ApiError } from '@/lib/api-error';

export type SeenButtonProps = {
  pending: boolean;
  onConfirm: () => Promise<unknown>;
  className?: string;
};

export const SeenButton = ({
  pending,
  onConfirm,
  className,
}: SeenButtonProps) => {
  const { t } = useTranslation('plan');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = async () => {
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure.message
          : t('common:errors.saveFailed'),
      );
    }
  };
  return (
    <>
      <Button
        className={className}
        disabled={pending}
        isLoading={pending}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {t('myPlan.seen')}
      </Button>
      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={() => void confirm()}
        pending={pending}
        error={error}
        title={t('myPlan.seenConfirm.title')}
        body={t('myPlan.seenConfirm.body')}
        confirmLabel={t('myPlan.seenConfirm.confirm')}
      />
    </>
  );
};
