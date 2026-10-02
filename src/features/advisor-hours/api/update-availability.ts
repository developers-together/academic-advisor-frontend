import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { AvailabilityWindow, AvailabilityWindowRow } from '@/types/domain';

export const updateAvailability = (
  rows: AvailabilityWindowRow[],
): Promise<AvailabilityWindow> =>
  unwrap<AvailabilityWindow>(api.put('/advisor/availability', { rows }));

export const useUpdateAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAvailability,
    onSuccess: (availability) => {
      queryClient.setQueryData(['advisor', 'availability'], availability);
    },
  });
};
