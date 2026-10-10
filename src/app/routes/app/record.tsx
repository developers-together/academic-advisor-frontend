import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { ErrorState } from '@/components/ui/banner';
import { SkeletonCard } from '@/components/ui/skeleton';
import { usePlan } from '@/features/plan/api/get-plan';
import { RecordDocument } from '@/features/profile/components/record-document';
import { useAcademicRecord } from '@/lib/api/academic-record';
import { ApiError } from '@/lib/api-error';

export default function RecordRoute() {
  const { t } = useTranslation('plan');
  const recordQuery = useAcademicRecord();
  const planQuery = usePlan();
  const plan = planQuery.isError ? undefined : planQuery.data;
  const activePlan =
    plan &&
    ['draft', 'returned', 'submitted', 'under_review', 'approved'].includes(
      plan.status,
    )
      ? plan
      : undefined;

  return (
    <ContentLayout title={t('record.title')} context={t('record.context')}>
      <div aria-busy={recordQuery.isPending} className="space-y-6">
        {recordQuery.isPending && (
          <div className="space-y-4">
            <SkeletonCard className="max-w-2xl" />
            <SkeletonCard className="max-w-xl" />
          </div>
        )}

        {recordQuery.isError && (
          <ErrorState
            onRetry={() => void recordQuery.refetch()}
            pending={recordQuery.isFetching}
            requestId={
              recordQuery.error instanceof ApiError
                ? recordQuery.error.requestId
                : null
            }
          />
        )}

        {recordQuery.data && !recordQuery.isError && (
          <RecordDocument
            record={recordQuery.data}
            plannedCourseCodes={activePlan?.courses.map(
              (course) => course.course_code,
            )}
            onRetryRecord={() => void recordQuery.refetch()}
            isRetryingRecord={recordQuery.isFetching}
          />
        )}
      </div>
    </ContentLayout>
  );
}
