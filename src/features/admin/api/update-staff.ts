import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { StaffRole, User } from '@/types/domain';

import { applyStaffToCache, invalidateStaff } from './staff-cache';

export type UpdateStaffInput = {
  name: string;
  role: StaffRole;
  faculty?: string;
};

export const updateStaff = ({
  staffId,
  input,
}: {
  staffId: number;
  input: UpdateStaffInput;
}): Promise<User> => unwrap<User>(api.patch(`/admin/staff/${staffId}`, input));

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStaff,
    onSuccess: (staff) => {
      applyStaffToCache(queryClient, staff);
      invalidateStaff(queryClient);
    },
  });
};
