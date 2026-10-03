import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { GovernanceNode } from '@/types/domain';

import { rateBand, type RateBand } from '../utils/governance-tree';

const bandClasses: Record<RateBand, string> = {
  1: 'bg-data-1 text-data-1-foreground',
  2: 'bg-data-2 text-data-2-foreground',
  3: 'bg-data-3 text-data-3-foreground',
  4: 'bg-data-4 text-data-4-foreground',
};

const NO_DATA_CLASSES = 'bg-muted text-muted-foreground';

export const GovernanceChildGrid = ({
  node,
  buildHref,
}: {
  node: GovernanceNode;
  buildHref: (code: string) => string;
}) => {
  const { t, i18n } = useTranslation('governance');

  const nameOf = (child: GovernanceNode) =>
    (i18n.language.startsWith('ar')
      ? (child.name_ar ?? child.name_en)
      : (child.name_en ?? child.name_ar)) ??
    child.code ??
    t(`levels.${child.level}`);

  if (node.children.length === 0) {
    return (
      <EmptyState
        compact
        title={t('childGrid.empty.title', { name: nameOf(node) })}
        description={t('childGrid.empty.body')}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('childGrid.title')}</CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {node.children.map((child) => {
            const rate = child.metrics.completion_rate;
            return (
              <li key={child.code ?? nameOf(child)}>
                <Link
                  to={child.code ? buildHref(child.code) : '.'}
                  className={`flex h-full min-h-24 flex-col justify-between gap-2 rounded-lg border border-black/5 p-3 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden dark:border-white/10 ${
                    rate === null
                      ? NO_DATA_CLASSES
                      : bandClasses[rateBand(rate)]
                  }`}
                >
                  <span className="text-sm font-medium">{nameOf(child)}</span>
                  <span className="text-2xl leading-tight font-bold tabular-nums">
                    {rate === null ? (
                      <span className="text-sm font-normal">
                        {t('childGrid.noData')}
                      </span>
                    ) : (
                      `${rate}%`
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
};
