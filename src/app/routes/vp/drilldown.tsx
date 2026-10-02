import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { EmptyState } from '@/components/ui/empty-state';

export default function VpDrilldownRoute() {
  const { t } = useTranslation('governance');

  return (
    <ContentLayout
      title={t('drilldown.title')}
      context={t('drilldown.context')}
    >
      <EmptyState
        compact
        title={t('drilldown.empty.title')}
        description={t('drilldown.empty.body')}
        className="max-w-xl"
      />
    </ContentLayout>
  );
}
