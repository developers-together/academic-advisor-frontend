import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { AdminOverviewDocument } from '@/features/admin/components/overview-document';

export default function AdminIndexRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('overview.title')} context={t('overview.context')}>
      <AdminOverviewDocument />
    </ContentLayout>
  );
}
