import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { GovernanceNode } from '@/types/domain';
import { cn } from '@/utils/cn';

import { rateBand, type RateBand } from '../utils/governance-tree';

const bandClasses: Record<RateBand, string> = {
  1: 'bg-data-1 text-data-1-foreground',
  2: 'bg-data-2 text-data-2-foreground',
  3: 'bg-data-3 text-data-3-foreground',
  4: 'bg-data-4 text-data-4-foreground',
};

const NO_DATA_CLASSES = 'bg-muted text-muted-foreground';

const FILTER_ALL = 'all';

const selectClasses =
  'h-11 w-full max-w-xs rounded-md border border-input bg-transparent px-2 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden';

const cellClassesOf = (rate: number | null) =>
  `flex h-full min-h-24 flex-col justify-between gap-2 rounded-lg border border-black/5 p-3 dark:border-white/10 ${
    rate === null ? NO_DATA_CLASSES : bandClasses[rateBand(rate)]
  }`;

const ChildCell = ({
  child,
  name,
  noDataLabel,
}: {
  child: GovernanceNode;
  name: string;
  noDataLabel: string;
}) => {
  const rate = child.metrics.completion_rate;
  return (
    <>
      <span className="text-sm font-medium">{name}</span>
      <span className="text-2xl leading-tight font-bold tabular-nums">
        {rate === null ? (
          <span className="text-sm font-normal">{noDataLabel}</span>
        ) : (
          `${rate}%`
        )}
      </span>
    </>
  );
};

const isUnitChild = (child: GovernanceNode) =>
  child.level === 'school' || child.level === 'department';

export const GovernanceChildGrid = ({
  node,
  buildHref,
}: {
  node: GovernanceNode;
  buildHref: (code: string) => string;
}) => {
  const { t, i18n } = useTranslation('governance');
  const [filterCode, setFilterCode] = useState(FILTER_ALL);

  const nameOf = (child: GovernanceNode) =>
    (i18n.language.startsWith('ar')
      ? (child.name_ar ?? child.name_en)
      : (child.name_en ?? child.name_ar)) ??
    child.code ??
    t(`levels.${child.level}`);

  const keyOf = (child: GovernanceNode) => child.code ?? nameOf(child);

  if (node.children.length === 0) {
    return (
      <EmptyState
        compact
        title={t('childGrid.empty.title', { name: nameOf(node) })}
        description={t('childGrid.empty.body')}
      />
    );
  }

  const filterable = node.children.every(isUnitChild);
  const activeFilterCode = node.children.some(
    (child) => keyOf(child) === filterCode,
  )
    ? filterCode
    : FILTER_ALL;
  const visibleChildren =
    activeFilterCode === FILTER_ALL
      ? node.children
      : node.children.filter((child) => keyOf(child) === activeFilterCode);

  return (
    <Card>
      <CardHeader className={cn(filterable && 'gap-3')}>
        <CardTitle>{t('childGrid.title')}</CardTitle>
        {filterable && (
          <select
            aria-label={t(
              node.children[0].level === 'department'
                ? 'filter.byDepartment'
                : 'filter.bySchool',
            )}
            value={activeFilterCode}
            onChange={(event) => setFilterCode(event.target.value)}
            className={selectClasses}
          >
            <option value={FILTER_ALL}>{t('filter.all')}</option>
            {node.children.map((child) => (
              <option key={keyOf(child)} value={keyOf(child)}>
                {nameOf(child)}
              </option>
            ))}
          </select>
        )}
      </CardHeader>
      <CardBody>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleChildren.map((child) => {
            const name = nameOf(child);
            const noDataLabel = t('childGrid.noData');
            return (
              <li key={keyOf(child)}>
                {child.level === 'advisor' ? (
                  <div className={cellClassesOf(child.metrics.completion_rate)}>
                    <ChildCell
                      child={child}
                      name={name}
                      noDataLabel={noDataLabel}
                    />
                  </div>
                ) : (
                  <Link
                    to={child.code ? buildHref(child.code) : '.'}
                    className={`${cellClassesOf(child.metrics.completion_rate)} transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden`}
                  >
                    <ChildCell
                      child={child}
                      name={name}
                      noDataLabel={noDataLabel}
                    />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
};
