import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { QueueDocument } from '@/features/advisor-queue/components/queue-document';

export default function AdvisorQueueRoute() {
  const { t } = useTranslation('advisor');

  return (
    <ContentLayout title={t('queue.title')} context={t('queue.context')}>
      <QueueDocument />
    </ContentLayout>
  );
}
