import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/ui/empty-state';
import type {
  PrerequisiteMapEntry,
  PrerequisiteMapState,
} from '@/types/domain';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 64;
const NODE_GAP = 12;
const HEADER_HEIGHT = 20;
const COLUMN_PAD = 8;

const stateStyles: Record<PrerequisiteMapState, { rect: string; dot: string }> =
  {
    completed: { rect: 'fill-success/10 stroke-success', dot: 'fill-success' },
    planned: { rect: 'fill-info/10 stroke-info', dot: 'fill-info' },
    eligible: { rect: 'fill-warning/10 stroke-warning', dot: 'fill-warning' },
    locked: { rect: 'fill-muted stroke-border', dot: 'fill-muted-foreground' },
  };

type LevelColumn = { level: number; entries: PrerequisiteMapEntry[] };

const levelColumns = (entries: PrerequisiteMapEntry[]): LevelColumn[] => {
  const byCode = new Map(entries.map((entry) => [entry.course_code, entry]));
  const levels = new Map<string, number>();
  const levelOf = (code: string, path: Set<string>): number => {
    const known = levels.get(code);
    if (known !== undefined) {
      return known;
    }
    const entry = byCode.get(code);
    if (!entry || path.has(code)) {
      return 0;
    }
    path.add(code);
    const level = entry.prerequisites.length
      ? 1 + Math.max(...entry.prerequisites.map((pre) => levelOf(pre, path)))
      : 0;
    path.delete(code);
    levels.set(code, level);
    return level;
  };

  for (const entry of entries) {
    levelOf(entry.course_code, new Set());
  }

  const columns: LevelColumn[] = [];
  for (const entry of entries) {
    const level = levels.get(entry.course_code) ?? 0;
    const column = columns.find((candidate) => candidate.level === level);
    if (column) {
      column.entries.push(entry);
    } else {
      columns.push({ level, entries: [entry] });
    }
  }
  return columns.sort((a, b) => a.level - b.level);
};

const truncateTitle = (title: string | null, code: string) => {
  const value = title ?? code;
  return value.length > 24 ? `${value.slice(0, 23).trimEnd()}…` : value;
};

export type PrereqMapProps = {
  entries: PrerequisiteMapEntry[];
  onRetry?: () => void;
  isRetrying?: boolean;
};

export const PrereqMap = ({
  entries,
  onRetry,
  isRetrying = false,
}: PrereqMapProps) => {
  const { t } = useTranslation('plan');
  const { t: tCommon } = useTranslation();

  if (entries.length === 0) {
    return (
      <EmptyState
        compact
        icon={RefreshCw}
        title={t('profile.prereqMap.empty')}
        action={
          onRetry && {
            label: tCommon('actions.retry'),
            onClick: onRetry,
            loading: isRetrying,
          }
        }
      />
    );
  }

  const columns = levelColumns(entries);

  return (
    <div
      role="region"
      aria-label={t('profile.prereqMap.title')}
      className="snap-x snap-mandatory overflow-x-auto"
    >
      <ul className="sr-only" aria-label={t('profile.prereqMap.listTitle')}>
        {entries.map((entry) => (
          <li key={entry.course_code}>
            {entry.course_code}, {entry.title ?? entry.course_code},{' '}
            {t(`profile.prereqMap.state.${entry.state}`)}
          </li>
        ))}
      </ul>
      <div className="flex w-max gap-3" aria-hidden>
        {columns.map((column) => {
          const width = NODE_WIDTH + COLUMN_PAD * 2;
          const height =
            HEADER_HEIGHT +
            column.entries.length * (NODE_HEIGHT + NODE_GAP) +
            COLUMN_PAD;
          return (
            <div key={column.level} className="snap-start">
              <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="text-foreground"
              >
                <text
                  x={COLUMN_PAD}
                  y={14}
                  className="fill-current text-2xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {t('profile.prereqMap.level', { level: column.level + 1 })}
                </text>
                {column.entries.map((entry, index) => {
                  const styles = stateStyles[entry.state];
                  const y = HEADER_HEIGHT + index * (NODE_HEIGHT + NODE_GAP);
                  return (
                    <g key={entry.course_code}>
                      <rect
                        x={COLUMN_PAD}
                        y={y}
                        width={NODE_WIDTH}
                        height={NODE_HEIGHT}
                        rx={8}
                        className={styles.rect}
                      />
                      <circle
                        cx={COLUMN_PAD + 14}
                        cy={y + 14}
                        r={3}
                        className={styles.dot}
                      />
                      <text
                        x={COLUMN_PAD + 24}
                        y={y + 18}
                        className="fill-current text-xs font-semibold"
                      >
                        {entry.course_code}
                      </text>
                      <text
                        x={COLUMN_PAD + 12}
                        y={y + 38}
                        className="fill-current text-2xs text-muted-foreground"
                      >
                        {truncateTitle(entry.title, entry.course_code)}
                      </text>
                      <text
                        x={COLUMN_PAD + 12}
                        y={y + 56}
                        className="fill-current text-2xs text-muted-foreground"
                      >
                        {t(`profile.prereqMap.state.${entry.state}`)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
};
