import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import type { User } from '@/types/domain';

export type CreateStaffInput = {
  name: string;
  email: string;
  password: string;
  role: 'advisor' | 'dean' | 'vp' | 'admin';
  faculty?: string;
};

export const createStaff = (input: CreateStaffInput): Promise<User> =>
  unwrap<User>(api.post('/admin/staff', input));

export const useCreateStaff = () => useMutation({ mutationFn: createStaff });
