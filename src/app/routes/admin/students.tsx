import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { StudentsDocument } from '@/features/admin/components/students-document';

export default function AdminStudentsRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('accounts.title')} context={t('accounts.context')}>
      <StudentsDocument />
    </ContentLayout>
  );
}
