import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { EmptyState } from '@/components/ui/empty-state';

export default function DeanOverviewRoute() {
  const { t } = useTranslation('governance');

  return (
    <ContentLayout title={t('dean.title')} context={t('dean.context')}>
      <EmptyState
        compact
        title={t('dean.empty.title')}
        description={t('dean.empty.body')}
        className="max-w-xl"
      />
    </ContentLayout>
  );
}
