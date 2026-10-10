import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import { Head } from '@/components/seo';
import { PageHeader, type PageHeaderProps } from '@/components/ui/page-header';
import { breadcrumbTrail } from '@/config/routes';
import { cn } from '@/utils/cn';

export type ContentWidth = 'reading' | 'workflow' | 'data';

const widthClass: Record<ContentWidth, string> = {
  reading: 'max-w-reading',
  workflow: 'max-w-workflow',
  data: 'max-w-data',
};

export type ContentLayoutProps = {
  title: string;
  context?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: PageHeaderProps['breadcrumbs'];
  width?: ContentWidth;
  head?: boolean;
  header?: boolean;
  className?: string;
  children: React.ReactNode;
};

export const ContentLayout = ({
  title,
  context,
  actions,
  breadcrumbs,
  width = 'data',
  head = true,
  header = true,
  className,
  children,
}: ContentLayoutProps) => {
  const { t } = useTranslation();
  const location = useLocation();

  const derived = React.useMemo(() => {
    const trail = breadcrumbTrail(location.pathname);
    if (trail.length === 0) return undefined;
    return trail.map((entry) => ({
      label: t(entry.labelKey),
      to: entry.to,
    }));
  }, [location.pathname, t]);

  const items = breadcrumbs ?? derived;

  return (
    <div className={cn('mx-auto w-full', widthClass[width], className)}>
      {head && <Head title={title} />}
      {header ? (
        <PageHeader
          title={title}
          description={context}
          breadcrumbs={items}
          actions={actions}
        />
      ) : (
        <h1 className="sr-only">{title}</h1>
      )}
      {children}
    </div>
  );
};
