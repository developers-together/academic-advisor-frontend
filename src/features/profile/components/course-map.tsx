import {
  CalendarDays,
  CircleCheck,
  Hand,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  Unlock,
} from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useScrollableTabIndex } from '@/hooks/use-scrollable-tab-index';
import type {
  PrerequisiteMapEntry,
  PrerequisiteMapState,
} from '@/types/domain';
import { cn } from '@/utils/cn';

const NODE_WIDTH = 168;
const NODE_HEIGHT = 82;
const NODE_GAP = 24;
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

const stateIcons = {
  completed: CircleCheck,
  planned: CalendarDays,
  eligible: Unlock,
  locked: Lock,
};

const legendClasses: Record<PrerequisiteMapState, string> = {
  completed: 'border-success/30 bg-success/10 text-success',
  planned: 'border-info/30 bg-info/10 text-info',
  eligible: 'border-warning/30 bg-warning/10 text-warning',
  locked: 'border-border bg-muted text-muted-foreground',
};

const nodeStateClasses: Record<PrerequisiteMapState, { box: string }> = {
  completed: {
    box: 'border-success/60 bg-success/10 hover:border-success',
  },
  planned: {
    box: 'border-info/60 bg-info/10 hover:border-info',
  },
  eligible: {
    box: 'border-warning/60 bg-warning/10 hover:border-warning',
  },
  locked: {
    box: 'border-border bg-muted hover:border-muted-foreground/40',
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
  const { t, i18n } = useTranslation('plan');
  const isRtl = i18n.dir() === 'rtl';
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const [panning, setPanning] = useState(false);
  const { ref: canvasRef, tabIndex } = useScrollableTabIndex();
  const [selected, setSelected] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(1);
  const [preview, setPreview] = useState<string | null>(null);
  const activeCode = preview ?? selected;
  const markerId = useId();

  const layout = useMemo(() => layoutOf(entries), [entries]);
  const entryByCode = useMemo(
    () => new Map(entries.map((entry) => [entry.course_code, entry])),
    [entries],
  );
  const selectedNode = activeCode
    ? (layout.byCode.get(activeCode) ?? null)
    : null;
  const chain = activeCode
    ? chainOf(activeCode, entryByCode)
    : new Set<string>();

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
                retry: true,
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
        <p className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
          <Hand className="size-4" aria-hidden />
          <span id={`${markerId}-pan-hint`}>{t('courseMap.panHint')}</span>
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

      <div
        className="mb-4 flex flex-wrap gap-2"
        aria-label={t('courseMap.title')}
      >
        {(['completed', 'planned', 'eligible', 'locked'] as const).map(
          (state) => {
            const Icon = stateIcons[state];
            return (
              <span
                key={state}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium',
                  legendClasses[state],
                )}
              >
                <Icon className="size-4" aria-hidden />
                {stateLabel(state)}
              </span>
            );
          },
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div
          ref={canvasRef}
          role="group"
          aria-label={t('courseMap.title')}
          aria-describedby={`${markerId}-pan-hint`}
          tabIndex={tabIndex}
          onPointerDown={(event) => {
            if (event.pointerType === 'touch' || event.button !== 0) return;
            drag.current = {
              x: event.clientX,
              y: event.clientY,
              left: event.currentTarget.scrollLeft,
              top: event.currentTarget.scrollTop,
              moved: false,
            };
          }}
          onPointerMove={(event) => {
            const start = drag.current;
            if (!start) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (!start.moved && Math.hypot(dx, dy) < 5) return;
            start.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            setPanning(true);
            event.currentTarget.scrollLeft = start.left - dx;
            event.currentTarget.scrollTop = start.top - dy;
          }}
          onPointerUp={() => {
            setPanning(false);
          }}
          onClickCapture={(event) => {
            if (drag.current?.moved) {
              event.preventDefault();
              event.stopPropagation();
            }
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
            setPanning(false);
          }}
          onLostPointerCapture={() => {
            setPanning(false);
          }}
          onPointerLeave={() => {
            if (!panning) drag.current = null;
          }}
          className={cn(
            'course-map-canvas max-h-[65dvh] overflow-auto rounded-2xl border p-6 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
            panning ? 'cursor-grabbing select-none' : 'cursor-grab',
          )}
        >
          <div
            dir="ltr"
            style={{
              width: layout.width * ZOOM_STEPS[zoomIndex],
              height: layout.height * ZOOM_STEPS[zoomIndex],
            }}
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
                    const x1 = isRtl
                      ? layout.width - from.x - NODE_WIDTH
                      : from.x + NODE_WIDTH;
                    const y1 = from.y + NODE_HEIGHT / 2;
                    const x2 = isRtl ? layout.width - node.x : node.x;
                    const y2 = node.y + NODE_HEIGHT / 2;
                    const mid = (x1 + x2) / 2;
                    const active =
                      activeCode !== null &&
                      (node.entry.course_code === activeCode ||
                        (chain.has(node.entry.course_code) &&
                          (prerequisite === activeCode ||
                            chain.has(prerequisite))));
                    return (
                      <path
                        key={`${prerequisite}-${node.entry.course_code}`}
                        d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        strokeWidth={active ? 2.5 : 1.5}
                        markerEnd={`url(#${markerId})`}
                        className={cn(
                          'transition-opacity motion-safe:duration-200',
                          activeCode === null
                            ? 'stroke-border'
                            : active
                              ? 'course-map-flow stroke-primary'
                              : 'stroke-border opacity-30',
                        )}
                      />
                    );
                  }),
                )}
                <defs>
                  <marker
                    id={markerId}
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
                const isSelected = activeCode === node.entry.course_code;
                const inChain = chain.has(node.entry.course_code);
                const isUnrelated =
                  activeCode !== null &&
                  !isSelected &&
                  !inChain &&
                  !chainOf(node.entry.course_code, entryByCode).has(activeCode);
                const styles = nodeStateClasses[node.entry.state];
                const StatusIcon = stateIcons[node.entry.state];
                return (
                  <button
                    dir={i18n.dir()}
                    key={node.entry.course_code}
                    type="button"
                    onClick={() =>
                      setSelected(
                        selected === node.entry.course_code
                          ? null
                          : node.entry.course_code,
                      )
                    }
                    onMouseEnter={() => setPreview(node.entry.course_code)}
                    onMouseLeave={() => setPreview(null)}
                    onFocus={() => setPreview(node.entry.course_code)}
                    onBlur={() => setPreview(null)}
                    aria-pressed={selected === node.entry.course_code}
                    aria-label={`${node.entry.course_code} ${node.entry.title ?? ''}, ${stateLabel(node.entry.state)}`}
                    title={
                      node.entry.description ??
                      `${node.entry.title ?? node.entry.course_code}. ${stateLabel(node.entry.state)}. ${node.entry.prerequisites.join(', ')}`
                    }
                    style={{
                      position: 'absolute',
                      left: isRtl ? layout.width - node.x - NODE_WIDTH : node.x,
                      top: node.y,
                      width: NODE_WIDTH,
                      minHeight: NODE_HEIGHT,
                    }}
                    className={cn(
                      'course-map-node rounded-xl border p-3 text-start transition-all hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden motion-safe:duration-200',
                      styles.box,
                      isSelected && 'course-map-selected ring-2 ring-primary',
                      isUnrelated && 'border-border bg-card',
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <StatusIcon className="size-4 shrink-0" aria-hidden />
                      <span className="bidi-code truncate text-xs font-semibold">
                        {node.entry.course_code}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-2xs leading-tight text-muted-foreground">
                      {node.entry.title ?? ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          aria-live="polite"
          className="self-start rounded-2xl border bg-card p-5"
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
              <p className="text-sm leading-relaxed text-muted-foreground">
                {selectedNode.entry.description ||
                  t(`courseMap.description.${selectedNode.entry.state}`)}
              </p>
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
                          className="bidi-code min-h-11 rounded-xl border bg-muted px-3 py-2 text-xs font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
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
              {entries.some((entry) =>
                entry.prerequisites.includes(selectedNode.entry.course_code),
              ) && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('courseMap.unlocks')}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {entries
                      .filter((entry) =>
                        entry.prerequisites.includes(
                          selectedNode.entry.course_code,
                        ),
                      )
                      .map((entry) => (
                        <li key={entry.course_code}>
                          <button
                            type="button"
                            onClick={() => setSelected(entry.course_code)}
                            className="bidi-code min-h-11 rounded-xl border bg-muted px-3 py-2 text-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {entry.course_code}
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {selectedNode.entry.state === 'locked' &&
                selectedNode.entry.prerequisites.length > 0 && (
                  <p className="rounded-md bg-warning/10 p-2 text-xs text-warning">
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
