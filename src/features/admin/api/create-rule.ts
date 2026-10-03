import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { UniversityRule, UniversityRuleInput } from '@/types/domain';

import { adminRulesQueryKey } from './get-admin-rules';

export const createRule = (
  input: UniversityRuleInput,
): Promise<UniversityRule> =>
  unwrap<UniversityRule>(api.post('/admin/rules', input));

export const useCreateRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRule,
    onSuccess: (rule) => {
      queryClient.setQueriesData<UniversityRule[]>(
        { queryKey: adminRulesQueryKey },
        (rules) =>
          rules ? [rule, ...rules.filter((row) => row.id !== rule.id)] : rules,
      );
      void queryClient.invalidateQueries({ queryKey: adminRulesQueryKey });
    },
  });
};
