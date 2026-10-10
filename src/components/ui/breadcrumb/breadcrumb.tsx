import { ChevronRight, Ellipsis } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { cn } from '@/utils/cn';

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(false);
  const collapsible = items.length > 3;
  const visible =
    collapsible && !expanded
      ? [items[0], { label: '…' }, ...items.slice(items.length - 2)]
      : items;

  return (
    <nav aria-label={t('breadcrumb.label')} className={cn(className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {visible.map((item, index) => {
          const isCurrent = index === visible.length - 1 && !item.to;
          const collapsed = collapsible && !expanded && index === 1;

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              {index > 0 && (
                <li aria-hidden className="flex items-center">
                  <ChevronRight className="size-3 rtl:-scale-x-100" />
                </li>
              )}
              {collapsed ? (
                <li>
                  <button
                    type="button"
                    aria-label={t('breadcrumb.expand')}
                    title={items
                      .slice(1, items.length - 2)
                      .map((entry) => entry.label)
                      .join(' / ')}
                    onClick={() => setExpanded(true)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  >
                    <Ellipsis className="size-4" aria-hidden />
                  </button>
                </li>
              ) : (
                <li>
                  {item.to && !isCurrent ? (
                    <Link
                      to={item.to}
                      className="inline-flex min-h-11 items-center rounded-lg px-1.5 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={isCurrent ? 'page' : undefined}
                      className={cn(isCurrent && 'font-medium text-foreground')}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumb.displayName = 'Breadcrumb';
