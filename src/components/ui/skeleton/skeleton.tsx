import * as React from 'react';

import { cn } from '@/utils/cn';

const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
};
Skeleton.displayName = 'Skeleton';

const SkeletonText = ({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) => {
  return (
    <div className={cn('space-y-2', className)} aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
};

const SkeletonCard = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'space-y-4 rounded-lg border bg-card p-4 lg:p-6',
        className,
      )}
      aria-hidden
    >
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-40" />
    </div>
  );
};

export { Skeleton, SkeletonText, SkeletonCard };
