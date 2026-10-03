import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { User } from '@/types/domain';

import { applyStudentToCache, invalidateStudents } from './students-cache';

export const suspendStudent = (studentId: number): Promise<User> =>
  unwrap<User>(api.post(`/admin/students/${studentId}/suspend`));

export const useSuspendStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: suspendStudent,
    onSuccess: (student) => {
      applyStudentToCache(queryClient, student);
      invalidateStudents(queryClient);
    },
  });
};
