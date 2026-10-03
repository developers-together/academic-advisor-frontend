import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { paths } from '@/config/paths';
import type { GovernanceNode } from '@/types/domain';

import { useGovernanceDashboard } from '../api/get-governance-dashboard';
import { pathToNode, scopedNodeOf } from '../utils/governance-tree';

import {
  GovernanceChildrenTable,
  GovernanceTableSkeleton,
} from './governance-children-table';
import { GovernanceQueryStates } from './governance-query-states';

export const VpDrilldown = () => {
  const { t, i18n } = useTranslation('governance');
  const [searchParams, setSearchParams] = useSearchParams();
  const dashboard = useGovernanceDashboard();

  const nameOf = (node: GovernanceNode) =>
    (i18n.language.startsWith('ar')
      ? (node.name_ar ?? node.name_en)
      : (node.name_en ?? node.name_ar)) ??
    node.code ??
    t(`levels.${node.level}`);

  return (
    <GovernanceQueryStates
      query={dashboard}
      audience="vp"
      emptyTitle={t('drilldown.empty.title')}
      emptyBody={t('drilldown.empty.body')}
      skeleton={<GovernanceTableSkeleton />}
    >
      {(root) => {
        const scoped = scopedNodeOf(root, searchParams.get('node'));
        const trail = pathToNode(root, scoped).filter((node) => node.code);
        return (
          <div className="space-y-4">
            <nav aria-label={t('drilldown.title')}>
              <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                <li>
                  <Link
                    to={paths.vp.drilldown.getHref()}
                    className="rounded-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  >
                    {t('drilldown.root')}
                  </Link>
                </li>
                {trail.map((node) => (
                  <li key={node.code} className="flex items-center gap-1">
                    <span aria-hidden>/</span>
                    <Link
                      to={paths.vp.drilldown.getHref(node.code ?? undefined)}
                      className="rounded-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    >
                      {nameOf(node)}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
            <p className="text-sm text-muted-foreground">
              {t('scopeLine', {
                level: t(`levels.${scoped.level}`),
                name: nameOf(scoped),
              })}
            </p>
            <GovernanceChildrenTable
              parent={scoped}
              onOpen={(code) => setSearchParams({ node: code })}
            />
          </div>
        );
      }}
    </GovernanceQueryStates>
  );
};
