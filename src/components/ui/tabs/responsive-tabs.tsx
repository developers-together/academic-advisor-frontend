import { Filter } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/utils/cn';

import { Tabs, TabsList, TabsTrigger } from './tabs';

export type ResponsiveTabOption = {
  value: string;
  label: string;
  count?: number;
};

export type ResponsiveTabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: ResponsiveTabOption[];
  'aria-label': string;
  className?: string;
  panelId?: string;
};

/**
 * Tabs on md+ screens; a filter button opening a bottom sheet below md
 * (design.md section 20: filters collapse into a sheet on mobile).
 */
export const ResponsiveTabs = ({
  value,
  onValueChange,
  options,
  'aria-label': ariaLabel,
  className,
  panelId,
}: ResponsiveTabsProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const isWide = !useMediaQuery('(max-width: 767.98px)');
  const active = options.find((option) => option.value === value);

  const select = (next: string) => {
    onValueChange(next);
    setOpen(false);
  };

  return (
    <div className={className}>
      {isWide && (
        <Tabs value={value} onValueChange={select}>
          <TabsList aria-label={ariaLabel}>
            {options.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                aria-controls={panelId}
                id={panelId ? `${panelId}-${option.value}` : undefined}
              >
                {option.label}{' '}
                {option.count !== undefined && (
                  <span className="text-muted-foreground tabular-nums">
                    ({option.count})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {!isWide && (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={ariaLabel}
          onClick={() => setOpen(true)}
          className="flex h-11 w-full items-center justify-between gap-2 rounded-md border bg-card px-3 text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Filter
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="truncate">
              {active?.label ?? options[0]?.label}
              {active?.count !== undefined && (
                <span className="text-muted-foreground tabular-nums">
                  {' '}
                  ({active.count})
                </span>
              )}
            </span>
          </span>
          <span className="shrink-0 text-2xs text-muted-foreground">
            {t('responsiveTabs.filter')}
          </span>
        </button>
      )}

      {!isWide && (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent side="bottom" className="rounded-t-lg p-4 pb-8">
            <DrawerTitle className="mb-2 text-start text-base font-semibold">
              {ariaLabel}
            </DrawerTitle>
            <div
              role="radiogroup"
              aria-label={ariaLabel}
              className="flex flex-col"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={option.value === value}
                  onClick={() => select(option.value)}
                  className={cn(
                    'flex h-12 w-full items-center justify-between rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
                    option.value === value &&
                      'bg-accent text-accent-foreground',
                  )}
                >
                  <span>
                    {option.label}
                    {option.count !== undefined ? ` (${option.count})` : ''}
                  </span>
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

ResponsiveTabs.displayName = 'ResponsiveTabs';
