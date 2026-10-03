import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { adminRulesQueryKey } from './get-admin-rules';

export const deleteRule = (ruleId: number): Promise<void> =>
  api.delete(`/admin/rules/${ruleId}`);

export const useDeleteRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRule,
    onSuccess: (_result, ruleId) => {
      queryClient.setQueriesData<unknown[]>(
        { queryKey: adminRulesQueryKey },
        (rules) =>
          rules
            ? rules.filter((rule) => (rule as { id: number }).id !== ruleId)
            : rules,
      );
      void queryClient.invalidateQueries({ queryKey: adminRulesQueryKey });
    },
  });
};
