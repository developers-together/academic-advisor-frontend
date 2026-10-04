import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { ErrorState } from '@/components/ui/banner';
import { SkeletonCard } from '@/components/ui/skeleton';
import { RecordDocument } from '@/features/profile/components/record-document';
import { useAcademicRecord } from '@/lib/api/academic-record';
import { ApiError } from '@/lib/api-error';

export default function RecordRoute() {
  const { t } = useTranslation('plan');
  const recordQuery = useAcademicRecord();

  return (
    <ContentLayout title={t('record.title')} context={t('record.context')}>
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

        {recordQuery.data && (
          <RecordDocument
            record={recordQuery.data}
            onRetryRecord={() => void recordQuery.refetch()}
            isRetryingRecord={recordQuery.isFetching}
          />
        )}
      </div>
    </ContentLayout>
  );
}
