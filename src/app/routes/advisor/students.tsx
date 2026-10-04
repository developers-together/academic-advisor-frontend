import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { InviteStudentDialog } from '@/features/advisor-meetings/components/invite-student-dialog';
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
        <InviteStudentDialog
          caseload={[]}
          student={requestStudent}
          onClose={() => setRequestStudent(null)}
        />
      )}
    </ContentLayout>
  );
}
