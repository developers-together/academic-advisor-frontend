import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddStaffDialog } from '@/features/admin/components/add-staff-dialog';
import { AddStudentDialog } from '@/features/admin/components/add-student-dialog';
import { StaffDocument } from '@/features/admin/components/staff-document';
import { StudentsDocument } from '@/features/admin/components/students-document';

export default function AdminUsersRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('users.title')} context={t('users.context')}>
      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">{t('users.tabs.students')}</TabsTrigger>
          <TabsTrigger value="staff">{t('users.tabs.staff')}</TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          <StudentsTab />
        </TabsContent>
        <TabsContent value="staff">
          <StaffTab />
        </TabsContent>
      </Tabs>
    </ContentLayout>
  );
}

const StudentsTab = () => {
  const { t } = useTranslation('admin');
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setAdding(true)}>
          {t('accounts.addStudent')}
        </Button>
      </div>
      <StudentsDocument onAddStudent={() => setAdding(true)} />
      {adding && <AddStudentDialog open onClose={() => setAdding(false)} />}
    </div>
  );
};

const StaffTab = () => {
  const { t } = useTranslation('admin');
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setAdding(true)}>{t('staff.addStaff')}</Button>
      </div>
      <StaffDocument onAddStaff={() => setAdding(true)} />
      {adding && <AddStaffDialog open onClose={() => setAdding(false)} />}
    </div>
  );
};
