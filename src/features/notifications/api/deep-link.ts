import { paths } from '@/config/paths';
import { roleLanding } from '@/lib/auth';
import type { DeepLink, UserRole } from '@/types/domain';

export const sectionNotificationsPath: Record<UserRole, string> = {
  student: paths.app.notifications.getHref(),
  advisor: paths.advisor.notifications.getHref(),
  dean: paths.dean.notifications.getHref(),
  vp: paths.vp.notifications.getHref(),
  admin: paths.admin.notifications.getHref(),
};

const screenHrefs: Record<
  DeepLink['screen'],
  Partial<Record<UserRole, string>>
> = {
  plan: {
    student: paths.app.plan.getHref(),
  },
  student: {
    advisor: paths.advisor.students.getHref(),
  },
  advisor: {
    student: paths.app.advisor.getHref(),
  },
  visit: {
    advisor: paths.advisor.meetings.getHref(),
    student: paths.app.advisor.getHref(),
  },
};

export const deepLinkHref = (
  link: DeepLink | string | null,
  role: UserRole,
): string => {
  if (!link || typeof link === 'string') {
    return roleLanding[role];
  }
  return screenHrefs[link.screen]?.[role] ?? roleLanding[role];
};
