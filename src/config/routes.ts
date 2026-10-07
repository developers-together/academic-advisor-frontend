import {
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CircleUser,
  ClipboardList,
  FileText,
  FolderCog,
  GraduationCap,
  House,
  LayoutDashboard,
  MessagesSquare,
  ScrollText,
  Settings2,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { paths } from '@/config/paths';
import type { UserRole } from '@/types/domain';

export type RouteKind = 'page' | 'redirect';

export type NavPlacement = 'primary' | 'more' | 'group' | 'none';

export type MobilePlacement = 'bar' | 'sheet';

export type RouteRole = UserRole | 'auth' | 'public';

export type RoleRouteDefinition = {
  id: string;
  path: string;
  kind: RouteKind;
  role: RouteRole;
  labelKey?: string;
  icon?: LucideIcon;
  nav: NavPlacement;
  groupKey?: string;
  mobile?: MobilePlacement;
  command?: boolean;
  parent?: string;
  index?: boolean;
  end?: boolean;
  redirectTo?: string;
};

const student: RoleRouteDefinition[] = [
  {
    id: 'app.home',
    path: paths.app.root.getHref(),
    kind: 'page',
    role: 'student',
    labelKey: 'nav.home',
    icon: House,
    nav: 'primary',
    mobile: 'bar',
    command: true,
    index: true,
    end: true,
  },
  {
    id: 'app.plan',
    path: paths.app.plan.getHref(),
    kind: 'page',
    role: 'student',
    labelKey: 'nav.myPlan',
    icon: FileText,
    nav: 'primary',
    mobile: 'bar',
    command: true,
  },
  {
    id: 'app.builder',
    path: paths.app.builder.getHref(),
    kind: 'page',
    role: 'student',
    labelKey: 'nav.builder',
    icon: FileText,
    nav: 'none',
    command: false,
    parent: 'app.plan',
  },
  {
    id: 'app.record',
    path: paths.app.record.getHref(),
    kind: 'page',
    role: 'student',
    labelKey: 'nav.academicRecord',
    icon: BookOpen,
    nav: 'primary',
    command: true,
  },
  {
    id: 'app.rules',
    path: paths.app.rules.getHref(),
    kind: 'page',
    role: 'student',
    labelKey: 'nav.rules',
    icon: ScrollText,
    nav: 'none',
    command: false,
  },
  {
    id: 'app.chat',
    path: paths.app.chat.getHref(),
    kind: 'page',
    role: 'student',
    labelKey: 'nav.aiAdvisor',
    icon: MessagesSquare,
    nav: 'primary',
    mobile: 'bar',
    command: true,
  },
  {
    id: 'app.conversation',
    path: '/app/chat/:conversationId',
    kind: 'page',
    role: 'student',
    labelKey: 'nav.aiAdvisor',
    icon: MessagesSquare,
    nav: 'none',
    command: false,
    parent: 'app.chat',
  },
  {
    id: 'app.advisor',
    path: paths.app.advisor.getHref(),
    kind: 'page',
    role: 'student',
    labelKey: 'nav.myAdvisor',
    icon: UserCheck,
    nav: 'primary',
    mobile: 'bar',
    command: true,
  },
  {
    id: 'app.notifications',
    path: paths.app.notifications.getHref(),
    kind: 'page',
    role: 'student',
    labelKey: 'nav.notifications',
    icon: Bell,
    nav: 'primary',
    command: true,
  },
  {
    id: 'app.account',
    path: paths.app.account.getHref(),
    kind: 'page',
    role: 'student',
    labelKey: 'nav.account',
    icon: CircleUser,
    nav: 'primary',
    command: true,
  },
  {
    id: 'app.profile',
    path: paths.app.profile.getHref(),
    kind: 'redirect',
    role: 'student',
    nav: 'none',
    redirectTo: paths.app.account.getHref(),
  },
];

const advisor: RoleRouteDefinition[] = [
  {
    id: 'advisor.queue',
    path: paths.advisor.root.getHref(),
    kind: 'page',
    role: 'advisor',
    labelKey: 'nav.queue',
    icon: ClipboardList,
    nav: 'primary',
    mobile: 'bar',
    command: true,
    index: true,
    end: true,
  },
  {
    id: 'advisor.students',
    path: paths.advisor.students.getHref(),
    kind: 'page',
    role: 'advisor',
    labelKey: 'nav.students',
    icon: Users,
    nav: 'primary',
    mobile: 'bar',
    command: true,
  },
  {
    id: 'advisor.meetings',
    path: paths.advisor.meetings.getHref(),
    kind: 'page',
    role: 'advisor',
    labelKey: 'nav.meetings',
    icon: CalendarCheck,
    nav: 'primary',
    mobile: 'bar',
    command: true,
  },
  {
    id: 'advisor.hours',
    path: paths.advisor.hours.getHref(),
    kind: 'page',
    role: 'advisor',
    labelKey: 'nav.hours',
    icon: CalendarClock,
    nav: 'more',
    command: true,
  },
  {
    id: 'advisor.profile',
    path: paths.advisor.profile.getHref(),
    kind: 'page',
    role: 'advisor',
    labelKey: 'nav.profile',
    icon: UserCheck,
    nav: 'more',
    command: true,
  },
  {
    id: 'advisor.notifications',
    path: paths.advisor.notifications.getHref(),
    kind: 'page',
    role: 'advisor',
    labelKey: 'nav.notifications',
    icon: Bell,
    nav: 'more',
    command: true,
  },
];

const dean: RoleRouteDefinition[] = [
  {
    id: 'dean.overview',
    path: paths.dean.root.getHref(),
    kind: 'page',
    role: 'dean',
    labelKey: 'nav.overview',
    icon: LayoutDashboard,
    nav: 'primary',
    mobile: 'bar',
    command: true,
    index: true,
    end: true,
  },
  {
    id: 'dean.advisors',
    path: paths.dean.advisors.getHref(),
    kind: 'page',
    role: 'dean',
    labelKey: 'nav.advisors',
    icon: Users,
    nav: 'primary',
    mobile: 'bar',
    command: true,
  },
  {
    id: 'dean.analytics',
    path: paths.dean.analytics.getHref(),
    kind: 'page',
    role: 'dean',
    labelKey: 'nav.analytics',
    icon: TrendingUp,
    nav: 'primary',
    mobile: 'bar',
    command: true,
  },
  {
    id: 'dean.notifications',
    path: paths.dean.notifications.getHref(),
    kind: 'page',
    role: 'dean',
    labelKey: 'nav.notifications',
    icon: Bell,
    nav: 'more',
    command: true,
  },
];

const vp: RoleRouteDefinition[] = [
  {
    id: 'vp.overview',
    path: paths.vp.root.getHref(),
    kind: 'page',
    role: 'vp',
    labelKey: 'nav.overview',
    icon: LayoutDashboard,
    nav: 'primary',
    mobile: 'bar',
    command: true,
    index: true,
    end: true,
  },
  {
    id: 'vp.faculties',
    path: paths.vp.faculties.getHref(),
    kind: 'page',
    role: 'vp',
    labelKey: 'nav.faculties',
    icon: GraduationCap,
    nav: 'primary',
    mobile: 'bar',
    command: true,
  },
  {
    id: 'vp.drilldown',
    path: '/vp/drilldown',
    kind: 'page',
    role: 'vp',
    labelKey: 'nav.drilldown',
    icon: GraduationCap,
    nav: 'none',
    command: false,
    parent: 'vp.faculties',
  },
  {
    id: 'vp.trends',
    path: paths.vp.trends.getHref(),
    kind: 'page',
    role: 'vp',
    labelKey: 'nav.trends',
    icon: TrendingUp,
    nav: 'primary',
    mobile: 'bar',
    command: true,
  },
  {
    id: 'vp.notifications',
    path: paths.vp.notifications.getHref(),
    kind: 'page',
    role: 'vp',
    labelKey: 'nav.notifications',
    icon: Bell,
    nav: 'more',
    command: true,
  },
];

const admin: RoleRouteDefinition[] = [
  {
    id: 'admin.overview',
    path: paths.admin.root.getHref(),
    kind: 'page',
    role: 'admin',
    labelKey: 'nav.overview',
    icon: LayoutDashboard,
    nav: 'primary',
    mobile: 'bar',
    command: true,
    index: true,
    end: true,
  },
  {
    id: 'admin.users',
    path: '/admin/users',
    kind: 'page',
    role: 'admin',
    labelKey: 'nav.users',
    icon: Users,
    nav: 'primary',
    mobile: 'bar',
    command: true,
  },
  {
    id: 'admin.operations',
    path: paths.admin.operations.getHref(),
    kind: 'page',
    role: 'admin',
    labelKey: 'nav.operations',
    icon: FolderCog,
    nav: 'primary',
    mobile: 'bar',
    command: true,
  },
  {
    id: 'admin.assignments',
    path: paths.admin.assignments.getHref(),
    kind: 'page',
    role: 'admin',
    labelKey: 'nav.assignments',
    icon: GraduationCap,
    nav: 'group',
    groupKey: 'nav.operations',
    command: true,
    parent: 'admin.operations',
  },
  {
    id: 'admin.courses',
    path: paths.admin.courses.getHref(),
    kind: 'page',
    role: 'admin',
    labelKey: 'nav.courses',
    icon: FileText,
    nav: 'group',
    groupKey: 'nav.operations',
    command: true,
    parent: 'admin.operations',
  },
  {
    id: 'admin.programs',
    path: paths.admin.programs.getHref(),
    kind: 'page',
    role: 'admin',
    labelKey: 'nav.programs',
    icon: BookOpen,
    nav: 'group',
    groupKey: 'nav.operations',
    command: true,
    parent: 'admin.operations',
  },
  {
    id: 'admin.rules',
    path: paths.admin.rules.getHref(),
    kind: 'page',
    role: 'admin',
    labelKey: 'nav.rules',
    icon: ScrollText,
    nav: 'group',
    groupKey: 'nav.operations',
    command: true,
    parent: 'admin.operations',
  },
  {
    id: 'admin.registration-windows',
    path: paths.admin.registrationWindows.getHref(),
    kind: 'page',
    role: 'admin',
    labelKey: 'nav.registrationWindows',
    icon: CalendarClock,
    nav: 'group',
    groupKey: 'nav.operations',
    command: true,
    parent: 'admin.operations',
  },
  {
    id: 'admin.ai-configuration',
    path: paths.admin.aiConfiguration.getHref(),
    kind: 'page',
    role: 'admin',
    labelKey: 'nav.aiConfiguration',
    icon: Sparkles,
    nav: 'group',
    groupKey: 'nav.operations',
    command: true,
    parent: 'admin.operations',
  },
  {
    id: 'admin.notifications',
    path: paths.admin.notifications.getHref(),
    kind: 'page',
    role: 'admin',
    labelKey: 'nav.notifications',
    icon: Bell,
    nav: 'group',
    groupKey: 'nav.operations',
    command: true,
    parent: 'admin.operations',
  },
  {
    id: 'admin.students',
    path: '/admin/students',
    kind: 'redirect',
    role: 'admin',
    nav: 'none',
    redirectTo: '/admin/users',
  },
  {
    id: 'admin.staff',
    path: '/admin/staff',
    kind: 'redirect',
    role: 'admin',
    nav: 'none',
    redirectTo: '/admin/users',
  },
  {
    id: 'admin.settings',
    path: paths.admin.settings.getHref(),
    kind: 'redirect',
    role: 'admin',
    nav: 'none',
    redirectTo: paths.admin.root.getHref(),
  },
];

const auth: RoleRouteDefinition[] = [
  {
    id: 'root',
    path: '/',
    kind: 'page',
    role: 'public',
    icon: House,
    nav: 'none',
    command: false,
  },
  {
    id: 'auth.login',
    path: paths.auth.login.path,
    kind: 'page',
    role: 'auth',
    labelKey: 'nav.login',
    icon: UserCheck,
    nav: 'none',
    command: false,
  },
  {
    id: 'auth.signup',
    path: paths.auth.signup.path,
    kind: 'page',
    role: 'auth',
    labelKey: 'nav.signup',
    icon: UserCheck,
    nav: 'none',
    command: false,
  },
  {
    id: 'auth.forgot-password',
    path: paths.auth.forgotPassword.path,
    kind: 'page',
    role: 'auth',
    labelKey: 'nav.forgotPassword',
    icon: Settings2,
    nav: 'none',
    command: false,
  },
  {
    id: 'auth.verify-email',
    path: paths.auth.verifyEmail.path,
    kind: 'page',
    role: 'auth',
    labelKey: 'nav.verifyEmail',
    icon: Settings2,
    nav: 'none',
    command: false,
  },
  {
    id: 'not-found',
    path: '*',
    kind: 'page',
    role: 'public',
    nav: 'none',
    command: false,
  },
];

export const routeTable: RoleRouteDefinition[] = [
  ...student,
  ...advisor,
  ...dean,
  ...vp,
  ...admin,
  ...auth,
];

const navigable = (route: RoleRouteDefinition) => route.nav !== 'none';

export const roleRoutes = (role: UserRole): RoleRouteDefinition[] =>
  routeTable.filter((route) => route.role === role && navigable(route));

export const commandRoutes = (role: UserRole): RoleRouteDefinition[] =>
  routeTable.filter((route) => route.role === role && route.command === true);

export const routeById = (id: string): RoleRouteDefinition | undefined =>
  routeTable.find((route) => route.id === id);

export const matchRoute = (
  pathname: string,
): RoleRouteDefinition | undefined => {
  const segments = pathname.split('/').filter(Boolean);
  let best: RoleRouteDefinition | undefined;
  let bestLength = -1;
  for (const route of routeTable) {
    if (route.kind === 'redirect') continue;
    const pattern = route.path.split('/').filter(Boolean);
    if (pattern.length !== segments.length) continue;
    const ok = pattern.every(
      (part, index) => part.startsWith(':') || part === segments[index],
    );
    if (ok && pattern.length > bestLength) {
      best = route;
      bestLength = pattern.length;
    }
  }
  return best;
};

export type BreadcrumbEntry = { labelKey: string; to?: string };

export const breadcrumbTrail = (pathname: string): BreadcrumbEntry[] => {
  let current = matchRoute(pathname);
  if (!current || !current.parent) return [];
  const trail: BreadcrumbEntry[] = [];
  let guard = 0;
  while (current?.parent && guard < 8) {
    const parent = routeById(current.parent);
    if (!parent) break;
    trail.unshift({ labelKey: parent.labelKey ?? '', to: parent.path });
    current = parent;
    guard += 1;
  }
  return trail;
};
