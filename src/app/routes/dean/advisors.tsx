import { useTranslation } from 'react-i18next';

import { DeanAdvisors } from '@/features/governance/components/dean-advisors';
import { GovernancePage } from '@/features/governance/components/governance-page';

export default function DeanAdvisorsRoute() {
  const { t } = useTranslation('governance');

  return (
    <GovernancePage
      audience="dean"
      title={t('advisors.title')}
      context={t('advisors.context')}
    >
      <DeanAdvisors />
    </GovernancePage>
  );
}
