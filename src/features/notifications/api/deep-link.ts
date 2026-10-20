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

type ScreenHref = string | ((link: DeepLink) => string);

const screenHrefs: Record<
  DeepLink['screen'],
  Partial<Record<UserRole, ScreenHref>>
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
  staff: {
    admin: (link) =>
      paths.admin.users.getHref({
        tab: 'staff',
        role: link.role ?? 'awaiting_role',
      }),
  },
};

export const deepLinkHref = (
  link: DeepLink | string | null,
  role: UserRole,
): string => {
  if (!link || typeof link === 'string') {
    return roleLanding[role];
  }
  const href = screenHrefs[link.screen]?.[role];
  if (!href) {
    return roleLanding[role];
  }
  return typeof href === 'function' ? href(link) : href;
};
