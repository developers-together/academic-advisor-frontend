import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminUsersParams } from '@/config/paths';
import { AddStaffDialog } from '@/features/admin/components/add-staff-dialog';
import { AddStudentDialog } from '@/features/admin/components/add-student-dialog';
import { StaffDocument } from '@/features/admin/components/staff-document';
import { StudentsDocument } from '@/features/admin/components/students-document';

type UsersTab = 'students' | 'staff';

export default function AdminUsersRoute() {
  const { t } = useTranslation('admin');
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedRole = searchParams.get(adminUsersParams.role);
  const tab: UsersTab =
    searchParams.get(adminUsersParams.tab) === 'staff' || requestedRole
      ? 'staff'
      : 'students';
  const selectTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'staff') {
      next.set(adminUsersParams.tab, 'staff');
    } else {
      next.delete(adminUsersParams.tab);
      next.delete(adminUsersParams.role);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <ContentLayout title={t('users.title')} context={t('users.context')}>
      <Tabs value={tab} onValueChange={selectTab}>
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
