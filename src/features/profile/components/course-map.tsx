import { Lock, Minus, Plus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import type {
  PrerequisiteMapEntry,
  PrerequisiteMapState,
} from '@/types/domain';
import { cn } from '@/utils/cn';

const NODE_WIDTH = 168;
const NODE_HEIGHT = 62;
const NODE_GAP = 14;
const COLUMN_GAP = 56;

const ZOOM_STEPS = [0.8, 1, 1.25];

type PositionedNode = {
  entry: PrerequisiteMapEntry;
  column: number;
  row: number;
  x: number;
  y: number;
};

type Layout = {
  nodes: PositionedNode[];
  byCode: Map<string, PositionedNode>;
  columnCount: number;
  columnHeights: number[];
  width: number;
  height: number;
};

const chainOf = (
  code: string,
  byCode: Map<string, PrerequisiteMapEntry>,
): Set<string> => {
  const chain = new Set<string>();
  const walk = (current: string) => {
    for (const prerequisite of byCode.get(current)?.prerequisites ?? []) {
      if (!chain.has(prerequisite)) {
        chain.add(prerequisite);
        walk(prerequisite);
      }
    }
  };
  walk(code);
  return chain;
};

const layoutOf = (entries: PrerequisiteMapEntry[]): Layout => {
  const entryByCode = new Map(
    entries.map((entry) => [entry.course_code, entry]),
  );
  const levels = new Map<string, number>();
  const levelOf = (code: string, path: Set<string>): number => {
    const known = levels.get(code);
    if (known !== undefined) return known;
    const entry = entryByCode.get(code);
    if (!entry || path.has(code)) return 0;
    path.add(code);
    const level = entry.prerequisites.length
      ? 1 + Math.max(...entry.prerequisites.map((pre) => levelOf(pre, path)))
      : 0;
    path.delete(code);
    levels.set(code, level);
    return level;
  };
  for (const entry of entries) levelOf(entry.course_code, new Set());

  const columns: PrerequisiteMapEntry[][] = [];
  for (const entry of entries) {
    const level = levels.get(entry.course_code) ?? 0;
    (columns[level] ??= []).push(entry);
  }
  const dense = columns.filter((column) => column?.length);

  const nodes: PositionedNode[] = [];
  const columnHeights: number[] = [];
  dense.forEach((column, columnIndex) => {
    let x = 0;
    for (let index = 0; index < columnIndex; index += 1) {
      x += NODE_WIDTH + COLUMN_GAP;
    }
    column.forEach((entry, rowIndex) => {
      nodes.push({
        entry,
        column: columnIndex,
        row: rowIndex,
        x,
        y: rowIndex * (NODE_HEIGHT + NODE_GAP),
      });
    });
    columnHeights.push(
      column.length * NODE_HEIGHT + (column.length - 1) * NODE_GAP,
    );
  });

  const width = dense.length * NODE_WIDTH + (dense.length - 1) * COLUMN_GAP;
  const height = Math.max(...columnHeights, NODE_HEIGHT);

  return {
    nodes,
    byCode: new Map(nodes.map((node) => [node.entry.course_code, node])),
    columnCount: dense.length,
    columnHeights,
    width,
    height,
  };
};

const nodeStateClasses: Record<
  PrerequisiteMapState,
  { box: string; dot: string }
> = {
  completed: {
    box: 'border-success/60 bg-success/10 hover:border-success',
    dot: 'bg-success',
  },
  planned: {
    box: 'border-info/60 bg-info/10 hover:border-info',
    dot: 'bg-info',
  },
  eligible: {
    box: 'border-warning/60 bg-warning/10 hover:border-warning',
    dot: 'bg-warning',
  },
  locked: {
    box: 'border-border bg-muted hover:border-muted-foreground/40',
    dot: 'bg-muted-foreground',
  },
};

export type CourseMapProps = {
  entries: PrerequisiteMapEntry[];
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
};

export const CourseMap = ({
  entries,
  onRetry,
  isRetrying = false,
  className,
}: CourseMapProps) => {
  const { t } = useTranslation('plan');
  const [selected, setSelected] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(1);

  const layout = useMemo(() => layoutOf(entries), [entries]);
  const entryByCode = useMemo(
    () => new Map(entries.map((entry) => [entry.course_code, entry])),
    [entries],
  );
  const selectedNode = selected ? (layout.byCode.get(selected) ?? null) : null;
  const chain = selected ? chainOf(selected, entryByCode) : new Set<string>();

  if (entries.length === 0) {
    return (
      <EmptyState
        compact
        title={t('courseMap.empty.title')}
        description={t('courseMap.empty.body')}
        action={
          onRetry
            ? {
                label: t('actions.retry', { ns: 'common' }),
                onClick: onRetry,
                loading: isRetrying,
              }
            : undefined
        }
        className="max-w-xl"
      />
    );
  }

  const completed = entries.filter(
    (entry) => entry.state === 'completed',
  ).length;

  const stateLabel = (state: PrerequisiteMapState) =>
    t(`builder.mapState.${state}`);

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground tabular-nums">
          {t('courseMap.summary', {
            completed,
            total: entries.length,
          })}
        </p>
        <div
          role="group"
          aria-label={t('courseMap.zoomLabel')}
          className="flex items-center gap-1"
        >
          <Button
            variant="outline"
            size="icon"
            aria-label={t('courseMap.zoomOut')}
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
          >
            <Minus className="size-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t('courseMap.zoomReset')}
            disabled={zoomIndex === 1}
            onClick={() => setZoomIndex(1)}
          >
            <RotateCcw className="size-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t('courseMap.zoomIn')}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            onClick={() =>
              setZoomIndex((index) =>
                Math.min(ZOOM_STEPS.length - 1, index + 1),
              )
            }
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div
          role="group"
          aria-label={t('courseMap.title')}
          className="overflow-auto rounded-lg border bg-muted/30 p-4"
        >
          <div
            className="relative motion-safe:transition-transform motion-safe:duration-300"
            style={{
              width: layout.width,
              height: layout.height,
              transform: `scale(${ZOOM_STEPS[zoomIndex]})`,
              transformOrigin: 'top left',
            }}
          >
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0"
              width={layout.width}
              height={layout.height}
            >
              {layout.nodes.flatMap((node) =>
                node.entry.prerequisites.map((prerequisite) => {
                  const from = layout.byCode.get(prerequisite);
                  if (!from) return null;
                  const x1 = from.x + NODE_WIDTH;
                  const y1 = from.y + NODE_HEIGHT / 2;
                  const x2 = node.x;
                  const y2 = node.y + NODE_HEIGHT / 2;
                  const mid = (x1 + x2) / 2;
                  const active =
                    selected !== null &&
                    (node.entry.course_code === selected ||
                      (chain.has(node.entry.course_code) &&
                        (prerequisite === selected ||
                          chain.has(prerequisite))));
                  return (
                    <path
                      key={`${prerequisite}-${node.entry.course_code}`}
                      d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      strokeWidth={active ? 2.5 : 1.5}
                      markerEnd="url(#course-map-arrow)"
                      className={cn(
                        'transition-opacity motion-safe:duration-200',
                        selected === null
                          ? 'stroke-border'
                          : active
                            ? 'stroke-primary'
                            : 'stroke-border opacity-30',
                      )}
                    />
                  );
                }),
              )}
              <defs>
                <marker
                  id="course-map-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" className="fill-border" />
                </marker>
              </defs>
            </svg>

            {layout.nodes.map((node) => {
              const isSelected = selected === node.entry.course_code;
              const inChain = chain.has(node.entry.course_code);
              const isUnrelated =
                selected !== null &&
                !isSelected &&
                !inChain &&
                !chainOf(node.entry.course_code, entryByCode).has(selected);
              const styles = nodeStateClasses[node.entry.state];
              return (
                <button
                  key={node.entry.course_code}
                  type="button"
                  onClick={() =>
                    setSelected(isSelected ? null : node.entry.course_code)
                  }
                  aria-pressed={isSelected}
                  style={{
                    position: 'absolute',
                    left: node.x,
                    top: node.y,
                    width: NODE_WIDTH,
                    minHeight: NODE_HEIGHT,
                  }}
                  className={cn(
                    'rounded-lg border p-2 text-start transition-all hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden motion-safe:duration-200',
                    styles.box,
                    isSelected && 'ring-2 ring-primary',
                    isUnrelated && 'opacity-35',
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className={cn('size-2 shrink-0 rounded-full', styles.dot)}
                    />
                    <span className="bidi-code truncate text-xs font-semibold">
                      {node.entry.course_code}
                    </span>
                    {node.entry.state === 'locked' && (
                      <Lock
                        className="ms-auto size-3 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-2xs leading-tight text-muted-foreground">
                    {node.entry.title ?? ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          aria-live="polite"
          className="self-start rounded-lg border bg-card p-4"
        >
          {selectedNode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="bidi-code text-sm font-semibold">
                  {selectedNode.entry.course_code}
                </span>
                <Badge variant="neutral">
                  {stateLabel(selectedNode.entry.state)}
                </Badge>
              </div>
              {selectedNode.entry.title && (
                <p className="text-sm text-muted-foreground">
                  {selectedNode.entry.title}
                </p>
              )}
              {selectedNode.entry.prerequisites.length > 0 ? (
                <div>
                  <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                    {t('courseMap.requires')}
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {selectedNode.entry.prerequisites.map((prerequisite) => (
                      <li key={prerequisite}>
                        <button
                          type="button"
                          onClick={() => setSelected(prerequisite)}
                          className="bidi-code rounded-full border bg-muted px-2 py-0.5 text-xs font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                        >
                          {prerequisite}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('courseMap.noRequirements')}
                </p>
              )}
              {selectedNode.entry.state === 'locked' &&
                selectedNode.entry.prerequisites.length > 0 && (
                  <p className="rounded-md bg-warning/10 p-2 text-xs text-warning-foreground">
                    {t('courseMap.lockedHint', {
                      courses: selectedNode.entry.prerequisites.join(', '),
                    })}
                  </p>
                )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('courseMap.pickHint')}
            </p>
          )}
        </div>
      </div>

      <ul className="sr-only">
        {entries.map((entry) => (
          <li key={entry.course_code}>
            {entry.course_code} {entry.title ?? ''} {stateLabel(entry.state)}
            {entry.prerequisites.length > 0
              ? ` ${t('courseMap.requires')} ${entry.prerequisites.join(', ')}`
              : ''}
          </li>
        ))}
      </ul>
    </div>
  );
};

CourseMap.displayName = 'CourseMap';
