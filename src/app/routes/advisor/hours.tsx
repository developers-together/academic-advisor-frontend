import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { HoursDocument } from '@/features/advisor-hours/components/hours-document';

export default function AdvisorHoursRoute() {
  const { t } = useTranslation('advisor');

  return (
    <ContentLayout title={t('hours.title')} context={t('hours.context')}>
      <HoursDocument />
    </ContentLayout>
  );
}
