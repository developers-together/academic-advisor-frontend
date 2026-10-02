import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { Plan } from '@/types/domain';

export const updatePlanCourse = ({
  courseCode,
  group,
  section,
}: {
  courseCode: string;
  group?: string;
  section?: string;
}): Promise<Plan> =>
  unwrap<Plan>(
    api.patch(
      `/plan/courses/${encodeURIComponent(courseCode)}`,
      omitUndefined({ group, section }),
    ),
  );

const omitUndefined = (body: { group?: string; section?: string }) =>
  Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  );

export const useUpdatePlanCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePlanCourse,
    onSuccess: (plan) => {
      queryClient.setQueryData(['plan'], plan);
    },
  });
};
