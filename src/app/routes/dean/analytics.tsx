import { useTranslation } from 'react-i18next';

import { DeanAnalytics } from '@/features/governance/components/dean-analytics';
import { GovernancePage } from '@/features/governance/components/governance-page';

export default function DeanAnalyticsRoute() {
  const { t } = useTranslation('governance');

  return (
    <GovernancePage
      audience="dean"
      title={t('analytics.title')}
      context={t('analytics.context')}
    >
      <DeanAnalytics />
    </GovernancePage>
  );
}
