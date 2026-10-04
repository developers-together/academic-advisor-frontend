import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap, unwrapList } from '@/lib/api-envelope';
import type { RegistrationWindow } from '@/types/domain';

export const getRegistrationWindows = (): Promise<RegistrationWindow[]> =>
  unwrapList<RegistrationWindow>(api.get('/admin/registration-windows'));

export const getRegistrationWindowsQueryOptions = () =>
  queryOptions({
    queryKey: ['admin', 'registration-windows'],
    queryFn: getRegistrationWindows,
    staleTime: 60 * 1000,
  });

export const useRegistrationWindows = () =>
  useQuery(getRegistrationWindowsQueryOptions());

export const useUpdateRegistrationWindow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: {
        is_active?: boolean;
        opens_at?: string;
        closes_at?: string;
      };
    }): Promise<RegistrationWindow> =>
      unwrap<RegistrationWindow>(
        api.put(`/admin/registration-windows/${id}`, input),
      ),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'registration-windows'],
      }),
  });
};
