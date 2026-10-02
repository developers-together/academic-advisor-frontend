import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdminSettingsRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('settings.title')} context={t('settings.context')}>
      <EmptyState
        compact
        title={t('settings.empty.title')}
        description={t('settings.empty.body')}
        className="max-w-xl"
      />
    </ContentLayout>
  );
}
