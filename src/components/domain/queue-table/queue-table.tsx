import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PlanStateChip } from '@/components/domain/plan-state-chip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ResponsiveTabs } from '@/components/ui/tabs';
import type { AdvisorQueueItem, PlanStatus } from '@/types/domain';
import { cn } from '@/utils/cn';

type QueueFilter = 'all' | 'submitted' | 'under_review' | 'returned' | 'aging';
type QueueSort = 'urgent' | 'newest' | 'waiting';

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

const waitingDays = (item: AdvisorQueueItem) =>
  item.submitted_at ? dayjs().diff(dayjs(item.submitted_at), 'day') : 0;

const sortQueue = (items: AdvisorQueueItem[], sort: QueueSort) => {
  const sorted = [...items];
  if (sort === 'urgent') {
    sorted.sort((a, b) => {
      if (a.is_aging !== b.is_aging) return a.is_aging ? -1 : 1;
      return waitingDays(b) - waitingDays(a);
    });
  } else if (sort === 'newest') {
    sorted.sort(
      (a, b) =>
        (b.submitted_at ? dayjs(b.submitted_at).valueOf() : 0) -
        (a.submitted_at ? dayjs(a.submitted_at).valueOf() : 0),
    );
  } else {
    sorted.sort((a, b) => waitingDays(b) - waitingDays(a));
  }
  return sorted;
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
  const [sort, setSort] = useState<QueueSort>('urgent');

  const counts = {
    all: items.length,
    submitted: items.filter((item) => item.status === 'submitted').length,
    under_review: items.filter((item) => item.status === 'under_review').length,
    returned: items.filter((item) => item.status === 'returned').length,
    aging: items.filter((item) => item.is_aging).length,
  };
  const visible = sortQueue(
    items.filter((item) => filterMatches(item, filter)),
    sort,
  );

  return (
    <div className={className}>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <ResponsiveTabs
          value={filter}
          onValueChange={(value) => setFilter(value as QueueFilter)}
          aria-label={t('queue.title')}
          options={QUEUE_FILTERS.map((key) => ({
            value: key,
            label: t(`queue.tabs.${key}`),
            count: counts[key],
          }))}
          className="lg:w-auto lg:max-w-none"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="sr-only lg:not-sr-only">
            {t('queue.sort.label')}
          </span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as QueueSort)}
            aria-label={t('queue.sort.label')}
            className="h-11 w-full rounded-md border border-input bg-card px-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden lg:h-9 lg:w-auto [@media(pointer:fine)_and_(min-width:1024px)]:h-9"
          >
            <option value="urgent">{t('queue.sort.urgent')}</option>
            <option value="newest">{t('queue.sort.newest')}</option>
            <option value="waiting">{t('queue.sort.waiting')}</option>
          </select>
        </label>
      </div>
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
                'flex flex-wrap items-start justify-between gap-x-3 gap-y-2 rounded-md border bg-card px-4 py-2.5 md:grid md:grid-cols-[1.3fr_1fr_1.3fr_1fr_auto] md:items-center md:gap-x-4',
                item.id === activeId &&
                  'outline-2 -outline-offset-2 outline-ring',
              )}
            >
              <div className="order-1 min-w-0 md:col-start-1">
                <button
                  type="button"
                  id={`queue-row-${item.id}`}
                  aria-label={t('queue.openReview', {
                    name: item.student.name,
                  })}
                  onClick={() => onActivate(item)}
                  className="min-w-0 rounded-sm text-start focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                >
                  <span className="block truncate text-sm font-medium text-foreground">
                    {item.student.name}
                  </span>
                  {item.student.student_id && (
                    <span className="block text-2xs text-muted-foreground">
                      {item.student.student_id}
                    </span>
                  )}
                </button>
              </div>
              <div className="order-2 md:col-start-5">
                <Button size="sm" onClick={() => onActivate(item)}>
                  {t('queue.rail.review')}
                </Button>
              </div>
              <div className="order-3 md:col-start-2">
                <PlanStateChip status={item.status} variant="dot" />
              </div>
              <div className="hidden md:col-start-3 md:block">
                <span className="block text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t('queue.rail.signal')}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t('queue.rail.term', { term: item.term_code })}
                </span>
              </div>
              <div className="order-4 md:col-start-4">
                <span className="hidden text-2xs font-medium tracking-wide text-muted-foreground uppercase md:block">
                  {t('queue.rail.urgency')}
                </span>
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground tabular-nums">
                  {t('queue.waitingDays', { count: waitingDays(item) })}
                  {item.is_aging && (
                    <Badge variant="warning" dot size="sm">
                      {t('badges.aging', { ns: 'common' })}
                    </Badge>
                  )}
                </span>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};
