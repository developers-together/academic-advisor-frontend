import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { AcademicRecord } from '@/types/domain';

export const getAcademicRecord = (): Promise<AcademicRecord> =>
  unwrap<AcademicRecord>(api.get('/academic-record'));

export const getAcademicRecordQueryOptions = () =>
  queryOptions({
    queryKey: ['academic-record'],
    queryFn: getAcademicRecord,
    staleTime: 5 * 60 * 1000,
  });

export const useAcademicRecord = () =>
  useQuery(getAcademicRecordQueryOptions());

export const buildCourseTitleIndex = (record: AcademicRecord | undefined) => {
  const index = new Map<string, string>();
  if (record) {
    for (const entry of record.prerequisite_map) {
      index.set(entry.course_code, entry.title ?? entry.course_code);
    }
  }
  return index;
};
