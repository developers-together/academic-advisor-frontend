import type { QueryClient } from '@tanstack/react-query';

import type { StaffMember, StaffRole, User } from '@/types/domain';

const STAFF_ROOT = ['admin', 'staff'] as const;

const toStaffList = (rows: StaffMember[] | undefined): StaffMember[] =>
  Array.isArray(rows) ? rows : [];

const asStaffMember = (user: User, studentsCount = 0): StaffMember => ({
  ...user,
  role: user.role as StaffRole,
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
