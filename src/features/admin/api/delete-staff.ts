import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { invalidateStaff, removeStaffFromCache } from './staff-cache';

export const deleteStaff = (staffId: number): Promise<void> =>
  api.delete(`/admin/staff/${staffId}`);

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStaff,
    onSuccess: (_result, staffId) => {
      removeStaffFromCache(queryClient, staffId);
      invalidateStaff(queryClient);
    },
  });
};
