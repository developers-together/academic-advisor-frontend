import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { RegistrationWindowsDocument } from '@/features/admin/components/registration-windows-document';

export default function AdminRegistrationWindowsRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('windows.title')} context={t('windows.context')}>
      <RegistrationWindowsDocument />
    </ContentLayout>
  );
}
