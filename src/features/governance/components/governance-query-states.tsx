import * as React from 'react';

import { ErrorState } from '@/components/ui/banner';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';
import type { GovernanceNode, UserRole } from '@/types/domain';

import type { useGovernanceDashboard } from '../api/get-governance-dashboard';

type GovernanceQuery = ReturnType<typeof useGovernanceDashboard>;

const GovernanceSkeleton = () => (
  <div aria-busy="true" className="space-y-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-28" />
      ))}
    </div>
    <Skeleton className="h-72 w-full" />
    <Skeleton className="h-40 w-full" />
  </div>
);

export const GovernanceQueryStates = ({
  query,
  audience,
  emptyTitle,
  emptyBody,
  skeleton,
  children,
}: {
  query: GovernanceQuery;
  audience: UserRole;
  emptyTitle: string;
  emptyBody: string;
  skeleton?: React.ReactNode;
  children: (root: GovernanceNode) => React.ReactNode;
}) => {
  if (query.isPending) {
    return <>{skeleton ?? <GovernanceSkeleton />}</>;
  }

  if (query.isError) {
    const error = query.error;
    if (error instanceof ApiError && error.status === 403) {
      return <PermissionDenied audience={audience} />;
    }
    if (error instanceof ApiError && error.status === 404) {
      return (
        <EmptyState
          compact
          title={emptyTitle}
          description={emptyBody}
          className="max-w-xl"
        />
      );
    }
    return (
      <ErrorState
        onRetry={() => void query.refetch()}
        requestId={error instanceof ApiError ? error.requestId : null}
      />
    );
  }

  return <>{children(query.data)}</>;
};
