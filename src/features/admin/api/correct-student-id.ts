import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { User } from '@/types/domain';

import { applyStudentToCache, invalidateStudents } from './students-cache';

export const correctStudentId = ({
  studentId,
  student_id,
}: {
  studentId: number;
  student_id: string;
}): Promise<User> =>
  unwrap<User>(
    api.patch(`/admin/students/${studentId}/student-id`, {
      student_id,
    }),
  );

export const useCorrectStudentId = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: correctStudentId,
    onSuccess: (student) => {
      applyStudentToCache(queryClient, student);
      invalidateStudents(queryClient);
    },
  });
};
