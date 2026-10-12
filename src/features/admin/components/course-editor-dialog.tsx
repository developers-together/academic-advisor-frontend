import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { FormEvent, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { ApiError } from '@/lib/api-error';
import type { AdminCourse } from '@/types/domain';

import {
  useCreateCourse,
  useUpdateCourse,
  type CourseInput,
} from '../api/course-mutations';
import { useAdminCourses } from '../api/get-admin-courses';

export type CourseEditorDialogProps = {
  course: AdminCourse | null;
  onClose: () => void;
};

type CourseValues = {
  code: string;
  title_en: string;
  title_ar: string;
  credits: string;
  level: string;
  prerequisites: string[];
};

export const CourseEditorDialog = ({
  course,
  onClose,
}: CourseEditorDialogProps) => {
  const { t, i18n } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const coursesQuery = useAdminCourses();

  const codeLocked = course !== null;

  const schema = z.object({
    code: z.string().trim().min(1, t('courses.editor.errors.codeRequired')),
    title_en: z
      .string()
      .trim()
      .min(1, t('courses.editor.errors.titleRequired')),
    title_ar: z.string().trim(),
    credits: z
      .string()
      .trim()
      .min(1, t('courses.editor.errors.creditsRange'))
      .refine(
        (value) => Number(value) >= 1 && Number(value) <= 6,
        t('courses.editor.errors.creditsRange'),
      ),
    level: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === '' ||
          (Number.isInteger(Number(value)) &&
            Number(value) >= 1 &&
            Number(value) <= 8),
        t('courses.editor.errors.levelRange'),
      ),
    prerequisites: z.array(z.string()),
  });

  const form = useForm<CourseValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      code: course?.code ?? '',
      title_en: course?.title_en ?? '',
      title_ar: course?.title_ar ?? '',
      credits: course ? String(course.credits) : '3',
      level:
        course?.level === null || course?.level === undefined
          ? ''
          : String(course.level),
      prerequisites: course?.prerequisite_course_codes ?? [],
    },
  });

  const prerequisites = useWatch({
    control: form.control,
    name: 'prerequisites',
  });

  const courseOptions = useMemo(() => {
    const localizeTitle = (option: AdminCourse) =>
      i18n.language.startsWith('ar')
        ? (option.title_ar ?? option.title_en)
        : option.title_en;
    return (coursesQuery.data ?? [])
      .filter(
        (option) =>
          option.code !== course?.code && !prerequisites.includes(option.code),
      )
      .map((option) => ({
        value: option.code,
        label: `${option.code} ${localizeTitle(option)}`,
      }));
  }, [coursesQuery.data, course?.code, prerequisites, i18n.language]);

  const addPrerequisite = (code: string) => {
    if (prerequisites.includes(code)) return;
    form.setValue('prerequisites', [...prerequisites, code], {
      shouldDirty: true,
    });
  };

  const removePrerequisite = (code: string) => {
    form.setValue(
      'prerequisites',
      prerequisites.filter((value) => value !== code),
      { shouldDirty: true },
    );
  };

  const pending = createCourse.isPending || updateCourse.isPending;

  const submit = form.handleSubmit((values) => {
    const input: CourseInput = {
      code: values.code.trim(),
      title_en: values.title_en.trim(),
      title_ar: values.title_ar.trim() || null,
      credits: Number(values.credits),
      level: values.level.trim() === '' ? null : Number(values.level),
      prerequisite_course_codes: values.prerequisites,
    };
    const onError = (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        form.setError('code', { message: t('courses.errors.codeExists') });
        return;
      }
      addNotification({
        type: 'error',
        title: t('common:errors.saveFailed'),
      });
    };
    if (course) {
      updateCourse.mutate(
        {
          id: course.id,
          input: {
            title_en: input.title_en,
            title_ar: input.title_ar,
            credits: input.credits,
            level: input.level,
            prerequisite_course_codes: input.prerequisite_course_codes,
          },
        },
        {
          onSuccess: () => {
            addNotification({
              type: 'success',
              title: t('courses.saved', { code: course.code }),
            });
            onClose();
          },
          onError,
        },
      );
    } else {
      createCourse.mutate(input, {
        onSuccess: () => {
          addNotification({
            type: 'success',
            title: t('courses.created', { code: input.code }),
          });
          onClose();
        },
        onError,
      });
    }
  });

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {course
              ? t('courses.editor.editTitle', { code: course.code })
              : t('courses.editor.createTitle')}
          </DialogTitle>
          <DialogDescription>{t('courses.editor.body')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onFormSubmit} className="space-y-3" noValidate>
          <Input
            label={t('courses.editor.code')}
            error={form.formState.errors.code}
            registration={form.register('code')}
            disabled={codeLocked}
          />
          <Input
            label={t('courses.editor.title')}
            error={form.formState.errors.title_en}
            registration={form.register('title_en')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min={1}
              max={6}
              step="any"
              label={t('courses.editor.credits')}
              error={form.formState.errors.credits}
              registration={form.register('credits')}
              className="tabular-nums"
            />
            <Input
              type="number"
              min={1}
              max={8}
              step={1}
              label={t('courses.editor.level')}
              error={form.formState.errors.level}
              registration={form.register('level')}
              className="tabular-nums"
            />
          </div>

          <div>
            <span className="text-sm leading-none font-medium">
              {t('courses.editor.prerequisites')}
            </span>
            {prerequisites.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {prerequisites.map((code) => (
                  <li
                    key={code}
                    className="flex items-center gap-1 rounded-full border border-border bg-muted py-0.5 ps-2.5 pe-0.5 text-xs font-medium"
                  >
                    <span className="tabular-nums">{code}</span>
                    <button
                      type="button"
                      onClick={() => removePrerequisite(code)}
                      aria-label={t('courses.editor.removePrerequisite', {
                        code,
                      })}
                      className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-1.5">
              <Combobox
                options={courseOptions}
                placeholder={t('courses.editor.prerequisitePlaceholder')}
                ariaLabel={t('courses.editor.addPrerequisite')}
                emptyMessage={(query) =>
                  query.trim() === ''
                    ? t('courses.editor.prerequisiteAllSelected')
                    : t('courses.editor.prerequisiteEmpty', { query })
                }
                keepOpenOnSelect
                onSelect={addPrerequisite}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={pending}
              disabled={pending}
              aria-busy={pending}
            >
              {course
                ? t('courses.editor.saveEdit')
                : t('courses.editor.saveCreate')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
