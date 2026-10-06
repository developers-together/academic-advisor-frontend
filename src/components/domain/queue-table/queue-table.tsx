import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PlanStateChip } from '@/components/domain/plan-state-chip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AdvisorQueueItem, PlanStatus } from '@/types/domain';
import { cn } from '@/utils/cn';

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

/** Decision rail list (design.md section 26.4): one primary action per rail. */
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
      <ul className="mt-3 list-none space-y-2 p-0">
        {visible.length === 0 ? (
          <li>
            <EmptyState
              compact
              title={t('queue.filteredEmptyTitle', {
                filter: t(`queue.tabs.${filter}`),
              })}
              description={t('queue.filteredEmptyBody')}
            />
          </li>
        ) : (
          visible.map((item) => (
            <li
              key={item.id}
              aria-current={item.id === activeId ? 'true' : undefined}
              className={cn(
                'grid grid-cols-2 items-center gap-x-4 gap-y-2 rounded-md border bg-card px-4 py-3 md:grid-cols-[1.3fr_1fr_1.3fr_1fr_auto]',
                item.id === activeId &&
                  'outline-2 -outline-offset-2 outline-ring',
              )}
            >
              <div>
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
              </div>
              <div>
                <PlanStateChip status={item.status} variant="dot" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="block text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t('queue.rail.signal')}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t('queue.rail.term', { term: item.term_code })}
                </span>
              </div>
              <div className="text-end md:text-start">
                <span className="block text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t('queue.rail.urgency')}
                </span>
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
              </div>
              <div className="col-span-2 flex justify-end md:col-span-1">
                <Button size="sm" onClick={() => onActivate(item)}>
                  {t('queue.rail.review')}
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
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
