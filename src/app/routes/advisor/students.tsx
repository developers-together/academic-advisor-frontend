import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdvisorStudentsRoute() {
  const { t } = useTranslation('advisor');

  return (
    <ContentLayout title={t('students.title')} context={t('students.context')}>
      <EmptyState
        compact
        title={t('students.emptyCaseload.title')}
        description={t('students.emptyCaseload.body')}
        className="max-w-xl"
      />
    </ContentLayout>
  );
}
