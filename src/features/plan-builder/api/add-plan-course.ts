import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { Plan } from '@/types/domain';

export const addPlanCourse = ({
  courseCode,
}: {
  courseCode: string;
}): Promise<Plan> =>
  unwrap<Plan>(api.post('/plan/courses', { course_code: courseCode }));

export const useAddPlanCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addPlanCourse,
    onSuccess: (plan) => {
      queryClient.setQueryData(['plan'], plan);
    },
  });
};
