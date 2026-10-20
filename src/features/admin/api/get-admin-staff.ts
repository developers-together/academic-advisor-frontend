import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrapList } from '@/lib/api-envelope';
import type { StaffAccountRole, StaffMember } from '@/types/domain';

export type AdminStaffParams = { role?: StaffAccountRole };

export const adminStaffQueryKey = ({ role }: AdminStaffParams) =>
  ['admin', 'staff', { role }] as const;

export const getAdminStaff = ({
  role,
}: AdminStaffParams): Promise<StaffMember[]> =>
  unwrapList<StaffMember>(api.get('/admin/staff', { params: { role } }));

export const getAdminStaffQueryOptions = (params: AdminStaffParams) =>
  queryOptions({
    queryKey: adminStaffQueryKey(params),
    queryFn: () => getAdminStaff(params),
    staleTime: 5 * 60 * 1000,
  });

export const useAdminStaff = (params: AdminStaffParams) =>
  useQuery(getAdminStaffQueryOptions(params));
