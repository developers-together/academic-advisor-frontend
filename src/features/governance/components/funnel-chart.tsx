import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { GovernanceFunnel } from '@/types/domain';

import { axisPropsFor } from '../utils/governance-tree';

const PIPELINE_KEYS = [
  'draft',
  'submitted',
  'under_review',
  'returned',
  'approved',
] as const;

const TERMINAL_KEYS = ['expired', 'closed', 'withdrawn', 'discarded'] as const;

const FUNNEL_KEYS = [...PIPELINE_KEYS, ...TERMINAL_KEYS] as const;

const PIPELINE_FILL = 'var(--color-data-pipeline)';
const TERMINAL_FILL = 'var(--color-data-terminal)';

type FunnelEntry = {
  key: (typeof FUNNEL_KEYS)[number];
  label: string;
  count: number;
  fill: string;
};

const isPipeline = (key: (typeof FUNNEL_KEYS)[number]) =>
  (PIPELINE_KEYS as readonly string[]).includes(key);

export const FunnelChart = ({
  funnel,
  term,
}: {
  funnel: GovernanceFunnel;
  term: string | null;
}) => {
  const { t } = useTranslation('governance');
  const { t: tCommon, i18n } = useTranslation('common');

  const entries: FunnelEntry[] = FUNNEL_KEYS.map((key) => ({
    key,
    label: tCommon(`planStates.${key}`),
    count: funnel[key],
    fill: isPipeline(key) ? PIPELINE_FILL : TERMINAL_FILL,
  }));

  if (entries.every((entry) => entry.count === 0)) {
    return (
      <EmptyState
        compact
        title={t('funnel.empty.title')}
        description={t('funnel.empty.body', { term: term ?? '' })}
      />
    );
  }

  const direction = i18n.dir() as 'ltr' | 'rtl';
  const axis = axisPropsFor(direction);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('funnel.title')}</CardTitle>
        <p className="text-xs text-muted-foreground">{t('funnel.question')}</p>
        <ul className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 rounded-sm bg-data-pipeline"
            />
            {t('funnel.pipeline')}
          </li>
          <li className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 rounded-sm bg-data-terminal"
            />
            {t('funnel.terminal')}
          </li>
        </ul>
      </CardHeader>
      <CardBody className="text-foreground">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={entries} margin={{ top: 24 }}>
            <XAxis
              dataKey="label"
              tickLine={false}
              tick={{ fontSize: 12 }}
              interval={0}
              reversed={axis.reversed}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              width={40}
              orientation={axis.orientation}
            />
            <Tooltip
              wrapperClassName="tabular-nums"
              cursor={{ fill: 'var(--color-muted)' }}
            />
            <Bar
              dataKey="count"
              isAnimationActive={false}
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                dataKey="count"
                position="top"
                className="fill-foreground text-2xs tabular-nums"
              />
              {entries.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <table className="sr-only">
          <caption>{t('funnel.title')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('funnel.table.state')}</th>
              <th scope="col">{t('funnel.table.plans')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.key}>
                <th scope="row">{entry.label}</th>
                <td className="tabular-nums">{entry.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
};
