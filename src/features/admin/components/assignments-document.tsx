import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';
import type { User } from '@/types/domain';

import { useAdminStudents } from '../api/get-admin-students';

import { ImportAssignmentsDialog } from './import-assignments-dialog';
import { PendingAssignmentsCard } from './pending-assignments-card';

const SEARCH_DEBOUNCE_MS = 300;
const STUDENTS_PER_PAGE = 50;

export const AssignmentsDocument = () => {
  const { t } = useTranslation('admin');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const studentsQuery = useAdminStudents({
    search: debouncedSearch,
    perPage: STUDENTS_PER_PAGE,
  });

  const [importOpen, setImportOpen] = useState(false);

  if (studentsQuery.isPending) {
    return (
      <div aria-busy="true" className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (studentsQuery.isError) {
    if (
      studentsQuery.error instanceof ApiError &&
      studentsQuery.error.status === 403
    ) {
      return <PermissionDenied audience="admin" />;
    }
    return (
      <ErrorState
        onRetry={() => void studentsQuery.refetch()}
        requestId={
          studentsQuery.error instanceof ApiError
            ? studentsQuery.error.requestId
            : null
        }
      />
    );
  }

  const students = studentsQuery.data.items;

  if (students.length === 0) {
    if (debouncedSearch) {
      return (
        <>
          <EmptyState
            compact
            title={t('assignments.empty.title')}
            description={t('assignments.empty.body')}
            action={{
              label: t('common:actions.clearSearch'),
              onClick: () => setSearch(''),
            }}
            className="max-w-xl"
          />
          <PendingAssignmentsCard />
        </>
      );
    }
    return (
      <>
        <EmptyState
          compact
          title={t('assignments.empty.noRows')}
          description={t('assignments.empty.noRowsBody')}
          action={{
            label: t('assignments.import'),
            onClick: () => setImportOpen(true),
          }}
          className="max-w-xl"
        />
        <PendingAssignmentsCard />
        {importOpen && (
          <ImportAssignmentsDialog open onClose={() => setImportOpen(false)} />
        )}
      </>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Input
          type="search"
          label={t('accounts.searchLabel')}
          placeholder={t('accounts.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          {t('assignments.import')}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <TableElement>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {(['name', 'studentId', 'advisor', 'faculty'] as const).map(
                (key) => (
                  <TableHead
                    key={key}
                    className="sticky top-0 z-10 bg-card px-3 py-2 text-2xs font-medium tracking-wide uppercase"
                  >
                    {t(`assignments.columns.${key}`)}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student: User) => (
              <TableRow key={student.id} className="border-border">
                <TableCell className="px-3 py-2 text-sm font-medium">
                  {student.name}
                </TableCell>
                <TableCell className="px-3 py-2">
                  <span className="bidi-code text-sm tabular-nums">
                    {student.student_id ?? '-'}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <Badge
                    variant={student.advisor_id ? 'info' : 'neutral'}
                    size="sm"
                  >
                    {t(
                      `common:badges.${student.advisor_id ? 'assigned' : 'unassigned'}`,
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                  {student.faculty ?? '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableElement>
      </div>

      <PendingAssignmentsCard />

      {importOpen && (
        <ImportAssignmentsDialog open onClose={() => setImportOpen(false)} />
      )}
    </div>
  );
};
