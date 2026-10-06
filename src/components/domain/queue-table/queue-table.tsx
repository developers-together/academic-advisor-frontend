import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PlanStateChip } from '@/components/domain/plan-state-chip';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AdvisorQueueItem, PlanStatus } from '@/types/domain';

type QueueFilter = 'all' | 'submitted' | 'under_review' | 'returned' | 'aging';

const QUEUE_FILTERS: QueueFilter[] = [
  'all',
  'submitted',
  'under_review',
  'returned',
  'aging',
];

const filterMatches = (item: AdvisorQueueItem, filter: QueueFilter) => {
  if (filter === 'all') return true;
  if (filter === 'aging') return item.is_aging;
  return item.status === (filter as PlanStatus);
};

export type QueueTableProps = {
  items: AdvisorQueueItem[];
  activeId: number | null;
  onActivate: (item: AdvisorQueueItem) => void;
  className?: string;
};

export const QueueTable = ({
  items,
  activeId,
  onActivate,
  className,
}: QueueTableProps) => {
  const { t } = useTranslation('advisor');
  const [filter, setFilter] = useState<QueueFilter>('all');

  const counts = {
    all: items.length,
    submitted: items.filter((item) => item.status === 'submitted').length,
    under_review: items.filter((item) => item.status === 'under_review').length,
    returned: items.filter((item) => item.status === 'returned').length,
    aging: items.filter((item) => item.is_aging).length,
  };
  const visible = items.filter((item) => filterMatches(item, filter));

  return (
    <div className={className}>
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as QueueFilter)}
      >
        <TabsList aria-label={t('queue.title')}>
          {QUEUE_FILTERS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(`queue.tabs.${key}`)}{' '}
              <span className="text-muted-foreground tabular-nums">
                ({counts[key]})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="mt-3 overflow-hidden rounded-lg border bg-card">
        <TableElement>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky top-0 z-10 bg-card px-3 py-2 text-2xs font-medium tracking-wide uppercase">
                {t('queue.columns.student')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-card px-3 py-2 text-2xs font-medium tracking-wide uppercase">
                {t('queue.columns.state')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-card px-3 py-2 text-2xs font-medium tracking-wide uppercase">
                {t('queue.columns.term')}
              </TableHead>
              <TableHead className="sticky top-0 z-10 bg-card px-3 py-2 text-end text-2xs font-medium tracking-wide uppercase">
                {t('queue.columns.waiting')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4">
                  <EmptyState
                    compact
                    title={t('queue.filteredEmptyTitle', {
                      filter: t(`queue.tabs.${filter}`),
                    })}
                    description={t('queue.filteredEmptyBody')}
                  />
                </td>
              </tr>
            ) : (
              visible.map((item) => (
                <TableRow
                  key={item.id}
                  aria-current={item.id === activeId ? 'true' : undefined}
                  data-state={item.id === activeId ? 'selected' : undefined}
                  className="border-border"
                >
                  <TableCell className="px-3 py-2">
                    <button
                      type="button"
                      id={`queue-row-${item.id}`}
                      aria-label={t('queue.openReview', {
                        name: item.student.name,
                      })}
                      onClick={() => onActivate(item)}
                      className="rounded-sm text-start focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    >
                      <span className="block text-sm font-medium text-foreground">
                        {item.student.name}
                      </span>
                      {item.student.student_id && (
                        <span className="block text-2xs text-muted-foreground">
                          {item.student.student_id}
                        </span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <PlanStateChip status={item.status} variant="dot" />
                  </TableCell>
                  <TableCell className="px-3 py-2 text-2xs text-muted-foreground">
                    {item.term_code}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-end">
                    <span className="inline-flex items-center gap-2">
                      <span className="text-sm tabular-nums">
                        {waitingLabel(item.submitted_at, t)}
                      </span>
                      {item.is_aging && (
                        <Badge variant="warning" dot size="sm">
                          {t('badges.aging', { ns: 'common' })}
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </TableElement>
      </div>
    </div>
  );
};

const waitingLabel = (
  submittedAt: string | null,
  t: (key: string, values?: Record<string, unknown>) => string,
) => {
  const days = submittedAt ? dayjs().diff(dayjs(submittedAt), 'day') : 0;
  return t('queue.waitingDays', { count: days });
};
