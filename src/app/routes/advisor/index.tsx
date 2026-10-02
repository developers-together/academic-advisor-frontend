import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdvisorQueueRoute() {
  const { t } = useTranslation('advisor');

  return (
    <ContentLayout title={t('queue.title')} context={t('queue.context')}>
      <EmptyState
        compact
        title={t('queue.empty.title')}
        description={t('queue.empty.body')}
        className="max-w-xl"
      />
    </ContentLayout>
  );
}
