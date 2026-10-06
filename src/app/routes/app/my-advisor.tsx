import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyMeetingRequests } from '@/features/my-advisor/api/get-my-meeting-requests';
import { MyMeetings } from '@/features/my-advisor/components/my-meetings';
import { AdvisorCard } from '@/features/profile/components/advisor-card';

export default function MyAdvisorRoute() {
  const { t } = useTranslation('plan');
  const meetingsQuery = useMyMeetingRequests();

  return (
    <ContentLayout
      title={t('myAdvisor.title')}
      context={t('myAdvisor.context')}
    >
      <div className="space-y-6">
        <AdvisorCard />

        <Card>
          <CardHeader>
            <CardTitle>{t('myAdvisor.meetingsTitle')}</CardTitle>
          </CardHeader>
          <CardBody>
            <MyMeetings
              meetings={meetingsQuery.data}
              isPending={meetingsQuery.isPending}
              isError={meetingsQuery.isError}
              onRetry={() => void meetingsQuery.refetch()}
            />
          </CardBody>
        </Card>
      </div>
    </ContentLayout>
  );
}
