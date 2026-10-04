import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { AssignAdvisorResult } from '@/types/domain';

import {
  prependPendingAssignmentToCache,
  invalidatePendingAssignments,
} from './pending-assignments-cache';
import { applyStudentToCache, invalidateStudents } from './students-cache';

export type AssignAdvisorInput = {
  student_id: string;
  advisor_email: string;
};

export const assignAdvisor = (
  input: AssignAdvisorInput,
): Promise<AssignAdvisorResult> =>
  unwrap<AssignAdvisorResult>(api.post('/admin/assignments', input));

export const useAssignAdvisor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignAdvisor,
    onSuccess: (result) => {
      if (result.mode === 'assigned' && result.student) {
        applyStudentToCache(queryClient, result.student);
        invalidateStudents(queryClient);
      }
      if (result.mode === 'scheduled' && result.assignment) {
        prependPendingAssignmentToCache(queryClient, result.assignment);
      }
      invalidatePendingAssignments(queryClient);
    },
  });
};
