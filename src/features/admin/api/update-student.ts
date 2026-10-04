import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { LanguagePreference, User } from '@/types/domain';

import { adminStudentQueryKey } from './get-admin-student';
import { applyStudentToCache, invalidateStudents } from './students-cache';

export type UpdateStudentInput = {
  name?: string;
  language_preference?: LanguagePreference;
};

export const updateStudent = ({
  studentId,
  input,
}: {
  studentId: number;
  input: UpdateStudentInput;
}): Promise<User> =>
  unwrap<User>(api.patch(`/admin/students/${studentId}`, input));

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStudent,
    onSuccess: (student, { studentId }) => {
      applyStudentToCache(queryClient, student);
      queryClient.setQueryData(adminStudentQueryKey(studentId), student);
      invalidateStudents(queryClient);
    },
  });
};
