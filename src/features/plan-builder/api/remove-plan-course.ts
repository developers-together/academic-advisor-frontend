import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { Plan } from '@/types/domain';

export const removePlanCourse = ({
  courseCode,
}: {
  courseCode: string;
}): Promise<Plan> =>
  unwrap<Plan>(api.delete(`/plan/courses/${encodeURIComponent(courseCode)}`));

export const useRemovePlanCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removePlanCourse,
    onSuccess: (plan) => {
      queryClient.setQueryData(['plan'], plan);
    },
  });
};
