import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdvisorHoursRoute() {
  const { t } = useTranslation('advisor');

  return (
    <ContentLayout title={t('hours.title')} context={t('hours.context')}>
      <EmptyState
        compact
        title={t('hours.empty.title')}
        description={t('hours.empty.body')}
        className="max-w-xl"
      />
    </ContentLayout>
  );
}
