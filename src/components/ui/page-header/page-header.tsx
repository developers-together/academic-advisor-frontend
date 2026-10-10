import * as React from 'react';

import { cn } from '@/utils/cn';

import { Breadcrumb, type BreadcrumbItem } from '../breadcrumb';

export type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export const PageHeader = ({
  title,
  description,
  breadcrumbs,
  primaryAction,
  actions,
  className,
}: PageHeaderProps) => {
  const parentBreadcrumbs = breadcrumbs?.filter(
    (item, index) => index !== breadcrumbs.length - 1 || item.label !== title,
  );
  return (
    <div
      className={cn(
        'mb-8 flex flex-wrap items-start justify-between gap-4',
        className,
      )}
    >
      <div className="min-w-0">
        {parentBreadcrumbs && parentBreadcrumbs.length > 0 && (
          <Breadcrumb items={parentBreadcrumbs} className="mb-2" />
        )}
        <h1 className="text-2xl leading-tight font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {(primaryAction || actions) && (
        <div className="flex max-w-full flex-wrap items-center gap-2">
          {primaryAction}
          {actions}
        </div>
      )}
    </div>
  );
};

PageHeader.displayName = 'PageHeader';
