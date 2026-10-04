import { useTranslation } from 'react-i18next';

import { GovernancePage } from '@/features/governance/components/governance-page';
import { VpTrends } from '@/features/governance/components/vp-trends';

export default function VpTrendsRoute() {
  const { t } = useTranslation('governance');

  return (
    <GovernancePage
      audience="vp"
      title={t('trends.vp.pageTitle')}
      context={t('trends.vp.pageContext')}
    >
      <VpTrends />
    </GovernancePage>
  );
}
