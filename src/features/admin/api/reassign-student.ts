import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { User } from '@/types/domain';

import { applyStudentToCache, invalidateStudents } from './students-cache';

export const reassignStudent = ({
  studentId,
  advisor_email,
}: {
  studentId: number;
  advisor_email: string;
}): Promise<User> =>
  unwrap<User>(
    api.post(`/admin/assignments/${studentId}/reassign`, { advisor_email }),
  );

export const useReassignStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reassignStudent,
    onSuccess: (student) => {
      applyStudentToCache(queryClient, student);
      invalidateStudents(queryClient);
    },
  });
};
