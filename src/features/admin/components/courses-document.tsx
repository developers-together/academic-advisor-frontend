import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useNotifications } from '@/components/ui/notifications';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';
import type { AdminCourse } from '@/types/domain';

import { useDeleteCourse } from '../api/course-mutations';
import { useAdminCourses } from '../api/get-admin-courses';

import { CourseEditorDialog } from './course-editor-dialog';

export const CoursesDocument = () => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const coursesQuery = useAdminCourses();
  const deleteCourse = useDeleteCourse();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminCourse | null>(null);
  const [deleting, setDeleting] = useState<AdminCourse | null>(null);

  if (coursesQuery.isPending) {
    return (
      <div aria-busy="true" className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (coursesQuery.isError) {
    if (
      coursesQuery.error instanceof ApiError &&
      coursesQuery.error.status === 403
    ) {
      return <PermissionDenied audience="admin" />;
    }
    return (
      <ErrorState
        onRetry={() => void coursesQuery.refetch()}
        requestId={
          coursesQuery.error instanceof ApiError
            ? coursesQuery.error.requestId
            : null
        }
      />
    );
  }

  const courses = coursesQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>{t('courses.create')}</Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          compact
          className="max-w-xl"
          title={t('courses.empty.title')}
          description={t('courses.empty.body')}
          action={{
            label: t('courses.create'),
            onClick: () => setCreating(true),
          }}
        />
      ) : (
        <TableElement>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>{t('courses.columns.code')}</TableHead>
              <TableHead>{t('courses.columns.title')}</TableHead>
              <TableHead className="text-end">
                {t('courses.columns.credits')}
              </TableHead>
              <TableHead className="text-end">
                {t('courses.columns.level')}
              </TableHead>
              <TableHead className="text-end">
                {t('courses.columns.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id} className="border-border">
                <TableCell className="px-3 py-2 text-sm font-medium">
                  {course.code}
                </TableCell>
                <TableCell className="px-3 py-2 text-sm">
                  {course.title_en}
                </TableCell>
                <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                  {course.credits}
                </TableCell>
                <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                  {course.level ?? '—'}
                </TableCell>
                <TableCell className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(course)}
                    >
                      {t('courses.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleting(course)}
                    >
                      {t('courses.delete')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableElement>
      )}

      {(creating || editing) && (
        <CourseEditorDialog
          course={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title={t('courses.deleteDialog.title', {
          code: deleting?.code ?? '',
        })}
        body={t('courses.deleteDialog.body')}
        confirmLabel={t('courses.delete')}
        destructive
        pending={deleteCourse.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting === null) return;
          deleteCourse.mutate(deleting.id, {
            onSuccess: () => {
              addNotification({
                type: 'success',
                title: t('courses.deleted', { code: deleting.code }),
              });
              setDeleting(null);
            },
          });
        }}
      />
    </div>
  );
};
