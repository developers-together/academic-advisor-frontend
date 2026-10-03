import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { AssignmentsDocument } from '@/features/admin/components/assignments-document';

export default function AdminAssignmentsRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout
      title={t('assignments.title')}
      context={t('assignments.context')}
    >
      <AssignmentsDocument />
    </ContentLayout>
  );
}
