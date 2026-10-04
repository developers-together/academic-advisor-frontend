import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { AddStaffDialog } from '@/features/admin/components/add-staff-dialog';
import { StaffDocument } from '@/features/admin/components/staff-document';

export default function AdminStaffRoute() {
  const { t } = useTranslation('admin');
  const [adding, setAdding] = useState(false);

  return (
    <ContentLayout
      title={t('staff.title')}
      context={t('staff.context')}
      actions={
        <Button onClick={() => setAdding(true)}>{t('staff.addStaff')}</Button>
      }
    >
      <StaffDocument onAddStaff={() => setAdding(true)} />
      {adding && <AddStaffDialog open onClose={() => setAdding(false)} />}
    </ContentLayout>
  );
}
