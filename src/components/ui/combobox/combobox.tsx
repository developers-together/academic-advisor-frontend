import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Search } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/utils/cn';

export type ComboboxOption = {
  value: string;
  label: string;
  hint?: React.ReactNode;
};

export type ComboboxProps = {
  options: ComboboxOption[];
  placeholder: string;
  ariaLabel: string;
  emptyMessage: (query: string) => string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

type ListboxProps = {
  id: string;
  options: ComboboxOption[];
  activeIndex: number;
  query: string;
  emptyMessage: (query: string) => string;
  onHoverOption: (index: number) => void;
  onSelect: (option: ComboboxOption) => void;
};

const ComboboxListbox = ({
  id,
  options,
  activeIndex,
  query,
  emptyMessage,
  onHoverOption,
  onSelect,
}: ListboxProps) => {
  if (options.length === 0) {
    return (
      <div role="status" className="px-3 py-2.5 text-sm text-muted-foreground">
        {emptyMessage(query)}
      </div>
    );
  }

  return (
    <div id={id} role="listbox">
      {options.map((option, index) => (
        <div
          key={option.value}
          id={`${id}-option-${index}`}
          role="option"
          aria-selected={index === activeIndex}
          tabIndex={-1}
          className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 text-sm outline-none data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
          data-active={index === activeIndex}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(option)}
          onMouseMove={() => onHoverOption(index)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect(option);
            }
          }}
        >
          <span className="truncate">{option.label}</span>
          {option.hint && (
            <span className="shrink-0 text-2xs text-muted-foreground">
              {option.hint}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export const Combobox = ({
  options,
  placeholder,
  ariaLabel,
  emptyMessage,
  onSelect,
  disabled = false,
  className,
}: ComboboxProps) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listboxId = React.useId();

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(needle),
    );
  }, [options, query]);

  const clampedIndex = Math.min(activeIndex, Math.max(filtered.length - 1, 0));

  const selectOption = (option: ComboboxOption) => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
    onSelect(option.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(Math.min(clampedIndex + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(Math.max(clampedIndex - 1, 0));
    } else if (event.key === 'Enter' && open) {
      const option = filtered[clampedIndex];
      if (option) {
        event.preventDefault();
        selectOption(option);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <div className={cn('relative', className)}>
        <PopoverPrimitive.Anchor>
          <span className="relative block">
            <Search
              className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="text"
              role="combobox"
              aria-label={ariaLabel}
              aria-expanded={open}
              aria-controls={open ? listboxId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={
                open && filtered[clampedIndex]
                  ? `${listboxId}-option-${clampedIndex}`
                  : undefined
              }
              placeholder={placeholder}
              disabled={disabled}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={handleKeyDown}
              className="h-11 w-full rounded-md border border-input bg-transparent ps-9 pe-3 text-base placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            />
          </span>
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(event) => event.preventDefault()}
            className="z-30 max-h-72 w-(--radix-popover-trigger-width) min-w-64 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-sm"
            onMouseDown={(event) => event.preventDefault()}
          >
            <ComboboxListbox
              id={listboxId}
              options={filtered}
              activeIndex={clampedIndex}
              query={query}
              emptyMessage={emptyMessage}
              onHoverOption={setActiveIndex}
              onSelect={selectOption}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </div>
    </PopoverPrimitive.Root>
  );
};

Combobox.displayName = 'Combobox';
