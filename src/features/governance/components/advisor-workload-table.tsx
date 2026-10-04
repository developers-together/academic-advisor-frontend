import { useTranslation } from 'react-i18next';

import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { GovernanceAdvisorRow } from '@/types/domain';

export type AdvisorWorkloadTableProps = {
  advisors: GovernanceAdvisorRow[];
  className?: string;
};

export const AdvisorWorkloadTable = ({
  advisors,
  className,
}: AdvisorWorkloadTableProps) => {
  const { t } = useTranslation('governance');
  const sorted = [...advisors].sort((a, b) =>
    a.completion_rate === b.completion_rate
      ? a.name.localeCompare(b.name)
      : (b.completion_rate ?? -1) - (a.completion_rate ?? -1),
  );

  return (
    <div className={className}>
      <TableElement>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>{t('advisors.columns.advisor')}</TableHead>
            <TableHead>{t('advisors.columns.unit')}</TableHead>
            <TableHead className="text-end">
              {t('advisors.columns.caseload')}
            </TableHead>
            <TableHead className="text-end">
              {t('advisors.columns.queue')}
            </TableHead>
            <TableHead className="text-end">
              {t('advisors.columns.approved')}
            </TableHead>
            <TableHead className="text-end">
              {t('advisors.columns.completion')}
            </TableHead>
            <TableHead className="text-end">
              {t('advisors.columns.median')}
            </TableHead>
            <TableHead className="text-end">
              {t('advisors.columns.aging')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((advisor) => (
            <TableRow key={advisor.id} className="border-border">
              <TableCell className="px-3 py-2 text-sm font-medium">
                {advisor.name}
              </TableCell>
              <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                {advisor.unit_en ?? '—'}
              </TableCell>
              <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                {advisor.caseload}
              </TableCell>
              <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                {advisor.queue_size}
              </TableCell>
              <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                {advisor.approved}
              </TableCell>
              <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                {advisor.completion_rate === null
                  ? '—'
                  : `${advisor.completion_rate}%`}
              </TableCell>
              <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                {advisor.median_decision_hours === null
                  ? '—'
                  : t('kpi.medianHours', {
                      value: advisor.median_decision_hours,
                    })}
              </TableCell>
              <TableCell className="px-3 py-2 text-end text-sm tabular-nums">
                {advisor.aging_count}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableElement>
    </div>
  );
};
