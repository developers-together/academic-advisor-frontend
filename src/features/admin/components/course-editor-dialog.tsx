import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import { useNotifications } from '@/components/ui/notifications';
import { ApiError } from '@/lib/api-error';
import type { AdminCourse } from '@/types/domain';

import {
  useCreateCourse,
  useUpdateCourse,
  type CourseInput,
} from '../api/course-mutations';

export type CourseEditorDialogProps = {
  course: AdminCourse | null;
  onClose: () => void;
};

const emptyForm = {
  code: '',
  title_en: '',
  title_ar: '',
  credits: 3,
  level: '',
};

export const CourseEditorDialog = ({
  course,
  onClose,
}: CourseEditorDialogProps) => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const [form, setForm] = useState(
    course
      ? {
          code: course.code,
          title_en: course.title_en,
          title_ar: course.title_ar ?? '',
          credits: course.credits,
          level: course.level === null ? '' : String(course.level),
        }
      : emptyForm,
  );
  const [failed, setFailed] = useState<string | null>(null);

  const pending = createCourse.isPending || updateCourse.isPending;
  const codeLocked = course !== null;
  const invalid = form.code.trim() === '' || form.title_en.trim() === '';

  const save = () => {
    setFailed(null);
    const input: CourseInput = {
      code: form.code.trim(),
      title_en: form.title_en.trim(),
      title_ar: form.title_ar.trim() || null,
      credits: Number(form.credits) || 0,
      level: form.level === '' ? null : Number(form.level),
    };
    const onError = (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        setFailed(t('courses.errors.codeExists'));
        return;
      }
      setFailed(t('common:errors.loadFailed'));
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
  };

  const field =
    'mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden';

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

        <div className="space-y-3">
          <div>
            <label htmlFor="course-code" className="text-sm font-medium">
              {t('courses.editor.code')}
            </label>
            <input
              id="course-code"
              value={form.code}
              disabled={codeLocked}
              onChange={(event) =>
                setForm({ ...form, code: event.target.value })
              }
              className={`${field} disabled:opacity-50`}
            />
          </div>
          <div>
            <label htmlFor="course-title" className="text-sm font-medium">
              {t('courses.editor.title')}
            </label>
            <input
              id="course-title"
              value={form.title_en}
              onChange={(event) =>
                setForm({ ...form, title_en: event.target.value })
              }
              className={field}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="course-credits" className="text-sm font-medium">
                {t('courses.editor.credits')}
              </label>
              <input
                id="course-credits"
                type="number"
                min={0}
                value={form.credits}
                onChange={(event) =>
                  setForm({ ...form, credits: Number(event.target.value) })
                }
                className={`${field} tabular-nums`}
              />
            </div>
            <div>
              <label htmlFor="course-level" className="text-sm font-medium">
                {t('courses.editor.level')}
              </label>
              <input
                id="course-level"
                type="number"
                min={1}
                value={form.level}
                onChange={(event) =>
                  setForm({ ...form, level: event.target.value })
                }
                className={`${field} tabular-nums`}
              />
            </div>
          </div>

          {failed && (
            <Banner variant="destructive" title={failed}>
              {t('courses.editor.fixAndRetry')}
            </Banner>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            onClick={save}
            disabled={invalid}
            isLoading={pending}
            aria-busy={pending}
          >
            {course
              ? t('courses.editor.saveEdit')
              : t('courses.editor.saveCreate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
