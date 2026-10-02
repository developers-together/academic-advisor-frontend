import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { ErrorState } from '@/components/ui/banner';
import { SkeletonCard } from '@/components/ui/skeleton';
import { ProfileDocument } from '@/features/profile/components/profile-document';
import { useAcademicRecord } from '@/lib/api/academic-record';
import { ApiError } from '@/lib/api-error';
import { useUser } from '@/lib/auth';

export default function ProfileRoute() {
  const { t } = useTranslation('plan');
  const user = useUser();
  const recordQuery = useAcademicRecord();

  return (
    <ContentLayout title={t('profile.title')}>
      <div aria-busy={recordQuery.isPending} className="space-y-6">
        {recordQuery.isPending && (
          <div className="space-y-4">
            <SkeletonCard className="max-w-2xl" />
            <SkeletonCard className="max-w-xl" />
          </div>
        )}

        {recordQuery.isError && recordQuery.error instanceof ApiError && (
          <ErrorState
            onRetry={() => void recordQuery.refetch()}
            requestId={recordQuery.error.requestId}
          />
        )}

        {recordQuery.data && user.data && (
          <ProfileDocument
            user={user.data}
            record={recordQuery.data}
            onRetryRecord={() => void recordQuery.refetch()}
            isRetryingRecord={recordQuery.isFetching}
          />
        )}
      </div>
    </ContentLayout>
  );
}
