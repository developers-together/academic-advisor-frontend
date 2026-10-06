import * as React from 'react';

import { ErrorState } from '@/components/ui/banner';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied, useRole } from '@/lib/authorization';

export type AsyncSurfaceQuery = {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
};

export type AsyncSurfaceProps = {
  query: AsyncSurfaceQuery;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

const defaultSkeleton = (
  <div className="space-y-3">
    <Skeleton className="h-10 w-72" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
);

export const AsyncSurface = ({
  query,
  skeleton,
  children,
  className,
}: AsyncSurfaceProps) => {
  const role = useRole();

  if (query.isPending) {
    return (
      <div role="status" aria-busy="true" className={className}>
        {skeleton ?? defaultSkeleton}
      </div>
    );
  }

  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 403) {
      return <PermissionDenied audience={role ?? 'student'} />;
    }
    return (
      <ErrorState
        onRetry={() => void query.refetch()}
        requestId={
          query.error instanceof ApiError ? query.error.requestId : null
        }
      />
    );
  }

  if (className === undefined) {
    return <>{children}</>;
  }

  return <div className={className}>{children}</div>;
};

AsyncSurface.displayName = 'AsyncSurface';
