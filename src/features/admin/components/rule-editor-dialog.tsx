import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, FormEvent, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

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
import { Input, Textarea } from '@/components/ui/form';
import { ApiError } from '@/lib/api-error';
import type { UniversityRule, UniversityRuleInput } from '@/types/domain';

import { useCreateRule } from '../api/create-rule';
import { useDeleteRule } from '../api/delete-rule';
import { useUpdateRule } from '../api/update-rule';

const ruleSchema = z.object({
  faculty: z.string().trim().max(255),
  title_en: z.string().trim().min(1).max(255),
  title_ar: z.string().trim().min(1).max(255),
  body_en: z.string().trim().min(1),
  body_ar: z.string().trim().min(1),
});

type RuleValues = z.infer<typeof ruleSchema>;

const FIELD_KEYS: Record<string, keyof RuleValues> = {
  faculty: 'faculty',
  title_en: 'title_en',
  title_ar: 'title_ar',
  body_en: 'body_en',
  body_ar: 'body_ar',
};

export type RuleEditorDialogProps = {
  rule: UniversityRule | null;
  onClose: () => void;
};

export const RuleEditorDialog = ({ rule, onClose }: RuleEditorDialogProps) => {
  const { t } = useTranslation('admin');
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const removeRule = useDeleteRule();

  const [confirmDelete, setConfirmDelete] = useState(false);

  const form = useForm<RuleValues>({
    resolver: zodResolver(ruleSchema),
    mode: 'onBlur',
    defaultValues: {
      faculty: rule?.faculty ?? '',
      title_en: rule?.title_en ?? '',
      title_ar: rule?.title_ar ?? '',
      body_en: rule?.body_en ?? '',
      body_ar: rule?.body_ar ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      faculty: rule?.faculty ?? '',
      title_en: rule?.title_en ?? '',
      title_ar: rule?.title_ar ?? '',
      body_en: rule?.body_en ?? '',
      body_ar: rule?.body_ar ?? '',
    });
  }, [rule, form]);

  const mergeServerErrors = (error: unknown) => {
    if (error instanceof ApiError && error.status === 422) {
      for (const [key, messages] of Object.entries(error.fields)) {
        const field = FIELD_KEYS[key];
        if (field && messages[0]) {
          form.setError(field, { message: messages[0] });
        }
      }
    }
  };

  const submit = form.handleSubmit((values) => {
    const input: UniversityRuleInput = {
      ...values,
      faculty: values.faculty || null,
    };
    if (rule) {
      updateRule.mutate(
        { ruleId: rule.id, input },
        {
          onSuccess: onClose,
          onError: mergeServerErrors,
        },
      );
    } else {
      createRule.mutate(input, {
        onSuccess: onClose,
        onError: mergeServerErrors,
      });
    }
  });

  const handleDelete = () => {
    if (!rule) {
      return;
    }
    removeRule.mutate(rule.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        onClose();
      },
    });
  };

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  const pending = createRule.isPending || updateRule.isPending;

  return (
    <>
      <Dialog open onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {rule
                ? t('rules.editor.editTitle')
                : t('rules.editor.createTitle')}
            </DialogTitle>
            <DialogDescription>{t('rules.context')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={onFormSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('rules.editor.titleEn')}
                error={form.formState.errors.title_en}
                registration={form.register('title_en')}
              />
              <Input
                label={t('rules.editor.titleAr')}
                error={form.formState.errors.title_ar}
                registration={form.register('title_ar')}
                dir="rtl"
              />
            </div>
            <Textarea
              label={t('rules.editor.bodyEn')}
              error={form.formState.errors.body_en}
              registration={form.register('body_en')}
              rows={4}
            />
            <Textarea
              label={t('rules.editor.bodyAr')}
              error={form.formState.errors.body_ar}
              registration={form.register('body_ar')}
              rows={4}
              dir="rtl"
            />
            <div>
              <Input
                label={t('rules.editor.faculty')}
                error={form.formState.errors.faculty}
                registration={form.register('faculty')}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('rules.editor.facultyHelper')}
              </p>
            </div>

            <DialogFooter>
              {rule && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  {t('rules.delete.confirm')}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common:actions.cancel')}
              </Button>
              <Button type="submit" isLoading={pending} disabled={pending}>
                {t('rules.editor.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        title={t('rules.delete.dialogTitle')}
        body={t('rules.delete.dialogBody')}
        confirmLabel={t('rules.delete.confirm')}
        destructive
        pending={removeRule.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
};
