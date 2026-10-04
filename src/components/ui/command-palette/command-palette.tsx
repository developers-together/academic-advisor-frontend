import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Search } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/cn';

export type CommandEntry = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  meta?: string;
  onSelect: () => void;
};

export type CommandGroup = {
  headingKey: string;
  entries: CommandEntry[];
};

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
};

export const CommandPalette = ({
  open,
  onOpenChange,
  groups,
}: CommandPaletteProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  const visibleGroups = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        entries: group.entries.filter((entry) =>
          `${entry.label} ${entry.meta ?? ''}`.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.entries.length > 0);
  }, [groups, query]);

  const indexed = React.useMemo(() => {
    const rows: Array<{
      group: (typeof visibleGroups)[number];
      entry: CommandEntry;
      index: number;
    }> = [];
    let running = 0;
    for (const group of visibleGroups) {
      for (const entry of group.entries) {
        rows.push({ group, entry, index: running });
        running += 1;
      }
    }
    return rows;
  }, [visibleGroups]);

  const flat = React.useMemo(() => indexed.map((row) => row.entry), [indexed]);

  React.useEffect(() => {
    const node = listRef.current?.querySelector('[data-active="true"]');
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const closeAndReset = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setQuery('');
      setActiveIndex(0);
    }
  };

  const select = (entry: CommandEntry) => {
    closeAndReset(false);
    entry.onSelect();
  };

  const activeIndexSafe = Math.min(activeIndex, Math.max(flat.length - 1, 0));

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (flat.length ? (index + 1) % flat.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) =>
        flat.length ? (index - 1 + flat.length) % flat.length : 0,
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const entry = flat[activeIndexSafe];
      if (entry) select(entry);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={closeAndReset}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          aria-label={t('commandPalette.label')}
          className="fixed inset-s-1/2 top-[16%] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border bg-card shadow-lg data-[state=open]:animate-fade-in rtl:translate-x-1/2"
          onKeyDown={onKeyDown}
        >
          <DialogPrimitive.Title className="sr-only">
            {t('commandPalette.label')}
          </DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b px-3">
            <Search
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <input
              role="combobox"
              aria-expanded={flat.length > 0}
              aria-controls="command-palette-list"
              aria-activedescendant={
                flat[activeIndexSafe]
                  ? `command-entry-${activeIndexSafe}`
                  : undefined
              }
              aria-label={t('commandPalette.placeholder')}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              placeholder={t('commandPalette.placeholder')}
              autoComplete="off"
              spellCheck={false}
              className="h-12 w-full bg-transparent text-base outline-hidden placeholder:text-muted-foreground"
            />
          </div>

          <div
            ref={listRef}
            id="command-palette-list"
            role="listbox"
            aria-label={t('commandPalette.label')}
            className="max-h-80 overflow-y-auto p-2"
          >
            {visibleGroups.map((group) => (
              <div key={group.headingKey} className="mb-1 last:mb-0">
                <p className="px-2 pt-2 pb-1 text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t(group.headingKey)}
                </p>
                {indexed
                  .filter((row) => row.group === group)
                  .map(({ entry, index }) => {
                    const active = index === activeIndexSafe;
                    const Icon = entry.icon;
                    return (
                      <div
                        key={entry.id}
                        id={`command-entry-${index}`}
                        role="option"
                        aria-selected={active}
                        data-active={active}
                        tabIndex={-1}
                        onMouseMove={() => setActiveIndex(index)}
                        onClick={() => select(entry)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            select(entry);
                          }
                        }}
                        className={cn(
                          'flex h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-sm',
                          active
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span className="truncate font-medium text-foreground">
                          {entry.label}
                        </span>
                        {entry.meta && (
                          <span className="ms-auto shrink-0 text-xs text-muted-foreground">
                            {entry.meta}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            ))}
            {flat.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {t('commandPalette.noResults', { query })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 border-t px-3 py-2 text-2xs text-muted-foreground">
            <span>{t('commandPalette.hints.navigate')} ↑↓</span>
            <span>{t('commandPalette.hints.select')} ↵</span>
            <span>{t('commandPalette.hints.dismiss')} esc</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

CommandPalette.displayName = 'CommandPalette';
