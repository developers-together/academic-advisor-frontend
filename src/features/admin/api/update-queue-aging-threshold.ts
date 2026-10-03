import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { QueueAgingThreshold } from '@/types/domain';

import { adminSettingsQueryKey } from './get-queue-aging-threshold';

export const updateQueueAgingThreshold = (
  days: number,
): Promise<QueueAgingThreshold> =>
  unwrap<QueueAgingThreshold>(
    api.put('/admin/settings/queue-aging-threshold', { days }),
  );

export const useUpdateQueueAgingThreshold = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateQueueAgingThreshold,
    onSuccess: (threshold) => {
      queryClient.setQueryData(adminSettingsQueryKey, threshold);
    },
  });
};
