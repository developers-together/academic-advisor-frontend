import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { ProgramsDocument } from '@/features/admin/components/programs-document';

export default function AdminProgramsRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('programs.title')} context={t('programs.context')}>
      <ProgramsDocument />
    </ContentLayout>
  );
}
