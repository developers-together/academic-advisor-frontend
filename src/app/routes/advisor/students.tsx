import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { RequestMeetingDialog } from '@/features/advisor-meetings/components/request-meeting-dialog';
import { ExplorerDocument } from '@/features/advisor-students/components/explorer-document';
import type { StudentSummary } from '@/types/domain';

export default function AdvisorStudentsRoute() {
  const { t } = useTranslation('advisor');
  const [requestStudent, setRequestStudent] = useState<StudentSummary | null>(
    null,
  );

  return (
    <ContentLayout title={t('students.title')} context={t('students.context')}>
      <ExplorerDocument onRequestMeeting={setRequestStudent} />
      {requestStudent && (
        <RequestMeetingDialog
          student={requestStudent}
          onClose={() => setRequestStudent(null)}
        />
      )}
    </ContentLayout>
  );
}
