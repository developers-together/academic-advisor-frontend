import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';

import { useAdminStudents } from '../api/get-admin-students';

import { AccountPanel } from './account-panel';
import { StudentsTable } from './students-table';

const SEARCH_DEBOUNCE_MS = 300;
const STUDENTS_PER_PAGE = 50;

export const StudentsDocument = () => {
  const { t } = useTranslation('admin');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const studentsQuery = useAdminStudents({
    search: debouncedSearch,
    perPage: STUDENTS_PER_PAGE,
  });

  const [activeId, setActiveId] = useState<number | null>(null);

  const activeStudent =
    studentsQuery.data?.items.find((student) => student.id === activeId) ??
    null;

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
        <EmptyState
          compact
          title={t('accounts.empty.title')}
          description={t('accounts.empty.body')}
          action={{
            label: t('common:actions.clearSearch'),
            onClick: () => setSearch(''),
          }}
          className="max-w-xl"
        />
      );
    }
    return (
      <EmptyState
        compact
        title={t('accounts.empty.noRows')}
        description={t('accounts.empty.noRowsBody')}
        className="max-w-xl"
      />
    );
  }

  return (
    <>
      <StudentsTable
        students={students}
        search={search}
        onSearchChange={setSearch}
        activeId={activeId}
        onActivate={(student) => setActiveId(student.id)}
      />
      {activeStudent && (
        <AccountPanel user={activeStudent} onClose={() => setActiveId(null)} />
      )}
    </>
  );
};
