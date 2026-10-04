import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { paths } from '@/config/paths';

const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};

export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: paths.home.path,
      lazy: () => import('./routes/role-redirect').then(convert(queryClient)),
    },

    {
      path: paths.auth.login.path,
      lazy: () => import('./routes/auth/login').then(convert(queryClient)),
    },
    {
      path: paths.auth.signup.path,
      lazy: () => import('./routes/auth/signup').then(convert(queryClient)),
    },
    {
      path: paths.auth.forgotPassword.path,
      lazy: () =>
        import('./routes/auth/forgot-password').then(convert(queryClient)),
    },
    {
      path: paths.auth.verifyEmail.path,
      lazy: () =>
        import('./routes/auth/verify-email').then(convert(queryClient)),
    },

    {
      path: paths.app.root.path,
      lazy: () => import('./routes/app/shell').then(convert(queryClient)),
      children: [
        {
          index: true,
          lazy: () =>
            import('./routes/app/dashboard').then(convert(queryClient)),
        },
        {
          path: paths.app.plan.path,
          lazy: () => import('./routes/app/plan').then(convert(queryClient)),
        },
        {
          path: paths.app.builder.path,
          lazy: () => import('./routes/app/builder').then(convert(queryClient)),
        },
        {
          path: paths.app.profile.path,
          lazy: () => import('./routes/app/profile').then(convert(queryClient)),
        },
        {
          path: paths.app.chat.path,
          lazy: () => import('./routes/app/chat').then(convert(queryClient)),
        },
        {
          path: paths.app.conversation.path,
          lazy: () =>
            import('./routes/app/conversation').then(convert(queryClient)),
        },
        {
          path: paths.app.notifications.path,
          lazy: () =>
            import('./routes/app/notifications').then(convert(queryClient)),
        },
      ],
    },

    {
      path: paths.advisor.root.path,
      lazy: () => import('./routes/advisor/shell').then(convert(queryClient)),
      children: [
        {
          index: true,
          lazy: () =>
            import('./routes/advisor/index').then(convert(queryClient)),
        },
        {
          path: paths.advisor.students.path,
          lazy: () =>
            import('./routes/advisor/students').then(convert(queryClient)),
        },
        {
          path: paths.advisor.meetings.path,
          lazy: () =>
            import('./routes/advisor/meetings').then(convert(queryClient)),
        },
        {
          path: paths.advisor.hours.path,
          lazy: () =>
            import('./routes/advisor/hours').then(convert(queryClient)),
        },
        {
          path: paths.advisor.profile.path,
          lazy: () =>
            import('./routes/advisor/profile').then(convert(queryClient)),
        },
        {
          path: paths.advisor.notifications.path,
          lazy: () =>
            import('./routes/advisor/notifications').then(convert(queryClient)),
        },
      ],
    },

    {
      path: paths.dean.root.path,
      lazy: () => import('./routes/dean/shell').then(convert(queryClient)),
      children: [
        {
          index: true,
          lazy: () => import('./routes/dean/index').then(convert(queryClient)),
        },
        {
          path: paths.dean.notifications.path,
          lazy: () =>
            import('./routes/dean/notifications').then(convert(queryClient)),
        },
      ],
    },

    {
      path: paths.vp.root.path,
      lazy: () => import('./routes/vp/shell').then(convert(queryClient)),
      children: [
        {
          index: true,
          lazy: () => import('./routes/vp/index').then(convert(queryClient)),
        },
        {
          path: paths.vp.drilldown.path,
          lazy: () =>
            import('./routes/vp/drilldown').then(convert(queryClient)),
        },
        {
          path: paths.vp.notifications.path,
          lazy: () =>
            import('./routes/vp/notifications').then(convert(queryClient)),
        },
      ],
    },

    {
      path: paths.admin.root.path,
      lazy: () => import('./routes/admin/shell').then(convert(queryClient)),
      children: [
        {
          index: true,
          lazy: () => import('./routes/admin/index').then(convert(queryClient)),
        },
        {
          path: paths.admin.students.path,
          lazy: () =>
            import('./routes/admin/students').then(convert(queryClient)),
        },
        {
          path: paths.admin.assignments.path,
          lazy: () =>
            import('./routes/admin/assignments').then(convert(queryClient)),
        },
        {
          path: paths.admin.rules.path,
          lazy: () => import('./routes/admin/rules').then(convert(queryClient)),
        },
        {
          path: paths.admin.staff.path,
          lazy: () => import('./routes/admin/staff').then(convert(queryClient)),
        },
        {
          path: paths.admin.settings.path,
          lazy: () =>
            import('./routes/admin/settings').then(convert(queryClient)),
        },
        {
          path: paths.admin.notifications.path,
          lazy: () =>
            import('./routes/admin/notifications').then(convert(queryClient)),
        },
      ],
    },

    {
      path: '*',
      lazy: () => import('./routes/not-found').then(convert(queryClient)),
    },
  ]);

export const AppRouter = () => {
  const queryClient = useQueryClient();

  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

  return <RouterProvider router={router} />;
};
