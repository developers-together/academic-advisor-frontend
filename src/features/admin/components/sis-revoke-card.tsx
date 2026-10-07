import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notifications';

import { useRevokeSisMirror } from '../api/academics';

export const SisRevokeCard = () => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const revoke = useRevokeSisMirror();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('academics.sisRevoke.title')}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('academics.sisRevoke.context')}
        </p>
      </CardHeader>
      <CardBody>
        <Button
          variant="outline"
          className="h-11 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          {t('academics.sisRevoke.revoke')}
        </Button>
      </CardBody>

      <ConfirmDialog
        open={confirmOpen}
        title={t('academics.sisRevoke.confirmTitle')}
        body={t('academics.sisRevoke.confirmBody')}
        confirmLabel={t('academics.sisRevoke.revoke')}
        destructive
        pending={revoke.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          revoke.mutate(undefined, {
            onSuccess: () => {
              setConfirmOpen(false);
              addNotification({
                type: 'success',
                title: t('academics.sisRevoke.revoked'),
              });
            },
            onError: () =>
              addNotification({
                type: 'error',
                title: t('common:errors.saveFailed'),
              }),
          })
        }
      />
    </Card>
  );
};
