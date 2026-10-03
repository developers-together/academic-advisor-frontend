import { useTranslation } from 'react-i18next';

import { GovernancePage } from '@/features/governance/components/governance-page';
import { VpScorecard } from '@/features/governance/components/vp-scorecard';

export default function VpScorecardRoute() {
  const { t } = useTranslation('governance');

  return (
    <GovernancePage
      audience="vp"
      title={t('vp.title')}
      context={t('vp.context')}
    >
      <VpScorecard />
    </GovernancePage>
  );
}
