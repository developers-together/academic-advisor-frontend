import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { AddStudentDialog } from '@/features/admin/components/add-student-dialog';
import { StudentsDocument } from '@/features/admin/components/students-document';

export default function AdminStudentsRoute() {
  const { t } = useTranslation('admin');
  const [adding, setAdding] = useState(false);

  return (
    <ContentLayout
      title={t('accounts.title')}
      context={t('accounts.context')}
      actions={
        <Button onClick={() => setAdding(true)}>
          {t('accounts.addStudent')}
        </Button>
      }
    >
      <StudentsDocument onAddStudent={() => setAdding(true)} />
      {adding && <AddStudentDialog open onClose={() => setAdding(false)} />}
    </ContentLayout>
  );
}
