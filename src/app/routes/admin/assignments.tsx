import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdminAssignmentsRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout
      title={t('assignments.title')}
      context={t('assignments.context')}
    >
      <EmptyState
        compact
        title={t('assignments.empty.noRows')}
        description={t('assignments.empty.noRowsBody')}
        className="max-w-xl"
      />
    </ContentLayout>
  );
}
