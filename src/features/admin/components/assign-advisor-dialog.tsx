import { zodResolver } from '@hookform/resolvers/zod';
import { FormEvent } from 'react';
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

import { useAssignAdvisor } from '../api/assign-advisor';
import { useAdminStaff } from '../api/get-admin-staff';

export type AssignAdvisorDialogProps = {
  open: boolean;
  onClose: () => void;
};

const SIS_ID_PATTERN = /^\d{1,20}$/;

type AssignAdvisorValues = {
  student_id: string;
  advisor_email: string;
};

const FIELD_KEYS: Record<string, keyof AssignAdvisorValues> = {
  student_id: 'student_id',
  advisor_email: 'advisor_email',
};

export const AssignAdvisorDialog = ({
  open,
  onClose,
}: AssignAdvisorDialogProps) => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const assignAdvisor = useAssignAdvisor();
  const advisorsQuery = useAdminStaff({ role: 'advisor' });

  const schema = z.object({
    student_id: z
      .string()
      .trim()
      .min(1, t('assignments.assignDialog.errors.studentIdRequired'))
      .regex(
        SIS_ID_PATTERN,
        t('assignments.assignDialog.errors.studentIdDigits'),
      ),
    advisor_email: z
      .string()
      .min(1, t('assignments.assignDialog.errors.advisorRequired')),
  });

  const form = useForm<AssignAdvisorValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { student_id: '', advisor_email: '' },
  });

  const advisorOptions = [
    { value: '', label: t('assignments.assignDialog.chooseAdvisor') },
    ...(advisorsQuery.data ?? []).map((advisor) => ({
      value: advisor.email,
      label: advisor.name,
    })),
  ];

  const submit = form.handleSubmit((values) => {
    assignAdvisor.mutate(
      {
        student_id: values.student_id.trim(),
        advisor_email: values.advisor_email,
      },
      {
        onSuccess: (result) => {
          onClose();
          if (result.mode === 'assigned') {
            addNotification({
              type: 'success',
              title: t('assignments.assignDialog.assignedToast'),
            });
          } else if (result.mode === 'scheduled') {
            addNotification({
              type: 'success',
              title: t('assignments.assignDialog.scheduledToast'),
            });
          } else {
            addNotification({
              type: 'info',
              title: t('assignments.assignDialog.unchangedToast'),
            });
          }
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
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('assignments.assignDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('assignments.assignDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onFormSubmit} className="space-y-4" noValidate>
          <div>
            <Input
              inputMode="numeric"
              label={t('assignments.assignDialog.studentId')}
              error={form.formState.errors.student_id}
              registration={form.register('student_id')}
              className="max-w-xs"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t('assignments.assignDialog.studentIdHelper')}
            </p>
          </div>

          {advisorsQuery.isPending ? (
            <div aria-busy="true" className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : advisorsQuery.isError ? (
            <ErrorState
              compact
              onRetry={() => void advisorsQuery.refetch()}
              requestId={
                advisorsQuery.error instanceof ApiError
                  ? advisorsQuery.error.requestId
                  : null
              }
            />
          ) : (advisorsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('assignments.assignDialog.advisorsEmpty')}
            </p>
          ) : (
            <Select
              label={t('assignments.assignDialog.advisor')}
              options={advisorOptions}
              error={form.formState.errors.advisor_email}
              registration={form.register('advisor_email')}
            />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={assignAdvisor.isPending}
              disabled={assignAdvisor.isPending}
            >
              {t('assignments.assignDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
