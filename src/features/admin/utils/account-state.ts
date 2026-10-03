import type { User } from '@/types/domain';

export type AccountStatus = 'active' | 'suspended';

export type AccountBinding = 'bound' | 'pending' | 'failed';

export const accountStatus = (user: User): AccountStatus =>
  user.suspended_at ? 'suspended' : 'active';

export const accountBinding = (user: User): AccountBinding => {
  if (user.student_id) {
    return 'bound';
  }
  return user.pending_admin_at ? 'failed' : 'pending';
};

export const accountAssigned = (user: User): boolean =>
  user.advisor_id !== null;
