import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useEffect, FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { ErrorState } from '@/components/ui/banner';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import type { LanguagePreference, User } from '@/types/domain';

import { getAdminStudentQueryOptions } from '../api/get-admin-student';
import { useUpdateStudent } from '../api/update-student';

export type EditAccountDialogProps = {
  user: User;
  onClose: () => void;
};

type EditAccountValues = {
  name: string;
  language_preference: '' | LanguagePreference;
};

const FIELD_KEYS: Record<string, keyof EditAccountValues> = {
  name: 'name',
  language_preference: 'language_preference',
};

export const EditAccountDialog = ({
  user,
  onClose,
}: EditAccountDialogProps) => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const updateStudent = useUpdateStudent();
  const accountQuery = useQuery(getAdminStudentQueryOptions(user.id));

  const schema = z.object({
    name: z
      .string()
      .trim()
      .min(1, t('accounts.editDialog.errors.nameRequired'))
      .max(255, t('accounts.editDialog.errors.nameTooLong')),
    language_preference: z.enum(['', 'en', 'ar']),
  });

  const form = useForm<EditAccountValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      name: accountQuery.data?.name ?? user.name,
      language_preference:
        accountQuery.data?.language_preference ??
        user.language_preference ??
        '',
    },
  });

  useEffect(() => {
    if (accountQuery.data) {
      form.reset({
        name: accountQuery.data.name,
        language_preference: accountQuery.data.language_preference ?? '',
      });
    }
  }, [accountQuery.data, form]);

  const languageOptions = (['', 'en', 'ar'] as const).map((value) => ({
    value,
    label: t(`accounts.language.${value || 'default'}`),
  }));

  const account = accountQuery.data ?? user;

  const submit = form.handleSubmit((values) => {
    updateStudent.mutate(
      {
        studentId: user.id,
        input: {
          name: values.name.trim(),
          ...(values.language_preference
            ? { language_preference: values.language_preference }
            : {}),
        },
      },
      {
        onSuccess: () => {
          addNotification({
            type: 'success',
            title: t('accounts.editDialog.savedToast'),
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

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('accounts.editDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('accounts.editDialog.description')}
          </DialogDescription>
        </DialogHeader>

        {accountQuery.isPending ? (
          <div aria-busy="true" className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : accountQuery.isError ? (
          <ErrorState
            compact
            onRetry={() => void accountQuery.refetch()}
            requestId={
              accountQuery.error instanceof ApiError
                ? accountQuery.error.requestId
                : null
            }
          />
        ) : (
          <form onSubmit={onFormSubmit} className="space-y-4" noValidate>
            <Input
              label={t('accounts.editDialog.name')}
              error={form.formState.errors.name}
              registration={form.register('name')}
            />
            <Select
              label={t('accounts.editDialog.language')}
              options={languageOptions}
              error={form.formState.errors.language_preference}
              registration={form.register('language_preference')}
            />

            <section
              aria-label={t('accounts.editDialog.sisSection')}
              className="space-y-2 rounded-lg border bg-muted/40 p-3"
            >
              <h3 className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                {t('accounts.editDialog.sisSection')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('accounts.editDialog.sisHelper')}
              </p>
              <dl className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-muted-foreground">
                    {t('accounts.editDialog.email')}
                  </dt>
                  <dd className="min-w-0 text-end text-sm break-all">
                    {account.email}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-muted-foreground">
                    {t('accounts.editDialog.studentId')}
                  </dt>
                  <dd className="bidi-code text-sm tabular-nums">
                    {account.student_id ?? t('accounts.editDialog.notSet')}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-muted-foreground">
                    {t('accounts.editDialog.faculty')}
                  </dt>
                  <dd className="text-sm">
                    {account.faculty ?? t('accounts.editDialog.notSet')}
                  </dd>
                </div>
              </dl>
            </section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common:actions.cancel')}
              </Button>
              <Button
                type="submit"
                isLoading={updateStudent.isPending}
                disabled={updateStudent.isPending}
              >
                {t('accounts.editDialog.submit')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
