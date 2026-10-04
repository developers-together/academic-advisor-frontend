import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { CoursesDocument } from '@/features/admin/components/courses-document';

export default function AdminCoursesRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('courses.title')} context={t('courses.context')}>
      <CoursesDocument />
    </ContentLayout>
  );
}
