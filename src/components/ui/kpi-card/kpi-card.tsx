import * as React from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';

export type KpiCardProps = {
  label: string;
  value: React.ReactNode;
  context?: React.ReactNode;
  className?: string;
};

export const KpiCard = ({ label, value, context, className }: KpiCardProps) => {
  return (
    <Card className={cn('p-4 lg:p-6', className)}>
      <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl leading-tight font-bold wrap-break-word tabular-nums">
        {value}
      </p>
      {context && (
        <p className="mt-2 text-sm text-muted-foreground">{context}</p>
      )}
    </Card>
  );
};
