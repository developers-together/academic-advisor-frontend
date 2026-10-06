import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/config/paths';
import type { GovernanceNode } from '@/types/domain';

import {
  governanceNodeName,
  isBelowDepartment,
  sortByCompletionDesc,
} from '../utils/governance-tree';

export const GovernanceTableSkeleton = () => (
  <div aria-busy="true" className="space-y-3">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
);

const columns = [
  'unit',
  'students',
  'caseload',
  'approved',
  'completion',
  'median',
  'aging',
] as const;

const numberCell = (value: number | null) =>
  value === null ? '—' : String(value);

export const GovernanceChildrenTable = ({
  parent,
  onOpen,
}: {
  parent: GovernanceNode;
  onOpen: (code: string) => void;
}) => {
  const { t, i18n } = useTranslation('governance');
  const children = sortByCompletionDesc(
    parent.children.filter((child) => !isBelowDepartment(child)),
  );
  const unitColumn =
    children.length > 0
      ? t(`levels.${children[0].level}`)
      : t('scorecard.columns.faculty');

  if (children.length === 0) {
    return (
      <EmptyState
        compact
        title={t('drilldown.childTableEmpty.title')}
        description={t('drilldown.childTableEmpty.body', {
          name: governanceNodeName(parent, i18n.language, ''),
        })}
      />
    );
  }

  return (
    <>
      <ul className="list-none space-y-2 p-0 md:hidden">
        {children.map((child) => {
          const metrics = child.metrics;
          const code = child.code;
          return (
            <li key={code}>
              <Link
                to={code ? paths.vp.drilldown.getHref(code) : '.'}
                className="block rounded-md border bg-card p-3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              >
                <span className="block text-sm font-medium text-foreground">
                  {governanceNodeName(
                    child,
                    i18n.language,
                    t(`levels.${child.level}`),
                  )}
                </span>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-2xs tracking-wide text-muted-foreground uppercase">
                      {t('scorecard.columns.completion')}
                    </dt>
                    <dd className="tabular-nums">
                      {metrics.completion_rate === null
                        ? '—'
                        : `${metrics.completion_rate}%`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs tracking-wide text-muted-foreground uppercase">
                      {t('scorecard.columns.median')}
                    </dt>
                    <dd className="tabular-nums">
                      {metrics.median_decision_hours === null
                        ? '—'
                        : t('kpi.medianHours', {
                            value: metrics.median_decision_hours,
                          })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs tracking-wide text-muted-foreground uppercase">
                      {t('scorecard.columns.aging')}
                    </dt>
                    <dd className="tabular-nums">
                      {numberCell(metrics.aging_count)}
                    </dd>
                  </div>
                </dl>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <TableElement>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column}
                  aria-sort={column === 'completion' ? 'descending' : undefined}
                  className={`px-3 py-2 text-2xs font-medium tracking-wide uppercase${
                    column === 'unit' ? '' : ' text-end'
                  }`}
                >
                  {column === 'unit'
                    ? unitColumn
                    : t(`scorecard.columns.${column}`)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {children.map((child) => {
              const metrics = child.metrics;
              const code = child.code;
              return (
                <TableRow
                  key={code}
                  id={code ? `governance-node-${code}` : undefined}
                  onClick={() => code && onOpen(code)}
                  className="cursor-pointer border-border"
                >
                  <TableCell className="px-3 py-2">
                    <Link
                      to={code ? paths.vp.drilldown.getHref(code) : '.'}
                      className="rounded-sm text-sm font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    >
                      {governanceNodeName(
                        child,
                        i18n.language,
                        t(`levels.${child.level}`),
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                    {numberCell(metrics.students)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                    {numberCell(metrics.caseload)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                    {numberCell(metrics.approved)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                    {metrics.completion_rate === null
                      ? '—'
                      : `${metrics.completion_rate}%`}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                    {metrics.median_decision_hours === null
                      ? '—'
                      : t('kpi.medianHours', {
                          value: metrics.median_decision_hours,
                        })}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                    {numberCell(metrics.aging_count)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </TableElement>
      </div>
    </>
  );
};
