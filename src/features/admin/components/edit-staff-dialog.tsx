import { zodResolver } from '@hookform/resolvers/zod';
import { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input, Select } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { ApiError } from '@/lib/api-error';
import type { StaffMember } from '@/types/domain';

import { useUpdateStaff } from '../api/update-staff';

export type EditStaffDialogProps = {
  staff: StaffMember;
  onClose: () => void;
};

type EditStaffValues = {
  name: string;
  role: 'advisor' | 'dean' | 'vp' | 'admin';
  faculty: string;
};

const FIELD_KEYS: Record<string, keyof EditStaffValues> = {
  name: 'name',
  role: 'role',
  faculty: 'faculty',
};

export const EditStaffDialog = ({ staff, onClose }: EditStaffDialogProps) => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const updateStaff = useUpdateStaff();

  const schema = z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t('staff.editDialog.errors.nameRequired'))
        .max(255, t('staff.editDialog.errors.nameTooLong')),
      role: z.enum(['advisor', 'dean', 'vp', 'admin']),
      faculty: z.string().trim(),
    })
    .superRefine((values, ctx) => {
      if (values.role === 'dean' && !values.faculty.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['faculty'],
          message: t('staff.editDialog.errors.facultyRequired'),
        });
      }
    });

  const form = useForm<EditStaffValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      name: staff.name,
      role: staff.role,
      faculty: staff.faculty ?? '',
    },
  });

  const role = form.watch('role');

  const submit = form.handleSubmit((values) => {
    updateStaff.mutate(
      {
        staffId: staff.id,
        input: {
          name: values.name.trim(),
          role: values.role,
          ...(values.role === 'dean' ? { faculty: values.faculty.trim() } : {}),
        },
      },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            title: t('staff.editDialog.savedToast'),
          });
          onClose();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 422) {
            for (const [key, messages] of Object.entries(error.fields)) {
              const field = FIELD_KEYS[key];
              if (field && messages[0]) {
                form.setError(field, { message: messages[0] });
              }
            }
          }
        },
      },
    );
  });

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  const roleOptions = (['advisor', 'dean', 'vp', 'admin'] as const).map(
    (value) => ({ value, label: t(`staff.roles.${value}`) }),
  );

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('staff.editDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('staff.editDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onFormSubmit} className="space-y-4" noValidate>
          <Input
            label={t('staff.editDialog.name')}
            error={form.formState.errors.name}
            registration={form.register('name')}
          />
          <Select
            label={t('staff.editDialog.role')}
            options={roleOptions}
            error={form.formState.errors.role}
            registration={form.register('role')}
          />
          {role === 'dean' && (
            <div>
              <Input
                label={t('staff.editDialog.faculty')}
                error={form.formState.errors.faculty}
                registration={form.register('faculty')}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('staff.editDialog.facultyHelper')}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={updateStaff.isPending}
              disabled={updateStaff.isPending}
            >
              {t('staff.editDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
