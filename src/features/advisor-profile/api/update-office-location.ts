import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { OfficeLocation } from '@/types/domain';

export const updateOfficeLocation = (
  officeLocation: string | null,
): Promise<OfficeLocation> =>
  unwrap<OfficeLocation>(
    api.put('/advisor/office-location', { office_location: officeLocation }),
  );

export const useUpdateOfficeLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOfficeLocation,
    onSuccess: (officeLocation) => {
      queryClient.setQueryData(['advisor', 'office-location'], officeLocation);
    },
  });
};
