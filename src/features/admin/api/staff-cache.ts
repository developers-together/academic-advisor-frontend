import type { QueryClient } from '@tanstack/react-query';

import type { StaffAccountRole, StaffMember, User } from '@/types/domain';

const STAFF_ROOT = ['admin', 'staff'] as const;

const toStaffList = (rows: StaffMember[] | undefined): StaffMember[] =>
  Array.isArray(rows) ? rows : [];

const staffAccountRole = (role: User['role']): StaffAccountRole =>
  role === null || role === 'student' ? 'awaiting_role' : role;

const asStaffMember = (user: User, studentsCount = 0): StaffMember => ({
  ...user,
  role: staffAccountRole(user.role),
  students_count: studentsCount,
});

export const applyStaffToCache = (queryClient: QueryClient, user: User) => {
  queryClient.setQueriesData<StaffMember[]>({ queryKey: STAFF_ROOT }, (rows) =>
    toStaffList(rows).map((row) =>
      row.id === user.id ? { ...row, ...asStaffMember(user) } : row,
    ),
  );
};

export const prependStaffToCache = (queryClient: QueryClient, user: User) => {
  queryClient.setQueriesData<StaffMember[]>(
    { queryKey: STAFF_ROOT },
    (rows) => [
      asStaffMember(user),
      ...toStaffList(rows).filter((row) => row.id !== user.id),
    ],
  );
};

export const removeStaffFromCache = (
  queryClient: QueryClient,
  staffId: number,
) => {
  queryClient.setQueriesData<StaffMember[]>({ queryKey: STAFF_ROOT }, (rows) =>
    toStaffList(rows).filter((row) => row.id !== staffId),
  );
};

export const invalidateStaff = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: STAFF_ROOT });
};
