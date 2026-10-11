import { useTranslation } from 'react-i18next';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import type { GovernanceNode } from '@/types/domain';
import { cn } from '@/utils/cn';

import {
  governanceNodeName,
  rateBand,
  rateBandClasses,
} from '../utils/governance-tree';

import { GovernanceKpiCards } from './governance-kpi-cards';

const NO_BAND_CLASSES = 'bg-muted text-muted-foreground';

export const FacultyStats = ({ faculty }: { faculty: GovernanceNode }) => {
  const { t, i18n } = useTranslation('governance');
  const name = governanceNodeName(faculty, i18n.language, t('levels.faculty'));
  const rate = faculty.metrics.completion_rate;
  const deans = faculty.deans ?? [];

  return (
    <section aria-label={name}>
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <CardTitle>{name}</CardTitle>
          <span
            className={cn(
              'rounded-md px-2 py-1 text-sm font-semibold tabular-nums',
              rate === null ? NO_BAND_CLASSES : rateBandClasses[rateBand(rate)],
            )}
          >
            {rate === null ? '—' : `${rate}%`}
          </span>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
              {t('faculty.deans')}
            </p>
            {deans.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {t('faculty.noDean')}
              </p>
            ) : (
              <ul className="mt-1 space-y-1">
                {deans.map((dean) => (
                  <li key={dean.id} className="text-sm">
                    {dean.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <GovernanceKpiCards metrics={faculty.metrics} />
        </CardBody>
      </Card>
    </section>
  );
};
