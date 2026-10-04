import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { AdvisorProfileDocument } from '@/features/advisor-profile/components/profile-document';

export default function AdvisorProfileRoute() {
  const { t } = useTranslation('advisor');

  return (
    <ContentLayout title={t('profile.title')} context={t('profile.context')}>
      <AdvisorProfileDocument />
    </ContentLayout>
  );
}
