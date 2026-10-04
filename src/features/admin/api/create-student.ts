import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { LanguagePreference, User } from '@/types/domain';

import { invalidateStudents, prependStudentToCache } from './students-cache';

export type CreateStudentInput = {
  student_id: string;
  name: string;
  password: string;
  language_preference?: LanguagePreference;
};

export const createStudent = (input: CreateStudentInput): Promise<User> =>
  unwrap<User>(api.post('/admin/students', input));

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: (student) => {
      prependStudentToCache(queryClient, student);
      invalidateStudents(queryClient);
    },
  });
};
