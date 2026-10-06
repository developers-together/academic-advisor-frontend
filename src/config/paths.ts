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
    verifyEmail: {
      path: '/verify-email/:id/:hash',
      getHref: (id: string, hash: string) => `/verify-email/${id}/${hash}`,
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
      getHref: () => '/admin/users',
    },
    students: {
      path: 'students',
      getHref: () => '/admin/users',
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
    programs: {
      path: 'programs',
      getHref: () => '/admin/programs',
    },
    rules: {
      path: 'rules',
      getHref: () => '/admin/rules',
    },
    registrationWindows: {
      path: 'registration-windows',
      getHref: () => '/admin/registration-windows',
    },
    aiConfiguration: {
      path: 'ai-configuration',
      getHref: () => '/admin/ai-configuration',
    },
    staff: {
      path: 'staff',
      getHref: () => '/admin/users',
    },
    settings: {
      path: 'settings',
      getHref: () => '/admin',
    },
    notifications: {
      path: 'notifications',
      getHref: () => '/admin/notifications',
    },
  },
} as const;
