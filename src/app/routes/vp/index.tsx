import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { EmptyState } from '@/components/ui/empty-state';

export default function VpScorecardRoute() {
  const { t } = useTranslation('governance');

  return (
    <ContentLayout title={t('vp.title')} context={t('vp.context')}>
      <EmptyState
        compact
        title={t('vp.empty.title')}
        description={t('vp.empty.body')}
        className="max-w-xl"
      />
    </ContentLayout>
  );
}
