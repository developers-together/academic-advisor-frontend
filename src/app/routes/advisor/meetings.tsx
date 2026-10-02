import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdvisorMeetingsRoute() {
  const { t } = useTranslation('advisor');

  return (
    <ContentLayout title={t('meetings.title')} context={t('meetings.context')}>
      <EmptyState
        compact
        title={t('meetings.emptyOpen.title')}
        description={t('meetings.emptyOpen.body')}
        className="max-w-xl"
      />
    </ContentLayout>
  );
}
