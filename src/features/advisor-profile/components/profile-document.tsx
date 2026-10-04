import { ErrorState } from '@/components/ui/banner';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';

import { useOfficeLocation } from '../api/get-office-location';

import { OfficeLocationForm } from './office-location-form';

export const AdvisorProfileDocument = () => {
  const officeLocationQuery = useOfficeLocation();

  if (officeLocationQuery.isPending) {
    return (
      <div aria-busy="true" className="max-w-xl space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (officeLocationQuery.isError) {
    if (
      officeLocationQuery.error instanceof ApiError &&
      officeLocationQuery.error.status === 403
    ) {
      return <PermissionDenied audience="advisor" />;
    }
    return (
      <ErrorState
        onRetry={() => void officeLocationQuery.refetch()}
        requestId={
          officeLocationQuery.error instanceof ApiError
            ? officeLocationQuery.error.requestId
            : null
        }
      />
    );
  }

  return (
    <div className="max-w-xl">
      <OfficeLocationForm
        officeLocation={officeLocationQuery.data.office_location}
      />
    </div>
  );
};
