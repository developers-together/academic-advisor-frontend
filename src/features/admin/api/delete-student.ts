import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { invalidateStudents, removeStudentFromCache } from './students-cache';

export const deleteStudent = (studentId: number): Promise<void> =>
  api.delete(`/admin/students/${studentId}`);

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: (_result, studentId) => {
      removeStudentFromCache(queryClient, studentId);
      invalidateStudents(queryClient);
    },
  });
};
