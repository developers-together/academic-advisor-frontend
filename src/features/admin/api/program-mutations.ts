import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { AdminProgram } from '@/types/domain';

export type ProgramInput = {
  code: string;
  name_en: string;
  name_ar: string | null;
  faculty: string | null;
};

export const useCreateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProgramInput): Promise<AdminProgram> =>
      unwrap<AdminProgram>(api.post('/admin/programs', input)),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] }),
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: Partial<ProgramInput>;
    }): Promise<AdminProgram> =>
      unwrap<AdminProgram>(api.put(`/admin/programs/${id}`, input)),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] }),
  });
};
