import * as React from 'react';

import { Head } from '@/components/seo';
import { PageHeader, type PageHeaderProps } from '@/components/ui/page-header';
import { cn } from '@/utils/cn';

export type ContentLayoutProps = {
  title: string;
  context?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: PageHeaderProps['breadcrumbs'];
  head?: boolean;
  className?: string;
  children: React.ReactNode;
};

export const ContentLayout = ({
  title,
  context,
  actions,
  breadcrumbs,
  head = true,
  className,
  children,
}: ContentLayoutProps) => {
  return (
    <div className={cn('mx-auto w-full max-w-6xl', className)}>
      {head && <Head title={title} />}
      <PageHeader
        title={title}
        description={context}
        breadcrumbs={breadcrumbs}
        actions={actions}
      />
      {children}
    </div>
  );
};
