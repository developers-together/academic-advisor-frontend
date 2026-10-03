import { api } from '@/lib/api-client';

export const governanceCsvName = (term: string) => `governance-${term}.csv`;

export const exportGovernanceCsv = async (): Promise<string> =>
  api.get('/governance/export', {
    responseType: 'text',
    transformResponse: (data: string) => data,
  }) as Promise<string>;

export const downloadGovernanceCsv = (csv: string, term: string) => {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = governanceCsvName(term);
  anchor.click();
  URL.revokeObjectURL(url);
};
