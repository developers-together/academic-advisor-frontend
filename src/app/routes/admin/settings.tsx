import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { SettingsDocument } from '@/features/admin/components/settings-document';

export default function AdminSettingsRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('settings.title')} context={t('settings.context')}>
      <SettingsDocument />
    </ContentLayout>
  );
}
