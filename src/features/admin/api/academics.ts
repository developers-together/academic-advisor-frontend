import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type {
  AcademicsImportDataset,
  AcademicsImportReport,
  CurrentTerm,
} from '@/types/domain';

export const importAcademicsDataset = (
  dataset: AcademicsImportDataset,
  file: File,
): Promise<AcademicsImportReport> => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/admin/imports/${dataset}`, form);
};

const adminQueriesByDataset: Record<
  AcademicsImportDataset,
  readonly QueryKey[]
> = {
  statistics: [],
  'active-courses': [['admin', 'courses']],
  'credit-allowances': [],
  curricula: [['admin', 'courses']],
};

export const useImportAcademicsDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dataset,
      file,
    }: {
      dataset: AcademicsImportDataset;
      file: File;
    }) => importAcademicsDataset(dataset, file),
    onSuccess: (_report, { dataset }) => {
      for (const queryKey of adminQueriesByDataset[dataset]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
};

type ApiCurrentTerm = {
  term_code: string;
  term_kind: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  term_starts_at: string | null;
};

/** Date inputs need the calendar day, not the full ISO instant. */
const dayOf = (value: string | null): string => value?.slice(0, 10) ?? '';

const fromApi = (term: ApiCurrentTerm | null): CurrentTerm | null =>
  term === null
    ? null
    : {
        code: term.term_code,
        kind: term.term_kind,
        opens: dayOf(term.registration_opens_at),
        closes: dayOf(term.registration_closes_at),
        starts: dayOf(term.term_starts_at),
      };

export const getCurrentTerm = (): Promise<CurrentTerm | null> =>
  unwrap<ApiCurrentTerm | null>(api.get('/admin/current-term')).then(fromApi);

export const currentTermQueryKey = ['admin', 'current-term'] as const;

export const getCurrentTermQueryOptions = () =>
  queryOptions({
    queryKey: currentTermQueryKey,
    queryFn: getCurrentTerm,
    staleTime: 60 * 1000,
  });

export const useCurrentTerm = () => useQuery(getCurrentTermQueryOptions());

export const useUpdateCurrentTerm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CurrentTerm): Promise<CurrentTerm | null> =>
      unwrap<ApiCurrentTerm>(
        api.put('/admin/current-term', {
          term_code: input.code,
          term_kind: input.kind,
          registration_opens_at: input.opens,
          registration_closes_at: input.closes,
          term_starts_at: input.starts,
        }),
      ).then(fromApi),
    onSuccess: (term) => {
      queryClient.setQueryData(currentTermQueryKey, term);
    },
  });
};

export const useRevokeSisMirror = () =>
  useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post('/admin/sis/revoke');
    },
  });
