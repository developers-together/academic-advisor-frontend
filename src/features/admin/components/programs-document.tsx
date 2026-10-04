import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import type { AdminProgram } from '@/types/domain';

import { useAdminPrograms } from '../api/get-admin-programs';
import { useCreateProgram, useUpdateProgram } from '../api/program-mutations';

export const ProgramsDocument = () => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const programsQuery = useAdminPrograms();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const [editing, setEditing] = useState<AdminProgram | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name_en: '',
    faculty: '',
  });
  const [failed, setFailed] = useState<string | null>(null);

  if (programsQuery.isPending) {
    return (
      <div aria-busy="true" className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (programsQuery.isError) {
    if (
      programsQuery.error instanceof ApiError &&
      programsQuery.error.status === 403
    ) {
      return <PermissionDenied audience="admin" />;
    }
    return (
      <ErrorState
        onRetry={() => void programsQuery.refetch()}
        requestId={
          programsQuery.error instanceof ApiError
            ? programsQuery.error.requestId
            : null
        }
      />
    );
  }

  const programs = programsQuery.data;
  const pending = createProgram.isPending || updateProgram.isPending;

  const openEditor = (program: AdminProgram | null) => {
    setFailed(null);
    setForm(
      program
        ? {
            code: program.code,
            name_en: program.name_en,
            faculty: program.faculty ?? '',
          }
        : { code: '', name_en: '', faculty: '' },
    );
    setEditing(program);
    setCreating(program === null);
  };

  const save = () => {
    setFailed(null);
    const input = {
      code: form.code.trim(),
      name_en: form.name_en.trim(),
      name_ar: null,
      faculty: form.faculty.trim() || null,
    };
    if (editing) {
      updateProgram.mutate(
        {
          id: editing.id,
          input: { name_en: input.name_en, faculty: input.faculty },
        },
        {
          onSuccess: () => {
            addNotification({
              type: 'success',
              title: t('programs.saved', { code: editing.code }),
            });
            closeEditor();
          },
          onError: () => setFailed(t('common:errors.loadFailed')),
        },
      );
    } else {
      createProgram.mutate(input, {
        onSuccess: () => {
          addNotification({
            type: 'success',
            title: t('programs.created', { code: input.code }),
          });
          closeEditor();
        },
        onError: () => setFailed(t('common:errors.loadFailed')),
      });
    }
  };

  const closeEditor = () => {
    setEditing(null);
    setCreating(false);
  };

  const field =
    'mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openEditor(null)}>{t('programs.create')}</Button>
      </div>

      {programs.length === 0 ? (
        <EmptyState
          compact
          className="max-w-xl"
          title={t('programs.empty.title')}
          description={t('programs.empty.body')}
          action={{
            label: t('programs.create'),
            onClick: () => openEditor(null),
          }}
        />
      ) : (
        <TableElement>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>{t('programs.columns.code')}</TableHead>
              <TableHead>{t('programs.columns.name')}</TableHead>
              <TableHead>{t('programs.columns.faculty')}</TableHead>
              <TableHead className="text-end">
                {t('programs.columns.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id} className="border-border">
                <TableCell className="px-3 py-2 text-sm font-medium">
                  {program.code}
                </TableCell>
                <TableCell className="px-3 py-2 text-sm">
                  {program.name_en}
                </TableCell>
                <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                  {program.faculty ?? '—'}
                </TableCell>
                <TableCell className="px-3 py-2 text-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditor(program)}
                  >
                    {t('programs.edit')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableElement>
      )}

      {(creating || editing) && (
        <Dialog open onOpenChange={(next) => !next && closeEditor()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing
                  ? t('programs.editor.editTitle', { code: editing.code })
                  : t('programs.editor.createTitle')}
              </DialogTitle>
              <DialogDescription>{t('programs.editor.body')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label htmlFor="program-code" className="text-sm font-medium">
                  {t('programs.editor.code')}
                </label>
                <input
                  id="program-code"
                  value={form.code}
                  disabled={editing !== null}
                  onChange={(event) =>
                    setForm({ ...form, code: event.target.value })
                  }
                  className={`${field} disabled:opacity-50`}
                />
              </div>
              <div>
                <label htmlFor="program-name" className="text-sm font-medium">
                  {t('programs.editor.name')}
                </label>
                <input
                  id="program-name"
                  value={form.name_en}
                  onChange={(event) =>
                    setForm({ ...form, name_en: event.target.value })
                  }
                  className={field}
                />
              </div>
              <div>
                <label
                  htmlFor="program-faculty"
                  className="text-sm font-medium"
                >
                  {t('programs.editor.faculty')}
                </label>
                <input
                  id="program-faculty"
                  value={form.faculty}
                  onChange={(event) =>
                    setForm({ ...form, faculty: event.target.value })
                  }
                  className={field}
                />
              </div>
              {failed && <p className="text-sm text-destructive">{failed}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditor}>
                {t('actions.cancel', { ns: 'common' })}
              </Button>
              <Button
                onClick={save}
                disabled={!form.code.trim() || !form.name_en.trim()}
                isLoading={pending}
                aria-busy={pending}
              >
                {editing
                  ? t('programs.editor.saveEdit')
                  : t('programs.editor.saveCreate')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
