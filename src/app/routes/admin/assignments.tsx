import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { AssignAdvisorDialog } from '@/features/admin/components/assign-advisor-dialog';
import { AssignmentsDocument } from '@/features/admin/components/assignments-document';

export default function AdminAssignmentsRoute() {
  const { t } = useTranslation('admin');
  const [assigning, setAssigning] = useState(false);

  return (
    <ContentLayout
      title={t('assignments.title')}
      context={t('assignments.context')}
      actions={
        <Button onClick={() => setAssigning(true)}>
          {t('assignments.assign')}
        </Button>
      }
    >
      <AssignmentsDocument />
      {assigning && (
        <AssignAdvisorDialog open onClose={() => setAssigning(false)} />
      )}
    </ContentLayout>
  );
}
