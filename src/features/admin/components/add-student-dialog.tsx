import { zodResolver } from '@hookform/resolvers/zod';
import { FormEvent, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Banner } from '@/components/ui/banner';
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
import type { LanguagePreference } from '@/types/domain';

import { useCreateStudent } from '../api/create-student';

export type AddStudentDialogProps = {
  open: boolean;
  onClose: () => void;
};

const SIS_ID_PATTERN = /^\d{1,20}$/;

type AddStudentValues = {
  student_id: string;
  name: string;
  password: string;
  language_preference: '' | LanguagePreference;
};

const FIELD_KEYS: Record<string, keyof AddStudentValues> = {
  student_id: 'student_id',
  name: 'name',
  password: 'password',
  language_preference: 'language_preference',
};

export const AddStudentDialog = ({ open, onClose }: AddStudentDialogProps) => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const createStudent = useCreateStudent();

  const [created, setCreated] = useState<{
    name: string;
    email: string;
    student_id: string | null;
  } | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [requestError, setRequestError] = useState<string | null>(null);

  const schema = z.object({
    student_id: z
      .string()
      .trim()
      .min(1, t('accounts.addDialog.errors.studentIdRequired'))
      .regex(SIS_ID_PATTERN, t('accounts.addDialog.errors.studentIdDigits')),
    name: z
      .string()
      .trim()
      .min(1, t('accounts.addDialog.errors.nameRequired'))
      .max(255, t('accounts.addDialog.errors.nameTooLong')),
    password: z.string().min(8, t('accounts.addDialog.errors.passwordMin')),
    language_preference: z.enum(['', 'en', 'ar']),
  });

  const form = useForm<AddStudentValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      student_id: '',
      name: '',
      password: '',
      language_preference: '',
    },
  });

  const languageOptions = (['', 'en', 'ar'] as const).map((value) => ({
    value,
    label: t(`accounts.language.${value || 'default'}`),
  }));

  const submit = form.handleSubmit((values) => {
    setRequestError(null);
    createStudent.mutate(
      {
        student_id: values.student_id.trim(),
        name: values.name.trim(),
        password: values.password,
        ...(values.language_preference
          ? { language_preference: values.language_preference }
          : {}),
      },
      {
        onSuccess: (student) => {
          setCreated({
            name: student.name,
            email: student.email,
            student_id: student.student_id,
          });
          setTempPassword(values.password);
          addNotification({
            type: 'success',
            title: t('accounts.addDialog.createdToast'),
          });
        },
        onError: (error) => {
          if (!(error instanceof ApiError)) {
            return;
          }
          if (error.status === 503) {
            setRequestError(t('accounts.addDialog.errors.sisUnavailable'));
            return;
          }
          if (
            error.status === 422 &&
            error.key === 'admin.sis_unknown_student'
          ) {
            setRequestError(t('accounts.addDialog.errors.sisUnknown'));
            return;
          }
          if (error.status === 422) {
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
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('accounts.addDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('accounts.addDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onFormSubmit} className="space-y-4" noValidate>
          {requestError && (
            <Banner variant="destructive">{requestError}</Banner>
          )}

          {created ? (
            <div className="space-y-4">
              <Banner variant="success">
                <p>{t('accounts.addDialog.created', { name: created.name })}</p>
              </Banner>
              <dl className="space-y-3">
                <div className="space-y-0.5">
                  <dt className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                    {t('accounts.addDialog.credentials.studentId')}
                  </dt>
                  <dd className="bidi-code text-sm font-medium tabular-nums">
                    {created.student_id}
                  </dd>
                </div>
                <div className="space-y-0.5">
                  <dt className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                    {t('accounts.addDialog.credentials.email')}
                  </dt>
                  <dd className="text-sm font-medium break-all">
                    {created.email}
                  </dd>
                </div>
                <div className="space-y-0.5">
                  <dt className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                    {t('accounts.addDialog.credentials.temporaryPassword')}
                  </dt>
                  <dd className="text-sm font-medium tabular-nums">
                    {tempPassword}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Input
                  inputMode="numeric"
                  label={t('accounts.addDialog.studentId')}
                  error={form.formState.errors.student_id}
                  registration={form.register('student_id')}
                  className="max-w-xs"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('accounts.addDialog.studentIdHelper')}
                </p>
              </div>
              <Input
                label={t('accounts.addDialog.name')}
                error={form.formState.errors.name}
                registration={form.register('name')}
              />
              <div>
                <Input
                  type="password"
                  label={t('accounts.addDialog.password')}
                  error={form.formState.errors.password}
                  registration={form.register('password')}
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('accounts.addDialog.passwordHelper')}
                </p>
              </div>
              <Select
                label={t('accounts.addDialog.language')}
                options={languageOptions}
                error={form.formState.errors.language_preference}
                registration={form.register('language_preference')}
              />
            </div>
          )}

          <DialogFooter>
            {created ? (
              <Button type="button" onClick={onClose}>
                {t('accounts.addDialog.done')}
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onClose}>
                  {t('common:actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  isLoading={createStudent.isPending}
                  disabled={createStudent.isPending}
                >
                  {t('accounts.addDialog.submit')}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
