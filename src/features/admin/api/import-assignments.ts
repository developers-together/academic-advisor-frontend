import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { ImportSummary } from '@/types/domain';

import { invalidatePendingAssignments } from './pending-assignments-cache';

export const importAssignments = (file: File): Promise<ImportSummary> => {
  const form = new FormData();
  form.append('file', file);
  return unwrap<ImportSummary>(api.post('/admin/assignments/import', form));
};

export const useImportAssignments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importAssignments,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      invalidatePendingAssignments(queryClient);
    },
  });
};
