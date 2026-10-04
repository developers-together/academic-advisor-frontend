import { zodResolver } from '@hookform/resolvers/zod';
import { FormEvent, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import {
  ConfirmDialog,
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
import type { User } from '@/types/domain';

import { useCreateStaff } from '../api/create-staff';
import { useSendStaffPasswordReset } from '../api/send-staff-password-reset';

export type AddStaffDialogProps = {
  open: boolean;
  onClose: () => void;
};

const staffSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  role: z.enum(['advisor', 'dean', 'vp', 'admin']),
  faculty: z.string().trim().optional(),
});

type StaffValues = z.input<typeof staffSchema>;

const FIELD_KEYS: Record<string, keyof StaffValues> = {
  name: 'name',
  email: 'email',
  password: 'password',
  role: 'role',
  faculty: 'faculty',
};

const EMPTY_VALUES = {
  name: '',
  email: '',
  password: '',
  role: 'advisor',
  faculty: '',
} as const;

export const AddStaffDialog = ({ open, onClose }: AddStaffDialogProps) => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const createStaff = useCreateStaff();
  const sendReset = useSendStaffPasswordReset();

  const [created, setCreated] = useState<User | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const form = useForm<StaffValues>({
    resolver: zodResolver(staffSchema),
    mode: 'onBlur',
    defaultValues: EMPTY_VALUES,
  });

  const role = form.watch('role');

  const close = () => {
    setCreated(null);
    setConfirmReset(false);
    form.reset(EMPTY_VALUES);
    onClose();
  };

  const submit = form.handleSubmit((values) => {
    createStaff.mutate(
      {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        ...(values.role === 'dean' && values.faculty
          ? { faculty: values.faculty }
          : {}),
      },
      {
        onSuccess: (user) => {
          setCreated(user);
          form.reset(EMPTY_VALUES);
          addNotification({
            type: 'success',
            title: t('staff.create.createdToast'),
          });
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
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('staff.create.title')}</DialogTitle>
          <DialogDescription>{t('staff.create.description')}</DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <Banner variant="success">
              <p>{t('staff.create.created', { name: created.name })}</p>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmReset(true)}
                  isLoading={sendReset.isPending}
                >
                  {t('staff.create.resetLink')}
                </Button>
              </div>
            </Banner>
            <dl className="space-y-3">
              <div className="space-y-0.5">
                <dt className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t('staff.create.email')}
                </dt>
                <dd className="text-sm font-medium break-all">
                  {created.email}
                </dd>
              </div>
              <div className="space-y-0.5">
                <dt className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t(`staff.roles.${created.role}`)}
                </dt>
                <dd className="text-sm font-medium">{created.name}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <form onSubmit={onFormSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('staff.create.name')}
                error={form.formState.errors.name}
                registration={form.register('name')}
              />
              <Input
                type="email"
                label={t('staff.create.email')}
                error={form.formState.errors.email}
                registration={form.register('email')}
              />
              <div>
                <Input
                  type="password"
                  label={t('staff.create.password')}
                  error={form.formState.errors.password}
                  registration={form.register('password')}
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('staff.create.passwordHelper')}
                </p>
              </div>
              <Select
                label={t('staff.create.role')}
                options={roleOptions}
                error={form.formState.errors.role}
                registration={form.register('role')}
              />
              {role === 'dean' && (
                <div>
                  <Input
                    label={t('staff.create.faculty')}
                    error={form.formState.errors.faculty}
                    registration={form.register('faculty')}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('staff.create.facultyHelper')}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                {t('common:actions.cancel')}
              </Button>
              <Button
                type="submit"
                isLoading={createStaff.isPending}
                disabled={createStaff.isPending}
              >
                {t('staff.create.submit')}
              </Button>
            </DialogFooter>
          </form>
        )}

        {created && (
          <DialogFooter>
            <Button type="button" onClick={close}>
              {t('common:actions.close')}
            </Button>
          </DialogFooter>
        )}

        {created && (
          <ConfirmDialog
            open={confirmReset}
            title={t('staff.create.resetConfirmTitle')}
            body={t('staff.create.resetConfirmBody', {
              email: created.email,
            })}
            confirmLabel={t('staff.create.resetConfirm')}
            pending={sendReset.isPending}
            onCancel={() => setConfirmReset(false)}
            onConfirm={() => {
              sendReset.mutate(created.id, {
                onSuccess: () => {
                  setConfirmReset(false);
                  addNotification({
                    type: 'success',
                    title: t('staff.create.resetSent'),
                  });
                },
              });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
