import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { User } from '@/types/domain';

import { applyStudentToCache, invalidateStudents } from './students-cache';

export const reactivateStudent = (studentId: number): Promise<User> =>
  unwrap<User>(api.post(`/admin/students/${studentId}/reactivate`));

export const useReactivateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateStudent,
    onSuccess: (student) => {
      applyStudentToCache(queryClient, student);
      invalidateStudents(queryClient);
    },
  });
};
