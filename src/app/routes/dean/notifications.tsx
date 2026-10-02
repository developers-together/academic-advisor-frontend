import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { EmptyState } from '@/components/ui/empty-state';

export default function DeanNotificationsRoute() {
  const { t } = useTranslation('notifications');

  return (
    <ContentLayout title={t('title')}>
      <EmptyState
        compact
        title={t('empty.title')}
        description={t('empty.body')}
        className="max-w-xl"
      />
    </ContentLayout>
  );
}
