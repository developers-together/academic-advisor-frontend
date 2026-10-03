import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { UniversityRule, UniversityRuleInput } from '@/types/domain';

import { adminRulesQueryKey } from './get-admin-rules';

export const updateRule = ({
  ruleId,
  input,
}: {
  ruleId: number;
  input: UniversityRuleInput;
}): Promise<UniversityRule> =>
  unwrap<UniversityRule>(api.put(`/admin/rules/${ruleId}`, input));

export const useUpdateRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRule,
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
