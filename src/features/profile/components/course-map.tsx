import {
  BookX,
  CalendarDays,
  CircleCheck,
  CircleSlash,
  Lock,
  TriangleAlert,
  Unlock,
} from 'lucide-react';
import { useId, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import type {
  PrerequisiteMapEntry,
  PrerequisiteMapState,
} from '@/types/domain';
import { cn } from '@/utils/cn';

const stateIcons = {
  completed: CircleCheck,
  planned: CalendarDays,
  attempted: BookX,
  eligible: Unlock,
  locked: Lock,
};

const legendClasses: Record<PrerequisiteMapState, string> = {
  completed: 'border-success/30 bg-success/10 text-success',
  planned: 'border-info/30 bg-info/10 text-info',
  attempted: 'border-destructive/30 bg-destructive/10 text-destructive',
  eligible: 'border-warning/30 bg-warning/10 text-warning',
  locked: 'border-border bg-muted text-muted-foreground',
};

const cardStateClasses: Record<PrerequisiteMapState, string> = {
  completed: 'border-success/60 bg-success/10 hover:border-success',
  planned: 'border-info/60 bg-info/10 hover:border-info',
  attempted: 'border-destructive/60 bg-destructive/10 hover:border-destructive',
  eligible: 'border-warning/60 bg-warning/10 hover:border-warning',
  locked: 'border-border bg-muted hover:border-muted-foreground/40',
};

type LevelSection = {
  level: number | null;
  entries: PrerequisiteMapEntry[];
};

const sectionsOf = (entries: PrerequisiteMapEntry[]): LevelSection[] => {
  const grouped = new Map<number, PrerequisiteMapEntry[]>();
  const unknownLevel: PrerequisiteMapEntry[] = [];
  for (const entry of entries) {
    if (entry.level === null) {
      unknownLevel.push(entry);
      continue;
    }
    const list = grouped.get(entry.level);
    if (list) {
      list.push(entry);
    } else {
      grouped.set(entry.level, [entry]);
    }
  }
  const sections: LevelSection[] = [...grouped.keys()]
    .sort((a, b) => a - b)
    .map((level) => ({
      level,
      entries: (grouped.get(level) ?? []).sort((a, b) =>
        a.course_code.localeCompare(b.course_code),
      ),
    }));
  if (unknownLevel.length > 0) {
    sections.push({
      level: null,
      entries: unknownLevel.sort((a, b) =>
        a.course_code.localeCompare(b.course_code),
      ),
    });
  }
  return sections;
};

export type CourseMapProps = {
  entries: PrerequisiteMapEntry[];
  currentLevel?: number | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
};

export const CourseMap = ({
  entries,
  currentLevel = null,
  onRetry,
  isRetrying = false,
  className,
}: CourseMapProps) => {
  const { t } = useTranslation('plan');
  const idPrefix = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const sectionRefs = useRef(new Map<number, HTMLElement>());
  const didScroll = useRef(false);

  const sections = useMemo(() => sectionsOf(entries), [entries]);
  const entryByCode = useMemo(
    () => new Map(entries.map((entry) => [entry.course_code, entry])),
    [entries],
  );
  const selectedEntry = selected ? (entryByCode.get(selected) ?? null) : null;
  const recordedPrerequisites = selectedEntry
    ? selectedEntry.prerequisites.filter(
        (code) => !selectedEntry.missing_prerequisites.includes(code),
      )
    : [];

  useEffect(() => {
    if (didScroll.current) return;
    if (currentLevel === null) return;
    const section = sectionRefs.current.get(currentLevel);
    if (!section) return;
    didScroll.current = true;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    section.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [currentLevel, entries]);

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
      <p className="mb-3 text-xs text-muted-foreground tabular-nums">
        {t('courseMap.summary', {
          completed,
          total: entries.length,
        })}
      </p>

      <div
        className="mb-4 flex flex-wrap gap-2"
        aria-label={t('courseMap.title')}
      >
        {(
          ['completed', 'planned', 'attempted', 'eligible', 'locked'] as const
        ).map((state) => {
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
        })}
        <span className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          <CircleSlash className="size-4" aria-hidden />
          {t('courseMap.unavailable')}
        </span>
      </div>

      <div role="group" aria-label={t('courseMap.title')} className="space-y-6">
        {sections.map((section) => {
          const headingId = `${idPrefix}-level-${section.level ?? 'unknown'}`;
          const sectionCompleted = section.entries.filter(
            (entry) => entry.state === 'completed',
          ).length;
          return (
            <section
              key={headingId}
              aria-labelledby={headingId}
              data-level={section.level ?? 'unknown'}
              ref={(node) => {
                if (section.level === null) return;
                if (node) {
                  sectionRefs.current.set(section.level, node);
                } else {
                  sectionRefs.current.delete(section.level);
                }
              }}
              className="scroll-mt-4 rounded-2xl border p-4"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 id={headingId} className="text-sm font-semibold">
                  {section.level === null
                    ? t('courseMap.noLevel')
                    : t('courseMap.level', { level: section.level })}
                </h3>
                {section.level !== null && section.level === currentLevel && (
                  <Badge variant="info" size="sm">
                    {t('courseMap.yourLevel')}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t('courseMap.levelSummary', {
                    completed: sectionCompleted,
                    total: section.entries.length,
                  })}
                </span>
              </div>
              <ul className="grid list-none gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {section.entries.map((entry) => {
                  const StatusIcon = stateIcons[entry.state];
                  const isSelected = selected === entry.course_code;
                  return (
                    <li key={entry.course_code}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelected(
                            selected === entry.course_code
                              ? null
                              : entry.course_code,
                          )
                        }
                        aria-pressed={isSelected}
                        aria-label={`${entry.course_code} ${entry.title ?? ''}, ${stateLabel(entry.state)}`}
                        className={cn(
                          'flex min-h-11 w-full flex-col gap-1 rounded-xl border p-3 text-start transition-all hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden motion-safe:duration-200',
                          cardStateClasses[entry.state],
                          isSelected && 'ring-2 ring-primary',
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <StatusIcon className="size-4 shrink-0" aria-hidden />
                          <span className="bidi-code text-xs font-semibold">
                            {entry.course_code}
                          </span>
                        </span>
                        {entry.title && (
                          <span className="line-clamp-2 block text-2xs leading-tight text-muted-foreground">
                            {entry.title}
                          </span>
                        )}
                        <span className="text-2xs font-medium">
                          {stateLabel(entry.state)}
                        </span>
                        {!entry.is_available && (
                          <span className="flex items-start gap-1 text-2xs font-medium text-muted-foreground">
                            <CircleSlash
                              className="mt-0.5 size-3 shrink-0"
                              aria-hidden
                            />
                            {entry.availability_reasons.join(' ')}
                          </span>
                        )}
                        {entry.warnings.map((warning) => (
                          <span
                            key={warning}
                            className="flex items-start gap-1 text-2xs font-medium text-warning"
                          >
                            <TriangleAlert
                              className="mt-0.5 size-3 shrink-0"
                              aria-hidden
                            />
                            {warning}
                          </span>
                        ))}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <div
        role="group"
        aria-label={t('courseMap.detailsPanel')}
        aria-live="polite"
        className="mt-4 rounded-2xl border bg-card p-5"
      >
        {selectedEntry ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bidi-code text-sm font-semibold">
                {selectedEntry.course_code}
              </span>
              <Badge variant="neutral">{stateLabel(selectedEntry.state)}</Badge>
            </div>
            {selectedEntry.title && (
              <p className="text-sm text-muted-foreground">
                {selectedEntry.title}
              </p>
            )}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {selectedEntry.description ||
                t(`courseMap.description.${selectedEntry.state}`)}
            </p>
            <div>
              <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                {t('courseMap.details.availability')}
              </p>
              {selectedEntry.is_available ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('courseMap.available')}
                </p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {selectedEntry.availability_reasons.map((reason) => (
                    <li
                      key={reason}
                      className="flex items-start gap-1 text-sm text-muted-foreground"
                    >
                      <CircleSlash
                        className="mt-1 size-3 shrink-0"
                        aria-hidden
                      />
                      {reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedEntry.warnings.length > 0 && (
              <div>
                <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t('courseMap.details.warnings')}
                </p>
                <ul className="mt-1 space-y-1">
                  {selectedEntry.warnings.map((warning) => (
                    <li
                      key={warning}
                      className="flex items-start gap-1 text-sm text-warning"
                    >
                      <TriangleAlert
                        className="mt-1 size-3 shrink-0"
                        aria-hidden
                      />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedEntry.prerequisites.length > 0 ? (
              <div className="space-y-3">
                {recordedPrerequisites.length > 0 && (
                  <div>
                    <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                      {t('courseMap.details.recorded')}
                    </p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {recordedPrerequisites.map((prerequisite) => (
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
                )}
                {selectedEntry.missing_prerequisites.length > 0 && (
                  <div>
                    <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                      {t('courseMap.details.missing')}
                    </p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {selectedEntry.missing_prerequisites.map(
                        (prerequisite) => (
                          <li key={prerequisite}>
                            <button
                              type="button"
                              onClick={() => setSelected(prerequisite)}
                              className="bidi-code min-h-11 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:border-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                            >
                              {prerequisite}
                            </button>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('courseMap.noRequirements')}
              </p>
            )}
            {entries.some((entry) =>
              entry.prerequisites.includes(selectedEntry.course_code),
            ) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t('courseMap.unlocks')}
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {entries
                    .filter((entry) =>
                      entry.prerequisites.includes(selectedEntry.course_code),
                    )
                    .map((entry) => (
                      <li key={entry.course_code}>
                        <button
                          type="button"
                          onClick={() => setSelected(entry.course_code)}
                          className="bidi-code min-h-11 rounded-xl border bg-muted px-3 py-2 text-xs font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                        >
                          {entry.course_code}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('courseMap.pickHint')}
          </p>
        )}
      </div>

      <ul aria-label={t('courseMap.title')} className="sr-only">
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
