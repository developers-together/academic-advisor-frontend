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
    profile: {
      path: 'profile',
      getHref: () => '/app/profile',
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
    drilldown: {
      path: 'drilldown',
      getHref: (node?: string) => `/vp/drilldown${node ? `?node=${node}` : ''}`,
    },
    notifications: {
      path: 'notifications',
      getHref: () => '/vp/notifications',
    },
  },

  admin: {
    root: {
      path: '/admin',
      getHref: () => '/admin/students',
    },
    students: {
      path: 'students',
      getHref: () => '/admin/students',
    },
    assignments: {
      path: 'assignments',
      getHref: () => '/admin/assignments',
    },
    rules: {
      path: 'rules',
      getHref: () => '/admin/rules',
    },
    staff: {
      path: 'staff',
      getHref: () => '/admin/staff',
    },
    settings: {
      path: 'settings',
      getHref: () => '/admin/settings',
    },
    notifications: {
      path: 'notifications',
      getHref: () => '/admin/notifications',
    },
  },
} as const;
