import * as React from 'react';

import { Head } from '@/components/seo';
import { cn } from '@/utils/cn';

export type ContentLayoutProps = {
  title: string;
  context?: React.ReactNode;
  actions?: React.ReactNode;
  head?: boolean;
  className?: string;
  children: React.ReactNode;
};

export const ContentLayout = ({
  title,
  context,
  actions,
  head = true,
  className,
  children,
}: ContentLayoutProps) => {
  return (
    <div className={cn('mx-auto w-full max-w-6xl', className)}>
      {head && <Head title={title} />}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl leading-tight font-semibold">{title}</h1>
          {context && (
            <p className="mt-1 text-sm text-muted-foreground">{context}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </div>
  );
};
