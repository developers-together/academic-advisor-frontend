import { useTranslation } from 'react-i18next';

import { DeanOverview } from '@/features/governance/components/dean-overview';
import { GovernancePage } from '@/features/governance/components/governance-page';

export default function DeanOverviewRoute() {
  const { t } = useTranslation('governance');

  return (
    <GovernancePage
      audience="dean"
      title={t('dean.title')}
      context={t('dean.context')}
    >
      <DeanOverview />
    </GovernancePage>
  );
}
