import { zodResolver } from '@hookform/resolvers/zod';
import { FormEvent, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { ApiError } from '@/lib/api-error';
import type { User } from '@/types/domain';

import { useCorrectStudentId } from '../api/correct-student-id';
import { useDeleteStudent } from '../api/delete-student';
import { useReactivateStudent } from '../api/reactivate-student';
import { useReassignStudent } from '../api/reassign-student';
import { useRetryStudentSis } from '../api/retry-student-sis';
import { useSuspendStudent } from '../api/suspend-student';
import {
  accountAssigned,
  accountBinding,
  accountStatus,
  type AccountBinding,
} from '../utils/account-state';

import { EditAccountDialog } from './edit-account-dialog';

type ConfirmTarget = 'suspend' | 'correctId' | 'delete';

const correctIdSchema = z.object({
  student_id: z
    .string()
    .trim()
    .min(1)
    .regex(/^\d{1,20}$/),
});

type CorrectIdValues = z.infer<typeof correctIdSchema>;

const BINDING_BADGE_VARIANT: Record<
  AccountBinding,
  'success' | 'warning' | 'destructive'
> = {
  bound: 'success',
  pending: 'warning',
  failed: 'destructive',
};

const BINDING_BADGE_KEY: Record<AccountBinding, string> = {
  bound: 'bound',
  pending: 'bindingPending',
  failed: 'bindingFailed',
};

export type AccountPanelProps = {
  user: User;
  onClose: () => void;
};

export const AccountPanel = ({ user, onClose }: AccountPanelProps) => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);

  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(
    null,
  );
  const [pendingCorrectId, setPendingCorrectId] = useState<string | null>(null);
  const [sisBanner, setSisBanner] = useState<string | null>(null);
  const [reassignEmail, setReassignEmail] = useState('');
  const [reassignMessage, setReassignMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const suspend = useSuspendStudent();
  const reactivate = useReactivateStudent();
  const retrySis = useRetryStudentSis();
  const correctId = useCorrectStudentId();
  const remove = useDeleteStudent();
  const reassign = useReassignStudent();

  const correctForm = useForm<CorrectIdValues>({
    resolver: zodResolver(correctIdSchema),
    mode: 'onBlur',
    defaultValues: { student_id: '' },
  });

  const status = accountStatus(user);
  const binding = accountBinding(user);

  const handleRetrySis = () => {
    setSisBanner(null);
    retrySis.mutate(user.id, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: t('accounts.retryQueued'),
        });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 503) {
          setSisBanner(error.message);
        } else if (error instanceof ApiError && error.status === 409) {
          addNotification({
            type: 'info',
            title: t('common:errors.conflict'),
          });
        }
      },
    });
  };

  const openCorrectConfirm = correctForm.handleSubmit(({ student_id }) => {
    setPendingCorrectId(student_id);
    setConfirmTarget('correctId');
  });

  const handleConfirm = () => {
    if (confirmTarget === 'suspend') {
      suspend.mutate(user.id, { onSettled: () => setConfirmTarget(null) });
    } else if (confirmTarget === 'correctId' && pendingCorrectId) {
      correctId.mutate(
        { studentId: user.id, student_id: pendingCorrectId },
        {
          onSuccess: () => correctForm.reset({ student_id: '' }),
          onSettled: () => {
            setConfirmTarget(null);
            setPendingCorrectId(null);
          },
        },
      );
    } else if (confirmTarget === 'delete') {
      remove.mutate(user.id, {
        onSuccess: () => onClose(),
        onSettled: () => setConfirmTarget(null),
      });
    }
  };

  const handleReassign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReassignMessage(null);
    reassign.mutate(
      { studentId: user.id, advisor_email: reassignEmail.trim().toLowerCase() },
      {
        onSuccess: () => {
          setReassignEmail('');
          setReassignMessage(
            t('accounts.reassignSuccess', { name: user.name }),
          );
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 422) {
            setReassignMessage(
              error.fields['advisor_email']?.[0] ?? error.message,
            );
          }
        },
      },
    );
  };

  const confirmCopy: Record<
    ConfirmTarget,
    { title: string; body: string; confirmLabel: string }
  > = {
    suspend: {
      title: t('accounts.confirms.suspendTitle', { name: user.name }),
      body: t('accounts.confirms.suspendBody'),
      confirmLabel: t('accounts.confirms.suspendConfirm'),
    },
    correctId: {
      title: t('accounts.confirms.correctTitle'),
      body: t('accounts.confirms.correctBody'),
      confirmLabel: t('accounts.confirms.correctConfirm'),
    },
    delete: {
      title: t('accounts.confirms.deleteTitle', { name: user.name }),
      body: t('accounts.confirms.deleteBody'),
      confirmLabel: t('accounts.confirms.deleteConfirm'),
    },
  };

  const activeConfirm = confirmTarget ? confirmCopy[confirmTarget] : null;
  const confirmPending =
    suspend.isPending || correctId.isPending || remove.isPending;

  return (
    <Drawer open onOpenChange={(next) => !next && onClose()}>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>{user.name}</DrawerTitle>
          <DrawerDescription>{user.email}</DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 space-y-6 overflow-y-auto py-4">
          <section
            aria-label={t('accounts.panel.identity')}
            className="space-y-1"
          >
            <h3 className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('accounts.panel.identity')}
            </h3>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.faculty && (
              <p className="text-sm text-muted-foreground">{user.faculty}</p>
            )}
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                {t('accounts.editAccount')}
              </Button>
            </div>
          </section>

          <section
            aria-label={t('accounts.panel.binding')}
            className="space-y-2"
          >
            <h3 className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('accounts.panel.binding')}
            </h3>
            <Badge variant={BINDING_BADGE_VARIANT[binding]} size="sm">
              {t(`common:badges.${BINDING_BADGE_KEY[binding]}`)}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {binding === 'bound'
                ? t('accounts.panel.bindingBound', { id: user.student_id })
                : binding === 'pending'
                  ? t('accounts.panel.bindingPending')
                  : t('accounts.panel.bindingFailed')}
            </p>
            {sisBanner && (
              <Banner
                variant="destructive"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetrySis}
                    isLoading={retrySis.isPending}
                  >
                    {t('common:actions.retry')}
                  </Button>
                }
              >
                {sisBanner}
              </Banner>
            )}
            {binding !== 'bound' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetrySis}
                    isLoading={retrySis.isPending}
                  >
                    {t('accounts.actions.retrySis')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById('correct-student-id')?.focus()
                    }
                  >
                    {t('accounts.actions.correctId')}
                  </Button>
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void openCorrectConfirm();
                  }}
                  className="space-y-2"
                  noValidate
                >
                  <Input
                    id="correct-student-id"
                    inputMode="numeric"
                    label={t('accounts.correctIdForm.label')}
                    error={correctForm.formState.errors.student_id}
                    registration={correctForm.register('student_id')}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('accounts.correctIdForm.helper')}
                  </p>
                  <Button type="submit" variant="outline" size="sm">
                    {t('common:actions.save')}
                  </Button>
                </form>
              </div>
            )}
          </section>

          <section
            aria-label={t('accounts.panel.assignment')}
            className="space-y-2"
          >
            <h3 className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('accounts.panel.assignment')}
            </h3>
            <Badge
              variant={accountAssigned(user) ? 'success' : 'neutral'}
              size="sm"
            >
              {t(
                `common:badges.${accountAssigned(user) ? 'assigned' : 'unassigned'}`,
              )}
            </Badge>
            <form onSubmit={handleReassign} className="space-y-2" noValidate>
              <Input
                type="email"
                label={t('accounts.actions.reassignLabel')}
                placeholder={t('accounts.actions.reassignPlaceholder')}
                value={reassignEmail}
                onChange={(event) => setReassignEmail(event.target.value)}
                className="max-w-xs"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                isLoading={reassign.isPending}
              >
                {t('accounts.actions.reassignSubmit')}
              </Button>
            </form>
            {reassignMessage && (
              <p aria-live="polite" className="text-sm text-muted-foreground">
                {reassignMessage}
              </p>
            )}
          </section>

          <section
            aria-label={t('accounts.panel.dangerZone')}
            className="space-y-2 rounded-lg border border-destructive/30 p-3"
          >
            <h3 className="text-2xs font-medium tracking-wide text-destructive uppercase">
              {t('accounts.panel.dangerZone')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {status === 'active' ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmTarget('suspend')}
                >
                  {t('accounts.actions.suspend')}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reactivate.mutate(user.id)}
                  isLoading={reactivate.isPending}
                >
                  {t('accounts.actions.reactivate')}
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmTarget('delete')}
              >
                {t('accounts.actions.delete')}
              </Button>
            </div>
          </section>
        </div>
      </DrawerContent>

      {editing && (
        <EditAccountDialog user={user} onClose={() => setEditing(false)} />
      )}

      {activeConfirm && (
        <ConfirmDialog
          open
          title={activeConfirm.title}
          body={activeConfirm.body}
          confirmLabel={activeConfirm.confirmLabel}
          destructive={confirmTarget !== 'correctId'}
          pending={confirmPending}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleConfirm}
        />
      )}
    </Drawer>
  );
};
