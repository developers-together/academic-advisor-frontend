import { zodResolver } from '@hookform/resolvers/zod';
import { FormEvent, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Input, Select } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { ApiError } from '@/lib/api-error';
import type { User } from '@/types/domain';

import { useCreateStaff } from '../api/create-staff';
import { useSendStaffPasswordReset } from '../api/send-staff-password-reset';

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

export const StaffCreateCard = () => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const createStaff = useCreateStaff();
  const sendReset = useSendStaffPasswordReset();

  const [created, setCreated] = useState<User | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const form = useForm<StaffValues>({
    resolver: zodResolver(staffSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'advisor',
      faculty: '',
    },
  });

  const role = form.watch('role');

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
          form.reset({
            name: '',
            email: '',
            password: '',
            role: 'advisor',
            faculty: '',
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

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  const roleOptions = (['advisor', 'dean', 'vp', 'admin'] as const).map(
    (value) => ({ value, label: t(`settings.roles.${value}`) }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.staff.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('settings.staff.context')}
        </p>
      </CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('settings.staff.name')}
              error={form.formState.errors.name}
              registration={form.register('name')}
            />
            <Input
              type="email"
              label={t('settings.staff.email')}
              error={form.formState.errors.email}
              registration={form.register('email')}
            />
            <Input
              type="password"
              label={t('settings.staff.password')}
              error={form.formState.errors.password}
              registration={form.register('password')}
              autoComplete="new-password"
            />
            <Select
              label={t('settings.staff.role')}
              options={roleOptions}
              error={form.formState.errors.role}
              registration={form.register('role')}
            />
            {role === 'dean' && (
              <div>
                <Input
                  label={t('settings.staff.faculty')}
                  error={form.formState.errors.faculty}
                  registration={form.register('faculty')}
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.staff.facultyHelper')}
                </p>
              </div>
            )}
          </div>
          <div>
            <Button
              type="submit"
              isLoading={createStaff.isPending}
              disabled={createStaff.isPending}
            >
              {t('settings.staff.submit')}
            </Button>
          </div>
        </form>

        {created && (
          <Banner variant="success" className="mt-4">
            <p>{t('settings.staff.created', { name: created.name })}</p>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmReset(true)}
                isLoading={sendReset.isPending}
              >
                {t('settings.staff.resetLink')}
              </Button>
            </div>
          </Banner>
        )}
      </CardBody>

      {created && (
        <ConfirmDialog
          open={confirmReset}
          title={t('settings.staff.resetConfirmTitle')}
          body={t('settings.staff.resetConfirmBody', {
            email: created.email,
          })}
          confirmLabel={t('settings.staff.resetConfirm')}
          pending={sendReset.isPending}
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            sendReset.mutate(created.id, {
              onSuccess: () => {
                setConfirmReset(false);
                addNotification({
                  type: 'success',
                  title: t('settings.staff.resetSent'),
                });
              },
            });
          }}
        />
      )}
    </Card>
  );
};
