import { useTranslation } from 'react-i18next';

import { GovernancePage } from '@/features/governance/components/governance-page';
import { VpDrilldown } from '@/features/governance/components/vp-drilldown';

export default function VpDrilldownRoute() {
  const { t } = useTranslation('governance');

  return (
    <GovernancePage
      audience="vp"
      title={t('drilldown.title')}
      context={t('drilldown.context')}
    >
      <VpDrilldown />
    </GovernancePage>
  );
}
