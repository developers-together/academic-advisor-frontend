import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AsyncSurface } from '@/components/ui/async-surface';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotifications } from '@/components/ui/notifications';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiError } from '@/lib/api-error';
import type { StaffMember, StaffRole } from '@/types/domain';

import { useDeleteStaff } from '../api/delete-staff';
import { useAdminStaff } from '../api/get-admin-staff';
import { useSendStaffPasswordReset } from '../api/send-staff-password-reset';

import { EditStaffDialog } from './edit-staff-dialog';
import { StaffTable } from './staff-table';

type StaffFilter = 'all' | StaffRole;

const FILTERS: StaffFilter[] = ['all', 'advisor', 'dean', 'vp', 'admin'];

type ConfirmTarget =
  | { kind: 'delete'; staff: StaffMember }
  | { kind: 'reset'; staff: StaffMember };

export type StaffDocumentProps = {
  onAddStaff: () => void;
};

const readableError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message ?? Object.values(error.fields)[0]?.[0] ?? '';
  }
  return '';
};

export const StaffDocument = ({ onAddStaff }: StaffDocumentProps) => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);

  const [filter, setFilter] = useState<StaffFilter>('all');
  const staffQuery = useAdminStaff(filter === 'all' ? {} : { role: filter });

  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(
    null,
  );
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const removeStaff = useDeleteStaff();
  const sendReset = useSendStaffPasswordReset();

  const confirm = () => {
    if (!confirmTarget) {
      return;
    }
    if (confirmTarget.kind === 'delete') {
      removeStaff.mutate(confirmTarget.staff.id, {
        onSuccess: () => {
          addNotification({
            type: 'success',
            title: t('staff.deletedToast'),
          });
          setConfirmTarget(null);
        },
        onError: (error) => {
          setConfirmError(readableError(error));
        },
      });
      return;
    }
    sendReset.mutate(confirmTarget.staff.id, {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: t('staff.create.resetSent'),
        });
        setConfirmTarget(null);
      },
      onError: (error) => {
        setConfirmError(readableError(error));
      },
    });
  };

  const staff = staffQuery.data ?? [];

  const confirmCopy = confirmTarget
    ? confirmTarget.kind === 'delete'
      ? {
          title: t('staff.deleteDialog.title', {
            name: confirmTarget.staff.name,
          }),
          body: t('staff.deleteDialog.body'),
          confirmLabel: t('staff.deleteDialog.confirm'),
        }
      : {
          title: t('staff.create.resetConfirmTitle'),
          body: t('staff.create.resetConfirmBody', {
            email: confirmTarget.staff.email,
          }),
          confirmLabel: t('staff.create.resetConfirm'),
        }
    : null;

  return (
    <AsyncSurface query={staffQuery}>
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as StaffFilter)}
      >
        <TabsList aria-label={t('staff.filterLabel')}>
          {FILTERS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(key === 'all' ? 'staff.filter.all' : `staff.filter.${key}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {staff.length === 0 ? (
        <EmptyState
          compact
          title={
            filter === 'all'
              ? t('staff.empty.noRows')
              : t('staff.empty.filteredTitle')
          }
          description={
            filter === 'all'
              ? t('staff.empty.noRowsBody')
              : t('staff.empty.filteredBody')
          }
          action={
            filter === 'all'
              ? {
                  label: t('staff.addStaff'),
                  onClick: onAddStaff,
                }
              : undefined
          }
          className="max-w-xl"
        />
      ) : (
        <StaffTable
          staff={staff}
          onEdit={setEditing}
          onResetPassword={(member) => {
            setConfirmError(null);
            setConfirmTarget({ kind: 'reset', staff: member });
          }}
          onDelete={(member) => {
            setConfirmError(null);
            setConfirmTarget({ kind: 'delete', staff: member });
          }}
        />
      )}

      {editing && (
        <EditStaffDialog staff={editing} onClose={() => setEditing(null)} />
      )}

      {confirmTarget && confirmCopy && (
        <ConfirmDialog
          open
          title={confirmCopy.title}
          body={confirmCopy.body}
          confirmLabel={confirmCopy.confirmLabel}
          destructive={confirmTarget.kind === 'delete'}
          pending={removeStaff.isPending || sendReset.isPending}
          error={confirmError}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={confirm}
        />
      )}
    </AsyncSurface>
  );
};
