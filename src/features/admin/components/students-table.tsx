import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/form';
import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { User } from '@/types/domain';

import {
  accountAssigned,
  accountBinding,
  accountStatus,
  type AccountBinding,
} from '../utils/account-state';

const STATUS_VARIANT = {
  active: 'neutral',
  suspended: 'destructive',
} as const;

const BINDING_VARIANT: Record<
  AccountBinding,
  'success' | 'warning' | 'destructive'
> = {
  bound: 'success',
  pending: 'warning',
  failed: 'destructive',
};

const BINDING_KEY: Record<AccountBinding, string> = {
  bound: 'bound',
  pending: 'bindingPending',
  failed: 'bindingFailed',
};

export type StudentsTableProps = {
  students: User[];
  search: string;
  onSearchChange: (value: string) => void;
  activeId: number | null;
  onActivate: (student: User) => void;
};

export const StudentsTable = ({
  students,
  search,
  onSearchChange,
  activeId,
  onActivate,
}: StudentsTableProps) => {
  const { t } = useTranslation('admin');

  return (
    <div className="space-y-3">
      <Input
        type="search"
        label={t('accounts.searchLabel')}
        placeholder={t('accounts.searchPlaceholder')}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-hidden rounded-lg border bg-card">
        <TableElement>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {(['name', 'email', 'studentId', 'status'] as const).map(
                (key) => (
                  <TableHead
                    key={key}
                    className="sticky top-0 z-10 bg-card px-3 py-2 text-2xs font-medium tracking-wide uppercase"
                  >
                    {t(`accounts.columns.${key}`)}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              const status = accountStatus(student);
              const binding = accountBinding(student);
              return (
                <TableRow
                  key={student.id}
                  aria-current={student.id === activeId ? 'true' : undefined}
                  data-state={student.id === activeId ? 'selected' : undefined}
                  className="border-border"
                >
                  <TableCell className="px-3 py-2">
                    <button
                      type="button"
                      aria-label={t('accounts.actions.manage', {
                        name: student.name,
                      })}
                      onClick={() => onActivate(student)}
                      className="rounded-sm text-start text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    >
                      {student.name}
                    </button>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-2xs text-muted-foreground">
                    {student.email}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="bidi-code text-sm tabular-nums">
                        {student.student_id ?? '-'}
                      </span>
                      <Badge variant={BINDING_VARIANT[binding]} size="sm">
                        {t(`common:badges.${BINDING_KEY[binding]}`)}
                      </Badge>
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[status]} size="sm">
                        {t(`common:badges.${status}`)}
                      </Badge>
                      <Badge
                        variant={accountAssigned(student) ? 'info' : 'neutral'}
                        size="sm"
                      >
                        {t(
                          `common:badges.${
                            accountAssigned(student) ? 'assigned' : 'unassigned'
                          }`,
                        )}
                      </Badge>
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </TableElement>
      </div>
    </div>
  );
};
