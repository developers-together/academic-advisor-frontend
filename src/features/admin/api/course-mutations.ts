import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { AdminCourse } from '@/types/domain';

export type CourseInput = {
  code: string;
  title_en: string;
  title_ar: string | null;
  credits: number;
  level: number | null;
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CourseInput): Promise<AdminCourse> =>
      unwrap<AdminCourse>(api.post('/admin/courses', input)),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: Partial<CourseInput>;
    }): Promise<AdminCourse> =>
      unwrap<AdminCourse>(api.put(`/admin/courses/${id}`, input)),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/courses/${id}`),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });
};
