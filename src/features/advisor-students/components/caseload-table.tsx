import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PlanStateChip } from '@/components/domain/plan-state-chip';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatNumber } from '@/lib/i18n/format';
import type { AdvisorCaseloadStudent } from '@/types/domain';

type CaseloadFilter = 'all' | 'unmet' | 'aging';

const CASELOAD_FILTERS: CaseloadFilter[] = ['all', 'unmet', 'aging'];

const filterMatches = (
  student: AdvisorCaseloadStudent,
  filter: CaseloadFilter,
) =>
  filter === 'all' ||
  (filter === 'unmet' && student.has_unmet_meeting) ||
  (filter === 'aging' && student.is_aging);

const unitLine = (student: AdvisorCaseloadStudent) =>
  [student.faculty, student.school, student.department]
    .flatMap((unit) => (unit?.name_en ? [unit.name_en] : []))
    .join(' · ');

export type CaseloadTableProps = {
  students: AdvisorCaseloadStudent[];
  search: string;
  onSearchChange: (value: string) => void;
  activeId: number | null;
  onActivate: (student: AdvisorCaseloadStudent) => void;
};

export const CaseloadTable = ({
  students,
  search,
  onSearchChange,
  activeId,
  onActivate,
}: CaseloadTableProps) => {
  const { t } = useTranslation('advisor');
  const [filter, setFilter] = useState<CaseloadFilter>('all');

  const counts = {
    all: students.length,
    unmet: students.filter((student) => student.has_unmet_meeting).length,
    aging: students.filter((student) => student.is_aging).length,
  };
  const visible = students.filter((student) => filterMatches(student, filter));

  return (
    <div className="space-y-3">
      <Input
        type="search"
        label={t('students.searchLabel')}
        placeholder={t('students.searchPlaceholder')}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="max-w-sm"
      />

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as CaseloadFilter)}
      >
        <TabsList aria-label={t('students.title')}>
          {CASELOAD_FILTERS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(`students.tabs.${key}`)}{' '}
              <span className="text-muted-foreground tabular-nums">
                ({counts[key]})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="overflow-hidden rounded-lg border bg-card">
        <TableElement>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {(
                [
                  'student',
                  'email',
                  'unit',
                  'level',
                  'state',
                  'submitted',
                  'waiting',
                  'cgpa',
                ] as const
              ).map((key) => (
                <TableHead
                  key={key}
                  className={`sticky top-0 z-10 bg-card px-3 py-2 text-2xs font-medium tracking-wide uppercase${key === 'waiting' || key === 'cgpa' ? ' text-end' : ''}`}
                >
                  {t(`students.columns.${key}`)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((student) => (
              <TableRow
                key={student.id}
                aria-current={student.id === activeId ? 'true' : undefined}
                data-state={student.id === activeId ? 'selected' : undefined}
                className="border-border"
              >
                <TableCell className="px-3 py-2">
                  <button
                    type="button"
                    id={`explorer-row-${student.id}`}
                    aria-label={t('students.openReview', {
                      name: student.name,
                    })}
                    onClick={() => onActivate(student)}
                    className="rounded-sm text-start focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  >
                    <span className="block text-sm font-medium text-foreground">
                      {student.name}
                    </span>
                    {student.student_id && (
                      <span className="block text-2xs text-muted-foreground">
                        {student.student_id}
                      </span>
                    )}
                  </button>
                </TableCell>
                <TableCell className="px-3 py-2 text-2xs text-muted-foreground">
                  {student.sis_email}
                </TableCell>
                <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                  {unitLine(student) || '-'}
                </TableCell>
                <TableCell className="px-3 py-2 text-sm tabular-nums">
                  {student.curriculum_year_level ?? '-'}
                </TableCell>
                <TableCell className="px-3 py-2">
                  {student.plan_state ? (
                    <PlanStateChip status={student.plan_state} variant="dot" />
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="px-3 py-2 text-2xs text-muted-foreground">
                  {student.submitted_at
                    ? formatDate(student.submitted_at)
                    : '-'}
                </TableCell>
                <TableCell className="px-3 py-2 text-end">
                  {student.submitted_at ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="text-sm tabular-nums">
                        {waitingLabel(student, t)}
                      </span>
                      {student.is_aging && (
                        <Badge variant="warning" dot size="sm">
                          {t('badges.aging', { ns: 'common' })}
                        </Badge>
                      )}
                      {student.has_unmet_meeting && (
                        <Badge variant="info" dot size="sm">
                          {t('badges.meetingNotMet', { ns: 'common' })}
                        </Badge>
                      )}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                  {student.cgpa === null ? '-' : formatNumber(student.cgpa)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableElement>
      </div>

      {visible.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t('common:table.empty')}
        </p>
      )}
    </div>
  );
};

const waitingLabel = (
  student: AdvisorCaseloadStudent,
  t: (key: string, values?: Record<string, unknown>) => string,
) => {
  const days = student.submitted_at
    ? dayjs().diff(dayjs(student.submitted_at), 'day')
    : 0;
  return days === 1
    ? t('queue.waitingDays', { count: days })
    : t('queue.waitingDaysOther', { count: days });
};
