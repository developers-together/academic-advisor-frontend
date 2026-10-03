import type { QueryClient } from '@tanstack/react-query';

import type { Page } from '@/lib/api-envelope';
import type { User } from '@/types/domain';

const STUDENTS_ROOT = ['admin', 'students'] as const;

export const applyStudentToCache = (
  queryClient: QueryClient,
  student: User,
) => {
  queryClient.setQueriesData<Page<User>>({ queryKey: STUDENTS_ROOT }, (page) =>
    page
      ? {
          ...page,
          items: page.items.map((row) =>
            row.id === student.id ? student : row,
          ),
        }
      : page,
  );
};

export const removeStudentFromCache = (
  queryClient: QueryClient,
  studentId: number,
) => {
  queryClient.setQueriesData<Page<User>>({ queryKey: STUDENTS_ROOT }, (page) =>
    page
      ? { ...page, items: page.items.filter((row) => row.id !== studentId) }
      : page,
  );
};

export const invalidateStudents = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: STUDENTS_ROOT });
};
