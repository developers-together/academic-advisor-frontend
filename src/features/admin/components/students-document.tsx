import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AsyncSurface } from '@/components/ui/async-surface';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

import { useAdminStudents } from '../api/get-admin-students';

import { AccountPanel } from './account-panel';
import { StudentsTable } from './students-table';

const SEARCH_DEBOUNCE_MS = 300;
const STUDENTS_PER_PAGE = 50;

export type StudentsDocumentProps = {
  onAddStudent: () => void;
};

export const StudentsDocument = ({ onAddStudent }: StudentsDocumentProps) => {
  const { t } = useTranslation('admin');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const studentsQuery = useAdminStudents({
    search: debouncedSearch,
    perPage: STUDENTS_PER_PAGE,
    page,
  });

  const [activeId, setActiveId] = useState<number | null>(null);

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const activeStudent =
    studentsQuery.data?.items.find((student) => student.id === activeId) ??
    null;

  const students = studentsQuery.data?.items ?? [];

  return (
    <AsyncSurface query={studentsQuery}>
      {students.length === 0 ? (
        debouncedSearch ? (
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
        ) : (
          <EmptyState
            compact
            title={t('accounts.empty.noRows')}
            description={t('accounts.empty.noRowsBody')}
            action={{
              label: t('accounts.addStudent'),
              onClick: onAddStudent,
            }}
            className="max-w-xl"
          />
        )
      ) : (
        <>
          <StudentsTable
            students={students}
            search={search}
            onSearchChange={changeSearch}
            activeId={activeId}
            onActivate={(student) => setActiveId(student.id)}
          />
          <StudentsPager
            page={page}
            onPage={setPage}
            count={students.length}
            perPage={STUDENTS_PER_PAGE}
            total={studentsQuery.data?.meta?.total ?? null}
          />
          {activeStudent && (
            <AccountPanel
              user={activeStudent}
              onClose={() => setActiveId(null)}
            />
          )}
        </>
      )}
    </AsyncSurface>
  );
};

const StudentsPager = ({
  page,
  onPage,
  count,
  perPage,
  total,
}: {
  page: number;
  onPage: (page: number) => void;
  count: number;
  perPage: number;
  total: number | null;
}) => {
  const { t } = useTranslation();
  if (total === null || total <= count) {
    return null;
  }
  const offset = (page - 1) * perPage;
  return (
    <nav
      aria-label={t('table.navLabel')}
      className="flex flex-wrap items-center justify-between gap-2 pt-3 text-sm"
    >
      <p className="text-muted-foreground tabular-nums">
        {t('table.pageInfo', {
          from: offset + 1,
          to: offset + count,
          total,
        })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          {t('table.previousLabel')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={offset + count >= total}
          onClick={() => onPage(page + 1)}
        >
          {t('table.nextLabel')}
        </Button>
      </div>
    </nav>
  );
};
