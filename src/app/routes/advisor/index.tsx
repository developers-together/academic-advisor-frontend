import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { QueueDocument } from '@/features/advisor-queue/components/queue-document';
import { useCaseload } from '@/features/advisor-students/api/get-caseload';

export default function AdvisorQueueRoute() {
  const { t } = useTranslation('advisor');
  const caseloadQuery = useCaseload();

  return (
    <ContentLayout title={t('queue.title')} context={t('queue.context')}>
      <QueueDocument caseload={caseloadQuery.data ?? []} />
    </ContentLayout>
  );
}
