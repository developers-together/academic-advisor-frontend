import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { MeetingsDocument } from '@/features/advisor-meetings/components/meetings-document';

export default function AdvisorMeetingsRoute() {
  const { t } = useTranslation('advisor');

  return (
    <ContentLayout title={t('meetings.title')} context={t('meetings.context')}>
      <MeetingsDocument />
    </ContentLayout>
  );
}
