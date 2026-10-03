import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { User } from '@/types/domain';

import { applyStudentToCache, invalidateStudents } from './students-cache';

export const retryStudentSis = (studentId: number): Promise<User> =>
  unwrap<User>(api.post(`/admin/students/${studentId}/retry-sis`));

export const useRetryStudentSis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: retryStudentSis,
    onSuccess: (student) => {
      applyStudentToCache(queryClient, student);
      invalidateStudents(queryClient);
    },
  });
};
