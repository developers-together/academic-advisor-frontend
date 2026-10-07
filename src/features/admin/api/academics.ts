import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';

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
  return unwrap<AcademicsImportReport>(
    api.post(`/admin/imports/${dataset}`, form),
  );
};

export const useImportAcademicsDataset = () =>
  useMutation({
    mutationFn: ({
      dataset,
      file,
    }: {
      dataset: AcademicsImportDataset;
      file: File;
    }) => importAcademicsDataset(dataset, file),
  });

export const getCurrentTerm = (): Promise<CurrentTerm> =>
  unwrap<CurrentTerm>(api.get('/admin/current-term'));

export const getCurrentTermQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'current-term'],
    queryFn: getCurrentTerm,
    staleTime: 60 * 1000,
  });

export const useCurrentTerm = () => useQuery(getCurrentTermQueryOptions());

export const useUpdateCurrentTerm = () =>
  useMutation({
    mutationFn: (input: CurrentTerm): Promise<CurrentTerm> =>
      unwrap<CurrentTerm>(api.put('/admin/current-term', input)),
  });

export const useRevokeSisMirror = () =>
  useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post('/admin/sis/revoke');
    },
  });
