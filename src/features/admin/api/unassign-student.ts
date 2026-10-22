import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { User } from '@/types/domain';

import { adminStudentQueryKey } from './get-admin-student';
import { applyStudentToCache, invalidateStudents } from './students-cache';

export const useUnassignStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number): Promise<User> =>
      unwrap<User>(api.delete(`/admin/assignments/${id}`)),
    onSuccess: (student) => {
      applyStudentToCache(queryClient, student);
      queryClient.setQueryData(adminStudentQueryKey(student.id), student);
      invalidateStudents(queryClient);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
  });
};
