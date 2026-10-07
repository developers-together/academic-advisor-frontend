import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { AcademicsDocument } from '@/features/admin/components/academics-document';

export default function AdminAcademicsRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout
      title={t('academics.title')}
      context={t('academics.context')}
    >
      <AcademicsDocument />
    </ContentLayout>
  );
}
