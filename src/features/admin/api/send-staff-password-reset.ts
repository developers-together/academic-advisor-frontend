import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export const sendStaffPasswordReset = (staffId: number): Promise<void> =>
  api.post(`/admin/staff/${staffId}/password-reset`);

export const useSendStaffPasswordReset = () =>
  useMutation({ mutationFn: sendStaffPasswordReset });
