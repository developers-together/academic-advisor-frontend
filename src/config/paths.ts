import type { StaffAccountRole } from '@/types/domain';

export type AdminUsersQuery = {
  tab?: 'students' | 'staff';
  role?: StaffAccountRole;
};

export const paths = {
  home: {
    path: '/',
    getHref: () => '/',
  },

  auth: {
    login: {
      path: '/login',
      getHref: (redirectTo?: string | null | undefined) =>
        `/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    signup: {
      path: '/signup',
      getHref: () => '/signup',
    },
    forgotPassword: {
      path: '/forgot-password',
      getHref: () => '/forgot-password',
    },
    resetPassword: {
      path: '/reset-password',
      getHref: () => '/reset-password',
    },
    verifyEmail: {
      path: '/verify-email/:id/:hash',
      getHref: (id: string, hash: string) => `/verify-email/${id}/${hash}`,
    },
    microsoftCallback: {
      path: '/auth/microsoft/callback',
      getHref: () => '/auth/microsoft/callback',
    },
    awaitingRole: {
      path: '/auth/awaiting-role',
      getHref: () => '/auth/awaiting-role',
    },
  },

  app: {
    root: {
      path: '/app',
      getHref: () => '/app',
    },
    plan: {
      path: 'plan',
      getHref: () => '/app/plan',
    },
    builder: {
      path: 'builder',
      getHref: () => '/app/builder',
    },
    record: {
      path: 'record',
      getHref: () => '/app/record',
    },
    advisor: {
      path: 'advisor',
      getHref: () => '/app/advisor',
    },
    profile: {
      path: 'profile',
      getHref: () => '/app/account',
    },
    account: {
      path: 'account',
      getHref: () => '/app/account',
    },
    rules: {
      path: 'rules',
      getHref: () => '/app/rules',
    },
    chat: {
      path: 'chat',
      getHref: () => '/app/chat',
    },
    conversation: {
      path: 'chat/:conversationId',
      getHref: (id: string | number) => `/app/chat/${id}`,
    },
    notifications: {
      path: 'notifications',
      getHref: () => '/app/notifications',
    },
  },

  advisor: {
    root: {
      path: '/advisor',
      getHref: () => '/advisor',
    },
    students: {
      path: 'students',
      getHref: () => '/advisor/students',
    },
    meetings: {
      path: 'meetings',
      getHref: () => '/advisor/meetings',
    },
    hours: {
      path: 'hours',
      getHref: () => '/advisor/hours',
    },
    profile: {
      path: 'profile',
      getHref: () => '/advisor/profile',
    },
    notifications: {
      path: 'notifications',
      getHref: () => '/advisor/notifications',
    },
  },

  dean: {
    root: {
      path: '/dean',
      getHref: () => '/dean',
    },
    advisors: {
      path: 'advisors',
      getHref: () => '/dean/advisors',
    },
    analytics: {
      path: 'analytics',
      getHref: () => '/dean/analytics',
    },
    notifications: {
      path: 'notifications',
      getHref: () => '/dean/notifications',
    },
  },

  vp: {
    root: {
      path: '/vp',
      getHref: () => '/vp',
    },
    faculties: {
      path: 'faculties',
      getHref: () => '/vp/faculties',
    },
    drilldown: {
      path: 'drilldown',
      getHref: (node?: string) => `/vp/drilldown${node ? `?node=${node}` : ''}`,
    },
    trends: {
      path: 'trends',
      getHref: () => '/vp/trends',
    },
    notifications: {
      path: 'notifications',
      getHref: () => '/vp/notifications',
    },
  },

  admin: {
    root: {
      path: '/admin',
      getHref: () => '/admin',
    },
    users: {
      path: 'users',
      getHref: (query?: AdminUsersQuery) => {
        const params = new URLSearchParams();
        if (query?.tab) {
          params.set('tab', query.tab);
        }
        if (query?.role) {
          params.set('role', query.role);
        }
        const search = params.toString();
        return `/admin/users${search ? `?${search}` : ''}`;
      },
    },
    operations: {
      path: 'operations',
      getHref: () => '/admin/operations',
    },
    assignments: {
      path: 'assignments',
      getHref: () => '/admin/assignments',
    },
    courses: {
      path: 'courses',
      getHref: () => '/admin/courses',
    },
    rules: {
      path: 'rules',
      getHref: () => '/admin/rules',
    },
    registrationWindows: {
      path: 'registration-windows',
      getHref: () => '/admin/registration-windows',
    },
    academics: {
      path: 'academics',
      getHref: () => '/admin/academics',
    },
    aiConfiguration: {
      path: 'ai-configuration',
      getHref: () => '/admin/ai-configuration',
    },
    notifications: {
      path: 'notifications',
      getHref: () => '/admin/notifications',
    },
  },
} as const;
